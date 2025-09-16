// src/GlobalHotfixes.tsx
import { useEffect } from "react";

export default function GlobalHotfixes() {
  useEffect(() => {
    // Clear service worker cache to fix alert bug
    const clearCacheOnce = async () => {
      const cacheCleared = localStorage.getItem('cache-cleared-v4-force');
      if (!cacheCleared) {
        try {
          // Unregister all service workers
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
              await registration.unregister();
              console.log('🗑️ Service worker unregistered');
            }
          }

          // Clear all caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              await caches.delete(cacheName);
              console.log('🗑️ Cache cleared:', cacheName);
            }
          }

          // Mark as cleared
          localStorage.setItem('cache-cleared-v4-force', 'true');
          console.log('🎯 Cache cleared! Refreshing to load fresh code...');
          
          // Hard reload to ensure fresh code
          setTimeout(() => window.location.reload(), 100);
        } catch (error) {
          console.error('Cache clear error:', error);
        }
      }
    };

    clearCacheOnce();

    if (document.getElementById("nearby-hotfix")) return;
    const css = `
/* ===== Nearby Hotfix (chips/pills, events, map, wrapping) ===== */

/* --- CHIPS / PILLS: remove scrollbars, native arrows, borders, backgrounds --- */
/* Use the class "chip" on your pill/chip/badge elements (or wrappers). */
.chip {
  overflow: visible !important;                 /* never show a scrollbar */
  background: var(--chip-bg, transparent);      /* customizable if needed */
  border: 0 !important;
  box-shadow: none !important;
  border-radius: 9999px;                         /* nice pill look if you want */
  padding: 0.25rem 0.6rem;
  line-height: 1.1;
  display: inline-flex;
  align-items: center;
  gap: .35rem;
}

/* Kill WebKit scrollbars if something added overflow */
.chip::-webkit-scrollbar { display: none !important; }
.chip { scrollbar-width: none !important; }

/* If a SELECT is used to render a chip, remove native arrow */
.chip select {
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  background: transparent !important;
  border: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}
/* IE/Edge legacy */
.chip select::-ms-expand { display: none !important; }

/* If a NUMBER input sneaks in, remove spinners */
.chip input[type="number"]::-webkit-outer-spin-button,
.chip input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
  margin: 0 !important;
}
.chip input[type="number"] { -moz-appearance: textfield !important; }

/* Defensive: any element that *looks* like a chip but is positioned absolute */
[class*="chip"][class*="absolute"],
[class*="badge"][class*="absolute"],
[class*="pill"][class*="absolute"] { position: static !important; }

/* --- EVENTS: ensure pills are below the image on all screens --- */
.event-card .pills { position: static !important; inset: auto !important; margin-top: .5rem !important; }
.event-card .image-gradient { display: none !important; } /* avoid text overlap */

/* --- WRAPPING HELPERS (apply as classes where text was spilling) --- */
.wrap-any { overflow-wrap: anywhere !important; word-break: break-word !important; }
.minw0    { min-width: 0 !important; }
.text-left-important { text-align: left !important; }

/* --- MAP: visible container + children fill --- */
.map-shell { position: relative; width: 100%; min-height: 320px; border-radius: .5rem; overflow: hidden; }
@media (min-width: 640px) { .map-shell { min-height: 400px; } }
.map-shell > * { height: 100% !important; width: 100% !important; }

/* --- HERO blue words (scoped) --- */
.hero-clean h1 .hero-blue,
.hero-clean h1 .hero-blue::before,
.hero-clean h1 .hero-blue::after {
  color: rgb(59 130 246) !important; /* blue-500 text only */
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  content: none !important;
}

/* Kill phantom horizontal scrollbars */
html, body { overflow-x: hidden !important; }
`.trim();

    const style = document.createElement("style");
    style.id = "nearby-hotfix";
    style.textContent = css;
    document.head.appendChild(style);
  }, []);
  return null;
}