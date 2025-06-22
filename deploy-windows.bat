@echo off
echo ========================================
echo Customer Data Platform - Windows Docker Deployment
echo ========================================
echo.

REM Check prerequisites
echo Checking prerequisites...

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not running.
    echo Please install Docker Desktop for Windows and try again.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed.
    echo Please install Node.js 18+ and try again.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Docker is available
echo ✓ Node.js is available
echo.

REM Setup environment
if not exist ".env" (
    echo Setting up environment configuration...
    copy ".env.production" ".env"
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file with your actual Supabase credentials
    echo    The current file contains example values that need to be updated.
    echo.
    echo Press any key after editing .env file...
    pause
    echo.
)

REM Create necessary directories
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs

echo Starting complete deployment process...
echo.

REM Step 1: Install dependencies
echo [1/4] Installing dependencies...
if not exist "node_modules" (
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Step 2: Build application
echo [2/4] Building application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

REM Step 3: Build production server
echo [3/4] Building production server...
npx esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=server/production-server.js
if %errorlevel% neq 0 (
    echo ERROR: Production server build failed!
    pause
    exit /b 1
)

REM Step 4: Build and start Docker containers
echo [4/4] Building and starting Docker containers...
docker-compose up --build -d
if %errorlevel% neq 0 (
    echo ERROR: Docker deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ DEPLOYMENT SUCCESSFUL!
echo ========================================
echo.
echo 🌐 Application URL: http://localhost:5000
echo 🏥 Health Check: http://localhost:5000/health
echo.
echo Management Commands:
echo   - View logs: docker-compose logs -f
echo   - Stop app: docker-compose down
echo   - Restart: docker-compose restart
echo   - Status: docker-compose ps
echo.
echo Checking application status...
timeout /t 5 /nobreak >nul
docker-compose ps
echo.

REM Test health endpoint
echo Testing application health...
timeout /t 3 /nobreak >nul
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Application is healthy and responding
) else (
    echo ⚠️  Application may still be starting up...
    echo    Check logs with: docker-compose logs -f
)

echo.
echo Deployment complete! Press any key to exit...
pause