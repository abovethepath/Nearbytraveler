import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/styles/hotfix.css";
import "@/styles/light-mode-clean.css";
import ErrorBoundary from "./ErrorBoundary";
import { initPosthog } from "@/lib/posthog";

initPosthog();

const rootEl = document.getElementById("root");

if (rootEl) {
  // Only show a pre-render loading screen for protected routes where the user might
  // be authenticated (session cache exists). On public/auth routes for logged-out users,
  // skip the loading screen entirely to avoid a flash before React renders the real page.
  const p = window.location.pathname;
  const isPublicEntry = p === '/' || p === '/auth' || p === '/signin' || p === '/join'
    || p.startsWith('/signup') || p.startsWith('/landing') || p === '/about'
    || p === '/privacy' || p === '/terms';
  const hasSessionHint = !!sessionStorage.getItem('nt_session_verified');

  if (!isPublicEntry || hasSessionHint) {
    rootEl.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        background: #0b0b0f;
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

  createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}