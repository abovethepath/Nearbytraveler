import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/styles/hotfix.css";
import ErrorBoundary from "./ErrorBoundary";
import { initPosthog } from "@/lib/posthog";

initPosthog();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
