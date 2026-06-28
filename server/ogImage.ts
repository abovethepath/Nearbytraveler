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
// Gravity depends on whether the organizer set a manual focal point:
//   - focal set   → g_xy_center,x_<fx>,y_<fy> centers the crop on that point.
//                   x/y are stored as integer percentages (0-100) and converted
//                   to Cloudinary RELATIVE coordinates (decimals strictly between
//                   0 and 1 — whole 0/1 are read as pixels, so we clamp to
//                   0.01..0.99). This matches the object-position crop used in
//                   the DOM, so the share card frames the same region the user
//                   sees on the cards / detail page.
//   - focal null  → g_auto (Cloudinary's auto subject detection) as the fallback,
//                   so events the user never positioned are unaffected.
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

  // Convert 0-100 percentage → relative fraction, clamped to 0.01..0.99 so the
  // value is always a decimal between 0 and 1 (Cloudinary reads 0/1 as pixels).
  const toFraction = (v: number) => Math.min(99, Math.max(1, Math.round(v))) / 100;
  const x = toFraction(focalX as number);
  const y = toFraction(focalY as number);
  return `c_fill,g_xy_center,x_${x},y_${y},${OG_CARD_SIZE}`;
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
