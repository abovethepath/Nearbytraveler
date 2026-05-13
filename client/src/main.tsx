import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import "@/styles/hotfix.css";
import "@/styles/light-mode-clean.css";
import ErrorBoundary from "./ErrorBoundary";
import { initPosthog } from "@/lib/posthog";

initPosthog();

// Paths that are prerendered to static HTML at build time by @prerenderer/rollup-plugin.
// Keep in sync with PRERENDER_ROUTES in vite.config.ts. We hydrate only on these paths
// so non-prerendered routes (which the SPA fallback serves with the prerendered homepage
// HTML) get a fresh client render instead of a hydration mismatch.
const PRERENDERED_PATHS = new Set([
  "/",
  "/about",
  "/blog",
  "/blog/how-to-meet-people-when-traveling-alone",
  "/blog/solo-female-travel-safety-tips",
  "/blog/how-to-find-travel-buddies",
  "/blog/best-apps-for-solo-travelers",
  "/blog/meet-locals-when-traveling",
  "/blog/lessons-from-solo-travel-meeting-people",
  "/blog/solo-travel-los-angeles",
  "/blog/whats-happening-los-angeles",
  "/blog/arriving-in-los-angeles-guide",
  "/blog/curing-travel-loneliness",
  "/blog/eating-alone-while-traveling",
  "/city/Los Angeles Metro",
  "/city/New York Metro",
  "/city/San Francisco Bay Area",
  "/city/Orange County Metro",
  "/city/Chicago Metro",
]);

function isPrerenderedPath(pathname: string): boolean {
  if (PRERENDERED_PATHS.has(pathname)) return true;
  try {
    return PRERENDERED_PATHS.has(decodeURIComponent(pathname));
  } catch {
    return false;
  }
}

const rootEl = document.getElementById("root");

if (rootEl) {
  // Hydrate only when this exact path was prerendered, so the served HTML matches
  // what React is about to render. Otherwise fall back to a fresh client render.
  const p = window.location.pathname;
  // localStorage, NOT sessionStorage — App.tsx's markSessionVerified writes
  // this key to localStorage so it persists across PWA launches and browser
  // restarts. Reading sessionStorage made this hint always false, which forced
  // hydrateRoot against the prerendered LandingStreamlined HTML for every
  // user including returning logged-in ones (causing a ~200ms Landing flash
  // before React's tree took over with Home).
  const hasSessionHint = !!localStorage.getItem('nt_session_verified');
  const shouldHydrate = isPrerenderedPath(p) && !hasSessionHint;

  // For any path we won't hydrate, replace the served HTML with a neutral loading
  // shell before React renders. Without this, the SPA fallback serves the prerendered
  // homepage HTML for routes we didn't prerender (e.g. /auth, /privacy), and users
  // see a brief flash of the wrong page (notably the homepage hero video) before
  // React's createRoot wipes #root.
  if (!shouldHydrate) {
    rootEl.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        background: #111827;
        color: rgba(255,255,255,0.85);
        padding: 24px;
        text-align: center;
      ">
        <div>
          <div style="font-size: 20px; font-weight: 600; margin-bottom: 10px;">
            Nearby Traveler
          </div>
          <div style="font-size: 14px; opacity: 0.8;">
            Loading…
          </div>
        </div>
      </div>
    `;
  }

  const app = (
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  );

  if (shouldHydrate) {
    hydrateRoot(rootEl, app);
  } else {
    createRoot(rootEl).render(app);
  }
}
