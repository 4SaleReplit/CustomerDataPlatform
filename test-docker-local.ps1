# Local Docker Testing Script for Customer Data Platform (Windows PowerShell)
# This script builds and tests the application locally before AWS deployment

Write-Host "🚀 Starting Local Docker Testing for Customer Data Platform" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found. Please create .env from .env.example" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green

# Build the production image
Write-Host ""
Write-Host "📦 Building production Docker image..." -ForegroundColor Yellow
docker build -f Dockerfile.production -t cdp-platform:test .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host ""
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml down 2>$null

# Start the application
Write-Host ""
Write-Host "🚀 Starting application with Docker Compose..." -ForegroundColor Yellow
docker-compose -f docker-compose.production.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Application started successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Application is running at: http://localhost:5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Testing Checklist:" -ForegroundColor Yellow
    Write-Host "   [ ] Application loads successfully"
    Write-Host "   [ ] Database connections work"
    Write-Host "   [ ] Snowflake queries execute"
    Write-Host "   [ ] Amplitude analytics track events"
    Write-Host "   [ ] File uploads function"
    Write-Host "   [ ] All pages render correctly"
    Write-Host "   [ ] User authentication works"
    Write-Host ""
    Write-Host "📝 To view logs: docker-compose -f docker-compose.production.yml logs -f" -ForegroundColor Blue
    Write-Host "🛑 To stop: docker-compose -f docker-compose.production.yml down" -ForegroundColor Blue
} else {
    Write-Host "❌ Failed to start application" -ForegroundColor Red
    exit 1
}