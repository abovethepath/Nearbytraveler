import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/styles/hotfix.css";
import ErrorBoundary from "./ErrorBoundary";
import { initPosthog } from "@/lib/posthog";

initPosthog();

const rootEl = document.getElementById("root");

if (rootEl) {
  // Show something immediately so you don't get a white screen while JS loads
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

  createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}