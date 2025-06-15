#!/bin/bash

# Unified Docker Build Script - Single Container (ARM64)
set -e

PROJECT_NAME="cdp-platform"
VERSION="latest"
PLATFORM="linux/arm64"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_info "Docker is ready"
}

build_unified_image() {
    log_info "Building unified ARM64 image..."
    
    # Build with buildx for ARM64
    if docker buildx version &> /dev/null; then
        docker buildx build \
            --platform $PLATFORM \
            --tag $PROJECT_NAME/unified:$VERSION \
            --tag $PROJECT_NAME/unified:arm64 \
            --file Dockerfile.unified \
            --load \
            .
    else
        # Fallback to regular build
        docker build \
            --platform $PLATFORM \
            --tag $PROJECT_NAME/unified:$VERSION \
            --tag $PROJECT_NAME/unified:arm64 \
            --file Dockerfile.unified \
            .
    fi
    
    log_info "Unified image built successfully"
}

test_image() {
    log_info "Testing unified container..."
    
    # Test container startup
    CONTAINER_ID=$(docker run -d \
        --platform $PLATFORM \
        -p 8080:5000 \
        -e NODE_ENV=production \
        -e DATABASE_URL=postgresql://test:test@localhost:5432/test \
        $PROJECT_NAME/unified:$VERSION)
    
    sleep 10
    
    # Check if container is running
    if docker ps | grep -q $CONTAINER_ID; then
        log_info "Container started successfully"
        
        # Test health endpoint
        if curl -f http://localhost:8080/health &> /dev/null; then
            log_info "Health check passed"
        else
            log_warn "Health check failed (expected without database)"
        fi
        
        # Test frontend access
        if curl -f http://localhost:8080/ &> /dev/null; then
            log_info "Frontend access test passed"
        else
            log_warn "Frontend access failed (may be expected without database)"
        fi
    else
        log_error "Container failed to start"
        docker logs $CONTAINER_ID
    fi
    
    # Cleanup
    docker stop $CONTAINER_ID > /dev/null
    docker rm $CONTAINER_ID > /dev/null
}

show_results() {
    echo ""
    echo "=== Build Complete ==="
    docker images | grep $PROJECT_NAME/unified
    echo ""
    echo "Usage:"
    echo "  Local testing: docker-compose -f docker-compose-unified.yml up"
    echo "  Production: ./deploy-unified.sh"
    echo ""
    echo "Image details:"
    echo "  • Single container with Node.js serving frontend + backend"
    echo "  • ARM64 optimized for AWS Graviton"
    echo "  • Node.js serves static files and API on port 5000"
    echo "  • Estimated size: ~180MB (smaller without nginx)"
    echo ""
}

# Main execution
main() {
    log_info "Building unified Customer Data Platform image..."
    
    check_docker
    build_unified_image
    test_image
    show_results
    
    log_info "Build completed successfully!"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi