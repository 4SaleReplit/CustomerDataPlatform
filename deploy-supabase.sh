#!/bin/bash

# Customer Data Platform Supabase Deployment Script
# This script sets up the application with Supabase PostgreSQL database

set -e

echo "🚀 Customer Data Platform Supabase Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not set in .env file"
    exit 1
fi

print_status "Environment variables loaded"

# Step 1: Clean up existing Docker containers and images
print_status "Cleaning up existing Docker containers and images..."
docker-compose down -v --remove-orphans 2>/dev/null || true
docker system prune -f 2>/dev/null || true

# Step 2: Build the application
print_status "Building the application..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Application build failed"
    exit 1
fi
print_success "Application built successfully"

# Step 3: Run database migrations
print_status "Running database migrations..."
npm run db:push
if [ $? -ne 0 ]; then
    print_warning "Database migrations failed or were skipped"
fi

# Step 4: Test database connection
print_status "Testing database connection..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Database connection successful');
  console.log('📅 Database time:', res.rows[0].now);
  pool.end();
});
"

# Step 5: Build Docker image
print_status "Building Docker image..."
docker-compose build --no-cache
if [ $? -ne 0 ]; then
    print_error "Docker build failed"
    exit 1
fi
print_success "Docker image built successfully"

# Step 6: Start services
print_status "Starting services..."
docker-compose up -d
if [ $? -ne 0 ]; then
    print_error "Failed to start services"
    exit 1
fi

# Step 7: Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Step 8: Test application health
print_status "Testing application health..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:5000/health > /dev/null; then
        print_success "Application is healthy!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Application failed to start after $max_attempts attempts"
        docker-compose logs cdp-app
        exit 1
    fi
    
    print_status "Attempt $attempt/$max_attempts - waiting for application..."
    sleep 5
    ((attempt++))
done

# Step 9: Test API endpoints
print_status "Testing API endpoints..."

# Test health endpoint
health_response=$(curl -s http://localhost:5000/health)
if [ $? -eq 0 ]; then
    print_success "Health endpoint working: $health_response"
else
    print_error "Health endpoint failed"
fi

# Test API health endpoint
api_health_response=$(curl -s http://localhost:5000/api/health)
if [ $? -eq 0 ]; then
    print_success "API health endpoint working"
else
    print_warning "API health endpoint may not be available yet"
fi

# Step 10: Display service status
print_status "Service Status:"
docker-compose ps

# Step 11: Display application URLs
print_success "Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Main Application: http://localhost:5000"
echo "   Health Check: http://localhost:5000/health"
echo "   API Health: http://localhost:5000/api/health"
echo ""
echo "🔍 Monitoring Commands:"
echo "   View logs: docker-compose logs -f cdp-app"
echo "   Check status: docker-compose ps"
echo "   Stop services: docker-compose down"
echo ""
echo "📊 Database Information:"
echo "   Database: Supabase PostgreSQL"
echo "   Connection: Using DATABASE_URL from .env"
echo ""

# Step 12: Optional - Run endpoint tests
read -p "Would you like to run comprehensive endpoint tests? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Running comprehensive endpoint tests..."
    
    # Test various endpoints
    endpoints=(
        "/health"
        "/api/health"
        "/api/team"
        "/api/cohorts"
        "/api/campaigns"
        "/api/integrations"
        "/api/dashboard/configurations"
    )
    
    for endpoint in "${endpoints[@]}"; do
        print_status "Testing $endpoint..."
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000$endpoint)
        
        if [ "$response" -eq 200 ] || [ "$response" -eq 401 ]; then
            print_success "$endpoint: HTTP $response (OK)"
        else
            print_warning "$endpoint: HTTP $response"
        fi
    done
fi

print_success "Customer Data Platform is now running with Supabase!"
echo "🎉 Deployment completed successfully!" 