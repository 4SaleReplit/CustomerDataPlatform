#!/bin/bash

# Docker Build Script - Fixes Vite production issues
echo "Building Customer Data Platform for Docker deployment..."

# Step 1: Build the frontend
echo "Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "Frontend build failed"
    exit 1
fi

# Step 2: Build the backend with the production server
echo "Building backend..."
npx esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18
if [ $? -ne 0 ]; then
    echo "Backend build failed"
    exit 1
fi

# Step 2.1: Build the production Vite module
echo "Building production Vite module..."
npx esbuild server/vite-production.ts --platform=node --packages=external --bundle --format=esm --outfile=server/vite-production.js --target=node18
if [ $? -ne 0 ]; then
    echo "Production Vite module build failed"
    exit 1
fi

# Step 3: Copy client build to dist directory for Docker
echo "Preparing files for Docker..."
mkdir -p dist/client
cp -r client/dist/* dist/client/ 2>/dev/null || echo "No client dist found"

# Step 4: Build Docker image
echo "Building Docker image..."
docker build -t cdp-platform .
if [ $? -ne 0 ]; then
    echo "Docker build failed"
    exit 1
fi

echo "✅ Docker build completed successfully!"
echo "Run with: docker run -p 5000:5000 --env-file .env cdp-platform"