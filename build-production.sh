#!/bin/bash

# Production Build Script - No nginx Required
# Builds optimized Docker image for single-container deployment

set -e

echo "🏗️  Building production Docker image without nginx..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build the production image
echo "📦 Building Docker image for ARM64 platform..."
docker build \
    --platform linux/arm64 \
    -f Dockerfile.production \
    -t cdp-app:latest \
    -t cdp-app:$(date +%Y%m%d-%H%M%S) \
    .

echo "✅ Docker image built successfully!"

# Optional: Show image size
echo "📊 Image details:"
docker images cdp-app:latest

echo ""
echo "🚀 Ready for deployment!"
echo "   • Image: cdp-app:latest"
echo "   • Platform: linux/arm64"
echo "   • Architecture: Single container (Express serves both API and static files)"
echo "   • Port: 5000"
echo ""
echo "To deploy locally:"
echo "   docker-compose -f docker-compose.production.yml up -d"
echo ""
echo "To push to registry:"
echo "   docker tag cdp-app:latest your-registry/cdp-app:latest"
echo "   docker push your-registry/cdp-app:latest"