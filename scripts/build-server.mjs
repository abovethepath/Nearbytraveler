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
    "pg-native",
    "bufferutil"
  ]
});

console.log("✅ Server built: dist/server/index.js");
