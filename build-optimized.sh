#!/bin/bash

# Optimized Docker Build Script
# Reduces build times through better caching and parallel processing

set -e

echo "🚀 Starting optimized Docker build..."

# Build with BuildKit for better caching and parallel processing
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build with optimized settings
docker build \
  --platform linux/arm64 \
  --file Dockerfile.production \
  --target builder \
  --cache-from type=local,src=/tmp/.buildx-cache \
  --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
  --tag customer-data-platform:builder \
  .

# Build final image
docker build \
  --platform linux/arm64 \
  --file Dockerfile.production \
  --cache-from type=local,src=/tmp/.buildx-cache \
  --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
  --tag customer-data-platform:latest \
  .

# Move cache
rm -rf /tmp/.buildx-cache
mv /tmp/.buildx-cache-new /tmp/.buildx-cache

echo "✅ Build completed successfully!"
echo "📦 Image: customer-data-platform:latest"