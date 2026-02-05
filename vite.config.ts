import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Replit plugins (optional)
let runtimeErrorModal: any = null;
let cartographer: any = null;

try {
  // These packages exist in Replit, but not on Render
  runtimeErrorModal = (await import("@replit/vite-plugin-runtime-error-modal")).default;
  cartographer = (await import("@replit/vite-plugin-cartographer")).default;
} catch {
  // ignore if not available (e.g., Render)
}

export default defineConfig({
  plugins: [
    react(),
    // Only include if available
    runtimeErrorModal?.(),
    cartographer?.()
  ].filter(Boolean),
});
