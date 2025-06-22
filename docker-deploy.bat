@echo off
echo Building Customer Data Platform for Production Deployment
echo.

REM Build client application
echo [1/3] Building client application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Client build failed!
    pause
    exit /b 1
)

REM Build production server
echo [2/3] Building production server...
npx esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=server/production-server.js --log-level=warning --external:server/vite.ts
if %errorlevel% neq 0 (
    echo ERROR: Server build failed!
    pause
    exit /b 1
)

REM Build and start Docker container
echo [3/3] Building and starting Docker container...
docker-compose up --build -d
if %errorlevel% neq 0 (
    echo ERROR: Docker deployment failed!
    pause
    exit /b 1
)

echo.
echo SUCCESS: Application deployed successfully!
echo.
echo Access: http://localhost:5000
echo Health: http://localhost:5000/health
echo Logs:   docker-compose logs -f
echo Stop:   docker-compose down
echo.
pause