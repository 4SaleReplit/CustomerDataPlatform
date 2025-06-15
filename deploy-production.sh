#!/bin/bash

# Production Deployment Script - Simplified Single Container
# Deploys the application without nginx

set -e

echo "🚀 Deploying CDP application in production mode..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create one with required environment variables."
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "PGHOST"
    "PGPORT"
    "PGUSER"
    "PGPASSWORD"
    "PGDATABASE"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down --remove-orphans

# Pull latest images
echo "📥 Pulling latest images..."
docker-compose -f docker-compose.production.yml pull

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose -f docker-compose.production.yml up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
if docker-compose -f docker-compose.production.yml ps | grep -q "Up (healthy)"; then
    echo "✅ Services are healthy!"
else
    echo "⚠️  Some services may not be healthy. Checking logs..."
    docker-compose -f docker-compose.production.yml logs --tail=50
fi

echo ""
echo "🎉 Deployment complete!"
echo "   • Application: http://localhost:5000"
echo "   • Health Check: http://localhost:5000/health"
echo ""
echo "To view logs:"
echo "   docker-compose -f docker-compose.production.yml logs -f"
echo ""
echo "To stop:"
echo "   docker-compose -f docker-compose.production.yml down"