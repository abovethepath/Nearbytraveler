#!/bin/bash

# Production Deployment Script for NearbyTraveler
# This script automates the production deployment process

set -e  # Exit on any error

echo "🚀 Starting production deployment for NearbyTraveler..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please copy env.production.template to .env and configure your environment variables."
    exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Build the application
echo "🏗️ Building application for production..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed! dist/ directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing PM2...${NC}"
    npm install -g pm2
fi

# Stop existing PM2 processes if running
echo "🛑 Stopping existing PM2 processes..."
pm2 stop nearbytraveler 2>/dev/null || true
pm2 delete nearbytraveler 2>/dev/null || true

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start dist/index.js --name "nearbytraveler" --instances max --env production

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 to start on boot
echo "🔧 Setting up PM2 startup script..."
pm2 startup

echo -e "${GREEN}✅ Production deployment completed successfully!${NC}"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "🔍 Useful PM2 commands:"
echo "  pm2 logs nearbytraveler          # View application logs"
echo "  pm2 monit                        # Monitor application performance"
echo "  pm2 restart nearbytraveler       # Restart application"
echo "  pm2 stop nearbytraveler          # Stop application"
echo "  pm2 delete nearbytraveler        # Remove application from PM2"

echo ""
echo "🌐 Your application should now be running on port 5000"
echo "📖 Check PRODUCTION_DEPLOYMENT_GUIDE.md for more details"
echo "🚨 Remember to configure your reverse proxy (Nginx) and SSL certificates"


