#!/bin/bash

# Local Docker Testing Script for Customer Data Platform
# This script builds and tests the application locally before AWS deployment

set -e

echo "🚀 Starting Local Docker Testing for Customer Data Platform"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create .env from .env.example"
    exit 1
fi

echo "✅ Docker is running"
echo "✅ Environment file found"

# Build the production image
echo ""
echo "📦 Building production Docker image..."
docker build -f Dockerfile.production -t cdp-platform:test .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
else
    echo "❌ Docker build failed"
    exit 1
fi

# Stop any existing containers
echo ""
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Start the application
echo ""
echo "🚀 Starting application with Docker Compose..."
docker-compose -f docker-compose.production.yml up -d

if [ $? -eq 0 ]; then
    echo "✅ Application started successfully"
    echo ""
    echo "🌐 Application is running at: http://localhost:5000"
    echo ""
    echo "📋 Testing Checklist:"
    echo "   [ ] Application loads successfully"
    echo "   [ ] Database connections work"
    echo "   [ ] Snowflake queries execute"
    echo "   [ ] Amplitude analytics track events"
    echo "   [ ] File uploads function"
    echo "   [ ] All pages render correctly"
    echo "   [ ] User authentication works"
    echo ""
    echo "📝 To view logs: docker-compose -f docker-compose.production.yml logs -f"
    echo "🛑 To stop: docker-compose -f docker-compose.production.yml down"
else
    echo "❌ Failed to start application"
    exit 1
fi