import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig(async () => ({
    plugins: [
        react(),
        ...(process.env.REPL_ID !== undefined
            ? [
                (await import("@replit/vite-plugin-runtime-error-modal")).default(),
                ...(process.env.NODE_ENV !== "production"
                    ? [
                        await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer()),
                    ]
                    : []),
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
