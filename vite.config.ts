import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isReplit = !!process.env.REPL_ID;
const isDev = process.env.NODE_ENV !== "production";

export default defineConfig(async () => ({
  plugins: [
    react(),
    ...(isReplit && isDev
      ? [
          (await import("@replit/vite-plugin-runtime-error-modal")).default(),
          (await import("@replit/vite-plugin-cartographer")).default(),
        ]
      : []),
  ],

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
}));
