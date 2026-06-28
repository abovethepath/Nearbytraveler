// Helpers for applying an event photo's manual focal point at render time.
//
// The focal point is stored on the event as two integer percentages (0-100):
// imageFocalX (horizontal) and imageFocalY (vertical). NULL = never positioned,
// in which case we fall back to centered (50% 50%) — matching the og:image
// g_auto fallback closely enough for the DOM.
//
// All event-photo render sites use CSS object-fit: cover (or background-size:
// cover), so a single focal point crops correctly at every aspect ratio.

function clampPct(v: number | null | undefined): number {
  if (v === null || v === undefined || Number.isNaN(v)) return 50;
  return Math.min(100, Math.max(0, v));
}

/** `object-position` value for an <img className="object-cover">. */
export function focalObjectPosition(
  focalX?: number | null,
  focalY?: number | null,
): string {
  return `${clampPct(focalX)}% ${clampPct(focalY)}%`;
}

/** `background-position` value for a `background-size: cover` element. */
export function focalBackgroundPosition(
  focalX?: number | null,
  focalY?: number | null,
): string {
  return `${clampPct(focalX)}% ${clampPct(focalY)}%`;
}
