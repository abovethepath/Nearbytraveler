import type { Express } from "express";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import type { Server as HttpServer } from "http";
import { createServer as createViteServer, createLogger } from "vite";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

// ESM/CJS safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Small helper: safeDistPath (supports dist or dist/public layouts)
function resolveDistRoot() {
  const candidates = [
    path.resolve(__dirname, "..", "dist", "public"), // your current guess
    path.resolve(__dirname, "..", "dist"), // common vite default
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return candidates[0]; // fallback; we'll error later if missing
}

// Safer log
export function log(message: string, source = "frontend") {
  const t = new Date().toLocaleTimeString("en-US", { hour12: true, hour: "numeric", minute: "2-digit", second: "2-digit" });
  console.log(`${t} [${source}] ${message}`);
}

/**
 * One function to mount frontend:
 * - DEV: Vite middleware (live reload), serves client/index.html
 * - PROD: Static from dist + SPA fallback (excludes /api)
 */
export async function setupFrontend(app: Express, server: HttpServer) {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    // ---------- DEV: Vite middleware ----------
    log("Setting up Vite dev middleware…");
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,             // we're importing the config object directly
      appType: "custom",             // we're using our own server
      server: {
        middlewareMode: true,
        hmr: {
          server,
          host: "0.0.0.0",
          port: 3000,
        },
        allowedHosts: true,
      },
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          // Don't kill the process on template errors; just log
          viteLogger.error(msg, options);
        },
      },
    });

    // Mount vite middlewares BEFORE our dev HTML handler
    app.use(vite.middlewares);

    // Dev HTML handler
    app.get(/^(?!\/api\/).*/, async (req, res) => {
      try {
        // Use /client/index.html in dev
        const clientIndex = path.resolve(__dirname, "..", "client", "index.html");
        let html = await fs.promises.readFile(clientIndex, "utf-8");

        // cache-bust main entry
        html = html.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
        html = await vite.transformIndexHtml(req.originalUrl, html);

        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        console.error("Vite template error:", e);
        res.status(500).send("Dev template error");
      }
    });

    log("Vite dev middleware ready.");
    return;
  }

  // ---------- PROD: Static from dist ----------
  const distRoot = resolveDistRoot();
  if (!fs.existsSync(distRoot)) {
    console.error(`❌ Build output not found at: ${distRoot}`);
    console.error("Make sure you ran:  npm run build");
    // still mount a simple handler to avoid white screen with no clue
    app.get(/^(?!\/api\/).*/, (_req, res) => res.status(500).send("Build missing"));
    return;
  }

  log(`Serving static from: ${distRoot}`);

  // Cache policy: HTML no-cache; hashed assets cache 1 year
  app.use(
    express.static(distRoot, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else if (/[.-][0-9a-f]{8,}\.(js|css|png|jpg|jpeg|gif|svg|webp|avif)$/.test(filePath)) {
          // hashed assets
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          // other assets: short cache
          res.setHeader("Cache-Control", "public, max-age=3600");
        }
      },
    })
  );

  // SPA fallback (but never for /api)
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    const indexHtml = path.resolve(distRoot, "index.html");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(indexHtml);
  });

  log("Static serving configured (prod).");
}
