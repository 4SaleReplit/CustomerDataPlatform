@echo off
echo Stopping Customer Data Platform Docker containers...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running or not installed.
    pause
    exit /b 1
)

echo Stopping and removing containers...
docker-compose down

if %errorlevel% neq 0 (
    echo ERROR: Failed to stop containers!
    pause
    exit /b 1
)

echo.
echo SUCCESS: Application stopped successfully!
echo.
echo To start again, run: run-docker.bat
echo.
pause