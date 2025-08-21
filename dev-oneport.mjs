import path from "path";
import express from "express";
import { createServer as createHttpServer } from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const app = express();

  // OPTIONAL: mount your API router here if needed
  // const api = (await import("./server/api.js")).default;
  // app.use("/api", api);

  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    root: path.resolve(__dirname, "client"),
    appType: "custom",
    server: { middlewareMode: true }, // HMR rides same origin
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client/src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
  });
  app.use(vite.middlewares);

  const PORT = Number(process.env.PORT) || 5000;
  createHttpServer(app).listen(PORT, "0.0.0.0", () => {
    console.log(`Dev server running on http://0.0.0.0:${PORT} (Vite middleware)`);
  });
}
main().catch((e) => { console.error(e); process.exit(1); });