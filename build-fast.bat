@echo off
echo ========================================
echo Fast Docker Build for Customer Data Platform
echo ========================================
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --silent
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Quick production build
echo [1/3] Building client application...
npm run build --silent
if %errorlevel% neq 0 (
    echo ERROR: Client build failed!
    pause
    exit /b 1
)

REM Build production server
echo [2/3] Building production server...
npx esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=server/production-server.js --log-level=warning
if %errorlevel% neq 0 (
    echo ERROR: Server build failed!
    pause
    exit /b 1
)

REM Fast Docker build with optimized Dockerfile
echo [3/3] Building Docker image (optimized)...
docker build -t cdp-app:latest --no-cache .
if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)

echo.
echo ✅ Fast build completed successfully!
echo.
echo Image size:
docker images cdp-app:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo.
echo To start the application: run-docker.bat
echo.
pause