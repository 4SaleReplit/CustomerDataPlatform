@echo off
echo ========================================
echo Ultra-Fast Docker Build (2-3 minutes max)
echo ========================================
echo.

REM Clean previous builds
echo Cleaning previous builds...
if exist "dist" rmdir /s /q dist
if exist "server\production-server.js" del "server\production-server.js"

REM Quick dependency check
if not exist "node_modules" (
    echo Installing dependencies with cache...
    npm ci --silent --prefer-offline
)

REM Ultra-fast build process
echo [1/4] Building client (Vite)...
set NODE_ENV=production
npm run build --silent

echo [2/4] Building server (esbuild)...
npx esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=server/production-server.js --minify --log-level=error

echo [3/4] Preparing Docker context...
REM Create minimal context
if not exist "docker-build" mkdir docker-build
copy "package.json" "docker-build\"
copy "package-lock.json" "docker-build\"
xcopy "dist" "docker-build\dist\" /e /i /q
copy "server\production-server.js" "docker-build\server\" 2>nul || (mkdir "docker-build\server" && copy "server\production-server.js" "docker-build\server\")
xcopy "shared" "docker-build\shared\" /e /i /q

echo [4/4] Building minimal Docker image...
cd docker-build
docker build -f ..\Dockerfile.minimal -t cdp-app:latest .
cd ..

if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)

REM Cleanup
rmdir /s /q docker-build

echo.
echo ✅ Ultra-fast build completed!
docker images cdp-app:latest --format "{{.Size}}"
echo.
echo Ready to run: run-docker.bat
pause