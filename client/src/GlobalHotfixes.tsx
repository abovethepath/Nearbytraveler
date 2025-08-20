// src/GlobalHotfixes.tsx
import { useEffect } from "react";

export default function GlobalHotfixes() {
  useEffect(() => {
    if (document.getElementById("nt-hotfix")) return;
    const css = `
/* ===== Nearby Traveler Nuclear Hotfix ===== */

/* HERO: force pure blue text, strip ANY pill/badge styling applied by themes */
.hero-clean :where(h1) :where(span),
.hero-clean :where(h1) :where(span)::before,
.hero-clean :where(h1) :where(span)::after {
  background: transparent !important;
  background-image: none !important;
  border: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  content: none !important;
}
.hero-clean :where(h1) .hero-blue { color: rgb(59 130 246) !important; } /* blue-500 */

/* EVENTS: never overlay pills; render in normal flow so they can't collide */
.event-card .pills { position: static !important; inset: auto !important; margin-top: .5rem !important; }
.event-card .image-gradient { display: none !important; } /* remove dark scrim that overlaps text */

/* WRAP UTILITIES: use these classes anywhere text was spilling */
.wrap-any { overflow-wrap: anywhere !important; word-break: break-word !important; }
.minw0    { min-width: 0 !important; }
.text-left-important { text-align: left !important; }

/* MAP: enforce visible height + force children to fill the box */
.map-shell { position: relative; width: 100%; min-height: 320px; border-radius: .5rem; overflow: hidden; }
@media (min-width: 640px) { .map-shell { min-height: 400px; } }
.map-shell > * { height: 100% !important; width: 100% !important; }

/* Kill phantom horizontal scrollbars from 100vw etc */
html, body { overflow-x: hidden !important; }
`.trim();

    const style = document.createElement("style");
    style.id = "nt-hotfix";
    style.textContent = css;
    document.head.appendChild(style);
  }, []);
  return null;
}