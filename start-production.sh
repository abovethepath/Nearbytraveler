#!/bin/bash

# Production start script for Replit deployment
echo "Starting Nearby Traveler production server..."

# Set production environment
export NODE_ENV=production

# Ensure port is set
export PORT=${PORT:-5000}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set!"
    echo "Please add DATABASE_URL to your deployment secrets"
    exit 1
fi

echo "Database URL configured: ✓"
echo "Starting server on port $PORT..."

# Run the server directly with tsx (no build needed)
npx tsx server/index.ts