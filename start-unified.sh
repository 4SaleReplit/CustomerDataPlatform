#!/bin/sh

# Unified startup script for frontend + backend in single container
set -e

echo "Starting Customer Data Platform unified container..."

# Function to check if process is running
check_process() {
    if pgrep -f "$1" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Start nginx in background
echo "Starting nginx (frontend)..."
nginx -t
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait a moment for nginx to start
sleep 2

# Start Node.js backend
echo "Starting Node.js backend..."
cd /app
su nodejs -c "node dist/index.js" &
BACKEND_PID=$!

# Function to handle shutdown
shutdown() {
    echo "Shutting down services..."
    kill $NGINX_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap shutdown SIGTERM SIGINT

# Wait and monitor both processes
echo "Services started successfully"
echo "  - Frontend (nginx): PID $NGINX_PID"
echo "  - Backend (node): PID $BACKEND_PID"

# Monitor both processes
while true; do
    sleep 10
    
    # Check nginx
    if ! check_process "nginx"; then
        echo "Nginx died, restarting..."
        nginx -g "daemon off;" &
        NGINX_PID=$!
    fi
    
    # Check backend
    if ! check_process "node dist/index.js"; then
        echo "Backend died, restarting..."
        cd /app
        su nodejs -c "node dist/index.js" &
        BACKEND_PID=$!
    fi
done