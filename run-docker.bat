@echo off
echo Starting Customer Data Platform with Docker Compose...
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
    echo ERROR: .env file not found!
    echo Please run build-docker.bat first to create the .env file.
    pause
    exit /b 1
)

REM Create uploads directory if it doesn't exist
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs

echo Starting application with Docker Compose...
docker-compose up -d

if %errorlevel% neq 0 (
    echo ERROR: Failed to start application!
    pause
    exit /b 1
)

echo.
echo SUCCESS: Application is starting!
echo.
echo Access the application at: http://localhost:5000
echo.
echo Useful commands:
echo   - View logs: docker-compose logs -f
echo   - Stop app: docker-compose down
echo   - Restart: docker-compose restart
echo.
echo Checking container status...
docker-compose ps
echo.
pause