@echo off
echo Building Customer Data Platform Docker Image...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running or not installed.
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Copying .env.production to .env...
    copy ".env.production" ".env"
    echo.
    echo Please edit .env file with your actual configuration values.
    echo Press any key to continue after editing .env file...
    pause
)

echo Building Docker image...
docker build -t cdp-app:latest .

if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)

echo.
echo SUCCESS: Docker image built successfully!
echo.
echo To run the application, execute: run-docker.bat
echo Or manually run: docker-compose up -d
echo.
pause