// server/oneport-dev.js
import path from "path";
import express from "express";
import { createServer as createHttpServer } from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_ROOT = path.resolve(__dirname, "../client");

async function main() {
  const app = express();
  const httpServer = createHttpServer(app);

  // Mount your API before Vite middlewares
  // app.use("/api", apiRouter);

  // 🔑 Create Vite in middleware mode and bind HMR to THIS httpServer
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    root: CLIENT_ROOT,
    appType: "custom",
    server: {
      middlewareMode: true,
      hmr: { server: httpServer }, // ← HMR uses the same :5000 socket
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "../client/src"),
        "@shared": path.resolve(__dirname, "../shared"),
        "@assets": path.resolve(__dirname, "../attached_assets"),
      },
    },
  });

  app.use(vite.middlewares);

  const PORT = Number(process.env.PORT) || 5000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`One-port dev server listening on http://0.0.0.0:${PORT}`);
  });
}

main();