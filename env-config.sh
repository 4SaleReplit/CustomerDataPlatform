#!/bin/sh

# Environment variable substitution for frontend container
# This script replaces environment variable placeholders in the built files

# Define the directory containing the built files
BUILD_DIR="/usr/share/nginx/html"

# Function to replace environment variables in files
replace_env_vars() {
    local file="$1"
    
    # Replace VITE_ environment variables
    if [ -n "$VITE_API_URL" ]; then
        sed -i "s|__VITE_API_URL__|$VITE_API_URL|g" "$file"
    fi
    
    if [ -n "$VITE_AWS_S3_BUCKET" ]; then
        sed -i "s|__VITE_AWS_S3_BUCKET__|$VITE_AWS_S3_BUCKET|g" "$file"
    fi
    
    if [ -n "$VITE_AWS_CLOUDFRONT_URL" ]; then
        sed -i "s|__VITE_AWS_CLOUDFRONT_URL__|$VITE_AWS_CLOUDFRONT_URL|g" "$file"
    fi
    
    if [ -n "$VITE_AMPLITUDE_API_KEY" ]; then
        sed -i "s|__VITE_AMPLITUDE_API_KEY__|$VITE_AMPLITUDE_API_KEY|g" "$file"
    fi
}

# Process JavaScript files
find "$BUILD_DIR" -name "*.js" -type f | while read -r file; do
    replace_env_vars "$file"
done

# Process CSS files
find "$BUILD_DIR" -name "*.css" -type f | while read -r file; do
    replace_env_vars "$file"
done

# Process HTML files
find "$BUILD_DIR" -name "*.html" -type f | while read -r file; do
    replace_env_vars "$file"
done

echo "Environment variable substitution completed"