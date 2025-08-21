#!/usr/bin/env bash
set -euo pipefail

# Use Replit-assigned port if present
PORT="${PORT:-5000}"

echo "👟 Starting guard loop on PORT=$PORT"

while true; do
  # Kill any competing servers/workflows that bind or spawn React/Vite overlays
  pkill -f "server/index|vite-plugin-cartographer|runtime-error-modal" >/dev/null 2>&1 || true

  # If our dev-oneport isn't running, start it
  if ! pgrep -f "node dev-oneport.mjs" >/dev/null 2>&1; then
    echo "🚀 Launching one-port dev server on $PORT"
    PORT="$PORT" node dev-oneport.mjs >/tmp/dev-oneport.log 2>&1 &
  fi

  # Re-check every 2s; aggressively keeps our server in control
  sleep 2
done