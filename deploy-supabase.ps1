# Customer Data Platform Supabase Deployment Script (PowerShell)
# This script sets up the application with Supabase PostgreSQL database

param(
    [switch]$SkipTests = $false,
    [switch]$Force = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Customer Data Platform Supabase Deployment" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Error ".env file not found!"
    exit 1
}

# Load environment variables from .env file
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^([^#][^=]*=.*)$") {
        $key, $value = $_ -split "=", 2
        $envVars[$key.Trim()] = $value.Trim()
        [System.Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), "Process")
    }
}

# Validate required environment variables
if (-not $envVars.ContainsKey("DATABASE_URL") -or [string]::IsNullOrEmpty($envVars["DATABASE_URL"])) {
    Write-Error "DATABASE_URL not set in .env file"
    exit 1
}

Write-Info "Environment variables loaded"

try {
    # Step 1: Clean up existing Docker containers and images
    Write-Info "Cleaning up existing Docker containers and images..."
    try {
        docker-compose down -v --remove-orphans 2>$null
        if ($Force) {
            docker system prune -f 2>$null
        }
    }
    catch {
        Write-Warning "Some cleanup operations failed, continuing..."
    }

    # Step 2: Build the application
    Write-Info "Building the application..."
    $buildResult = npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Application build failed"
        exit 1
    }
    Write-Success "Application built successfully"

    # Step 3: Run database migrations
    Write-Info "Running database migrations..."
    try {
        npm run db:push
        Write-Success "Database migrations completed"
    }
    catch {
        Write-Warning "Database migrations failed or were skipped"
    }

    # Step 4: Test database connection
    Write-Info "Testing database connection..."
    $testScript = @"
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
"@

    $testScript | Out-File -FilePath "temp_db_test.js" -Encoding UTF8
    try {
        node temp_db_test.js
        Write-Success "Database connection test passed"
    }
    finally {
        if (Test-Path "temp_db_test.js") {
            Remove-Item "temp_db_test.js"
        }
    }

    # Step 5: Build Docker image
    Write-Info "Building Docker image..."
    docker-compose build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker build failed"
        exit 1
    }
    Write-Success "Docker image built successfully"

    # Step 6: Start services
    Write-Info "Starting services..."
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start services"
        exit 1
    }

    # Step 7: Wait for services to be ready
    Write-Info "Waiting for services to be ready..."
    Start-Sleep -Seconds 30

    # Step 8: Test application health
    Write-Info "Testing application health..."
    $maxAttempts = 30
    $attempt = 1
    $isHealthy = $false

    while ($attempt -le $maxAttempts -and -not $isHealthy) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "Application is healthy!"
                $isHealthy = $true
                break
            }
        }
        catch {
            # Continue trying
        }
        
        if ($attempt -eq $maxAttempts) {
            Write-Error "Application failed to start after $maxAttempts attempts"
            Write-Info "Showing application logs:"
            docker-compose logs cdp-app
            exit 1
        }
        
        Write-Info "Attempt $attempt/$maxAttempts - waiting for application..."
        Start-Sleep -Seconds 5
        $attempt++
    }

    # Step 9: Test API endpoints
    if (-not $SkipTests) {
        Write-Info "Testing API endpoints..."

        # Test health endpoint
        try {
            $healthResponse = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing
            Write-Success "Health endpoint working: $($healthResponse.Content)"
        }
        catch {
            Write-Error "Health endpoint failed: $($_.Exception.Message)"
        }

        # Test API health endpoint
        try {
            $apiHealthResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing
            Write-Success "API health endpoint working"
        }
        catch {
            Write-Warning "API health endpoint may not be available yet"
        }
    }

    # Step 10: Display service status
    Write-Info "Service Status:"
    docker-compose ps

    # Step 11: Display application URLs
    Write-Success "Deployment completed successfully!"
    Write-Host ""
    Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
    Write-Host "   Main Application: http://localhost:5000" -ForegroundColor White
    Write-Host "   Health Check: http://localhost:5000/health" -ForegroundColor White
    Write-Host "   API Health: http://localhost:5000/api/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Monitoring Commands:" -ForegroundColor Cyan
    Write-Host "   View logs: docker-compose logs -f cdp-app" -ForegroundColor White
    Write-Host "   Check status: docker-compose ps" -ForegroundColor White
    Write-Host "   Stop services: docker-compose down" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Database Information:" -ForegroundColor Cyan
    Write-Host "   Database: Supabase PostgreSQL" -ForegroundColor White
    Write-Host "   Connection: Using DATABASE_URL from .env" -ForegroundColor White
    Write-Host ""

    # Step 12: Optional - Run endpoint tests
    if (-not $SkipTests) {
        $runTests = Read-Host "Would you like to run comprehensive endpoint tests? (y/n)"
        if ($runTests -eq "y" -or $runTests -eq "Y") {
            Write-Info "Running comprehensive endpoint tests..."
            
            $endpoints = @(
                "/health",
                "/api/health",
                "/api/team",
                "/api/cohorts",
                "/api/campaigns",
                "/api/integrations",
                "/api/dashboard/configurations"
            )
            
            foreach ($endpoint in $endpoints) {
                Write-Info "Testing $endpoint..."
                try {
                    $response = Invoke-WebRequest -Uri "http://localhost:5000$endpoint" -UseBasicParsing -TimeoutSec 10
                    $statusCode = $response.StatusCode
                    
                    if ($statusCode -eq 200 -or $statusCode -eq 401) {
                        Write-Success "$endpoint : HTTP $statusCode (OK)"
                    }
                    else {
                        Write-Warning "$endpoint : HTTP $statusCode"
                    }
                }
                catch {
                    $statusCode = $_.Exception.Response.StatusCode.value__
                    if ($statusCode -eq 401) {
                        Write-Success "$endpoint : HTTP $statusCode (OK - Authentication required)"
                    }
                    else {
                        Write-Warning "$endpoint : Failed ($($_.Exception.Message))"
                    }
                }
            }
        }
    }

    Write-Success "Customer Data Platform is now running with Supabase!"
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green

}
catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    Write-Info "You can check the logs with: docker-compose logs"
    exit 1
} 