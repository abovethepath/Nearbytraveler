// Cloudinary social-card transform for Open Graph / Twitter share images.
//
// Event share cards declare og:image:width/height = 1200x630, so the served
// image must ACTUALLY be 1200x630 — otherwise WhatsApp/Facebook may distort or
// shrink the preview to match the declared box. For Cloudinary-hosted event
// photos we inject a delivery transformation that crops to a true 1200x630 card
// around the focal point:
//
//   c_fill        — fill the 1200x630 box, cropping overflow (no letterboxing)
//   g_auto        — crop around the auto-detected focal point (faces/subject)
//   w_1200,h_630  — OG-recommended 1.91:1 social card dimensions
//   f_auto,q_auto — best format/quality per crawler; caps oversized originals
//
// Guard: ONLY res.cloudinary.com delivery URLs are rewritten. Every other URL
// (the static og-image.png logo fallback, any non-Cloudinary host) is returned
// untouched.

const OG_CARD_TRANSFORM = "c_fill,g_auto,w_1200,h_630,f_auto,q_auto";

export function cloudinaryOgImage(url: string): string {
  if (!url || !url.includes("res.cloudinary.com")) return url;

  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url; // not a standard delivery URL — leave untouched

  // Idempotent: if our card transform is already present, don't insert it again.
  if (url.includes(`/upload/${OG_CARD_TRANSFORM}`)) return url;

  const before = url.slice(0, idx + marker.length); // "…/upload/"
  const after = url.slice(idx + marker.length);     // existing transforms + version + public_id

  // Insert our transform as the first chained component, immediately after
  // /upload/. If the event image already carries its own transforms, they stay
  // intact and chain after ours — the original path is preserved, just prefixed.
  return `${before}${OG_CARD_TRANSFORM}/${after}`;
}
