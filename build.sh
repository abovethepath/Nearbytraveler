#!/bin/bash
set -e

echo "==> Building server with esbuild..."
npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outdir=dist/server \
  --packages=external \
  --alias:@shared=./shared \
  --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);"

echo "==> Building client with Vite..."
npx vite build

echo "==> Build complete!"
