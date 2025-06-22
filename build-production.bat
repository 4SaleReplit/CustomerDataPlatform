@echo off
echo Building Customer Data Platform for Production...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js and try again.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo Building client application...
npm run build

if %errorlevel% neq 0 (
    echo ERROR: Client build failed!
    pause
    exit /b 1
)

echo Building production server...
npx esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=server/production-server.js

if %errorlevel% neq 0 (
    echo ERROR: Server build failed!
    pause
    exit /b 1
)

echo.
echo SUCCESS: Production build completed!
echo.
echo Files created:
echo   - client/dist/        (Client application)
echo   - server/production-server.js (Production server)
echo.
echo Next steps:
echo   1. Copy .env.production to .env and update with your values
echo   2. Run build-docker.bat to create Docker image
echo   3. Run run-docker.bat to start the application
echo.
pause