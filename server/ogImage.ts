// Cloudinary social-card transform for Open Graph / Twitter share images.
//
// Event share cards declare og:image:width/height = 1200x630, so the served
// image must ACTUALLY be 1200x630 — otherwise WhatsApp/Facebook may distort or
// shrink the preview. For Cloudinary-hosted event photos we inject a delivery
// transformation that fill-crops to a 1200x630 card:
//
//   c_fill        — fill the 1200x630 box, cropping overflow (no letterboxing)
//   w_1200,h_630  — OG-recommended 1.91:1 social card dimensions
//   f_auto,q_auto — best format/quality per crawler; caps oversized originals
//
// Cropping depends on whether the organizer set a manual focal point:
//   - focal set   → a TWO-step chain centered on that point:
//                     c_crop,ar_1200:630,g_xy_center,fl_relative,x_<fx>,y_<fy>
//                     / c_fill,w_1200,h_630,f_auto,q_auto
//                   x/y are stored as integer percentages (0-100) and converted to
//                   Cloudinary RELATIVE coordinates via fl_relative (decimals
//                   strictly between 0 and 1 — bare 0/1 are read as PIXELS, so we
//                   clamp to 0.01..0.99 with toFixed). NOTE: g_xy_center is a crop
//                   gravity and is INVALID with c_fill (c_fill,g_xy_center → HTTP
//                   400), hence the crop-then-fill chain. This matches the
//                   object-position crop used in the DOM.
//   - focal null  → c_fill,g_auto (Cloudinary's auto subject detection) as the
//                   fallback, so events the user never positioned are unaffected.
//
// Guard: ONLY res.cloudinary.com delivery URLs are rewritten. Every other URL
// (the static og-image.png logo fallback, any non-Cloudinary host) is returned
// untouched.

const OG_CARD_SIZE = "w_1200,h_630,f_auto,q_auto";

function focalTransform(focalX?: number | null, focalY?: number | null): string {
  const hasFocal =
    focalX !== null && focalX !== undefined && !Number.isNaN(focalX) &&
    focalY !== null && focalY !== undefined && !Number.isNaN(focalY);

  if (!hasFocal) {
    return `c_fill,g_auto,${OG_CARD_SIZE}`;
  }

  // Convert a 0-100 percentage → Cloudinary RELATIVE coordinate. The value MUST
  // be a decimal string strictly between 0 and 1: Cloudinary reads a bare "0" or
  // "1" as a PIXEL offset (e.g. y_1 = 1px from the top), which puts the fill-crop
  // center out of bounds and returns HTTP 400. toFixed(2) guarantees a "0.NN"
  // form (0.01..0.99) — never "0", "1", or "1.00".
  const toFraction = (v: number): string => {
    const frac = Number.isFinite(v) ? v / 100 : 0.5;
    return Math.min(0.99, Math.max(0.01, frac)).toFixed(2);
  };
  const x = toFraction(focalX as number);
  const y = toFraction(focalY as number);
  // Two-step chain (verified against real Cloudinary URLs): g_xy_center is a CROP
  // gravity, NOT valid with c_fill, so c_fill,g_xy_center returns HTTP 400. Instead
  // c_crop a 1200:630-aspect region centered on the relative focal point
  // (fl_relative makes x/y fractions of the image), then c_fill/scale to the exact
  // card size. This inserts TWO components separated by "/" after /upload/.
  return `c_crop,ar_1200:630,g_xy_center,fl_relative,x_${x},y_${y}/c_fill,${OG_CARD_SIZE}`;
}

export function cloudinaryOgImage(
  url: string,
  focalX?: number | null,
  focalY?: number | null,
): string {
  if (!url || !url.includes("res.cloudinary.com")) return url;

  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url; // not a standard delivery URL — leave untouched

  const transform = focalTransform(focalX, focalY);

  // Idempotent: if this exact transform is already present, don't insert again.
  if (url.includes(`/upload/${transform}`)) return url;

  const before = url.slice(0, idx + marker.length); // "…/upload/"
  const after = url.slice(idx + marker.length);     // existing transforms + version + public_id

  // Insert our transform as the first chained component, immediately after
  // /upload/. If the event image already carries its own transforms, they stay
  // intact and chain after ours — the original path is preserved, just prefixed.
  return `${before}${transform}/${after}`;
}
