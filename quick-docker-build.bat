@echo off
echo ========================================
echo Quick Docker Build (2-3 minutes)
echo ========================================
echo.

REM Use existing client build from successful vite build
if not exist "dist\public\index.html" (
    echo Building client with Vite only...
    npx vite build --silent
    if %errorlevel% neq 0 (
        echo ERROR: Vite build failed!
        pause
        exit /b 1
    )
)

REM Compile production server without TypeScript checking
echo Compiling server...
npx esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=server/production-server.js --log-level=error

if %errorlevel% neq 0 (
    echo ERROR: Server compilation failed!
    pause
    exit /b 1
)

REM Fast Docker build
echo Building Docker image...
docker build -f Dockerfile.quick -t cdp-app:latest . --quiet

if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    echo Retrying with verbose output...
    docker build -f Dockerfile.quick -t cdp-app:latest .
    if %errorlevel% neq 0 (
        pause
        exit /b 1
    )
)

echo.
echo ✅ Quick build completed!
echo.
docker images cdp-app:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo.
echo Ready to run with: run-docker.bat
pause