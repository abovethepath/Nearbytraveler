import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isReplit = !!process.env.REPL_ID;
const isDev = process.env.NODE_ENV !== "production";

// Routes prerendered at build time so SEO/AI crawlers see real HTML instead of
// the SPA "Loading…" shell. Keep in sync with PRERENDERED_PATHS in client/src/main.tsx.
const PRERENDER_ROUTES = [
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
];

export default defineConfig(async ({ command }) => {
  const plugins: any[] = [react()];

  if (isReplit && isDev) {
    plugins.push((await import("@replit/vite-plugin-runtime-error-modal")).default());
    plugins.push((await import("@replit/vite-plugin-cartographer")).default());
  }

  if (command === "build") {
    console.log("[vite.config] Adding prerenderer plugin for", PRERENDER_ROUTES.length, "routes");
    const { default: Prerenderer } = await import("@prerenderer/rollup-plugin");
    const { default: PuppeteerRenderer } = await import("@prerenderer/renderer-puppeteer");
    plugins.push(
      Prerenderer({
        routes: PRERENDER_ROUTES,
        renderer: new PuppeteerRenderer({
          renderAfterTime: 5000,
          maxConcurrentRoutes: 2,
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        }),
      })
    );
  }

  return {
    plugins,

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["autoprefixer", "postcss"],
  },

  root: path.resolve(import.meta.dirname, "client"),

  css: {
    postcss: path.resolve(import.meta.dirname, "postcss.config.js"),
  },

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },

    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
