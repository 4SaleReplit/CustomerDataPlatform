#!/bin/bash

# Production Build Script for Docker
set -e

echo "Building frontend..."
npm run build:client

echo "Building backend..."
npm run build:server

echo "Copying production files..."
# Ensure the vite-production module is available
cp server/vite-production.js dist/ 2>/dev/null || echo "vite-production.js already in place"

echo "Build completed successfully!"