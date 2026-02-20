import { build } from "esbuild";

await build({
  entryPoints: ["server/index.ts"],
  outfile: "dist/server/index.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  sourcemap: false,
  minify: false,
  external: [
    "@replit/vite-plugin-runtime-error-modal",
    "@replit/vite-plugin-cartographer",
    "lightningcss",
    "lightningcss/node",
    "bufferutil",
    "utf-8-validate",
    "pg-native",
  ],
});

console.log("✅ Server built: dist/server/index.js");