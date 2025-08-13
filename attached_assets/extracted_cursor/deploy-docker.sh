#!/bin/bash

# Docker Deployment Script for NearbyTraveler
# This script automates the Docker-based production deployment

set -e  # Exit on any error

echo "🐳 Starting Docker deployment for NearbyTraveler..."

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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose not found. Installing...${NC}"
    # Try to install docker-compose
    if command -v pip3 &> /dev/null; then
        pip3 install docker-compose
    else
        echo -e "${RED}❌ Could not install docker-compose. Please install it manually.${NC}"
        exit 1
    fi
fi

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start the services
echo "🏗️ Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
if docker-compose ps | grep -q "unhealthy"; then
    echo -e "${RED}❌ Some services are unhealthy!${NC}"
    docker-compose logs
    exit 1
fi

echo -e "${GREEN}✅ All services are healthy!${NC}"

# Show service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🔍 Useful Docker commands:"
echo "  docker-compose logs -f app          # View application logs"
echo "  docker-compose logs -f nginx        # View Nginx logs"
echo "  docker-compose restart app          # Restart application"
echo "  docker-compose down                 # Stop all services"
echo "  docker-compose up -d                # Start all services"

echo ""
echo "🌐 Your application should now be running on:"
echo "  - HTTP:  http://localhost (redirects to HTTPS)"
echo "  - HTTPS: https://localhost"
echo "  - App:   http://localhost:5000 (direct access)"

echo ""
echo "🚨 Important notes:"
echo "  1. You need to add SSL certificates to ./ssl/cert.pem and ./ssl/key.pem"
echo "  2. Update nginx.conf with your domain name"
echo "  3. Configure your firewall to allow ports 80 and 443"
echo "  4. Set up DNS to point to your server"

echo ""
echo "📖 Check PRODUCTION_DEPLOYMENT_GUIDE.md for more details"
echo "🔧 For SSL setup, see: https://letsencrypt.org/docs/"





