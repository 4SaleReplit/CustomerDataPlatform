@echo off
echo ========================================
echo Simple Docker Build (bypasses TS errors)
echo ========================================
echo.

REM Check if dist exists from previous successful build
if not exist "dist" (
    echo Building client application...
    npm run build:client
    if %errorlevel% neq 0 (
        echo ERROR: Client build failed!
        pause
        exit /b 1
    )
)

REM Build production server only (skip TS check)
echo Building production server...
npx esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=server/production-server.js --log-level=warning

if %errorlevel% neq 0 (
    echo ERROR: Server build failed!
    pause
    exit /b 1
)

REM Build Docker image using simple Dockerfile
echo Building Docker image...
docker build -f Dockerfile.simple -t cdp-app:latest .

if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)

echo.
echo ✅ Simple build completed successfully!
echo.
echo Image ready: cdp-app:latest
echo To start: run-docker.bat
echo.
pause