import { build } from "esbuild";

await build({
  entryPoints: ["server/index.ts"],
  outfile: "dist/server/index.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  sourcemap: false,
  minify: false,
  external: [
    "@replit/vite-plugin-runtime-error-modal",
    "@replit/vite-plugin-cartographer",
    "@prerenderer/rollup-plugin",
    "@prerenderer/renderer-puppeteer",
    "puppeteer",
    "lightningcss",
    "lightningcss/node",
    "bufferutil",
    "utf-8-validate",
    "pg-native",
  ],
});

console.log("✅ Server built: dist/server/index.cjs");