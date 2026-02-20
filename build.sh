#!/usr/bin/env bash
set -euo pipefail

echo "Building server..."
node scripts/build-server.mjs

echo "Building client..."
npx vite build

echo "✅ Build complete"
