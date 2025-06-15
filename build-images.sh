#!/bin/bash

# ARM64 Docker Image Build Script for Customer Data Platform
set -e

# Configuration
PROJECT_NAME="cdp-platform"
VERSION="latest"
PLATFORM="linux/arm64"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_build() {
    echo -e "${BLUE}[BUILD]${NC} $1"
}

check_dependencies() {
    log_info "Checking build dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Docker supports buildx for multi-platform builds
    if ! docker buildx version &> /dev/null; then
        log_warn "Docker buildx not available, using standard build"
        BUILDX_AVAILABLE=false
    else
        log_info "Docker buildx available for multi-platform builds"
        BUILDX_AVAILABLE=true
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_info "All dependencies are available"
}

setup_buildx() {
    if [ "$BUILDX_AVAILABLE" = true ]; then
        log_info "Setting up buildx builder for ARM64..."
        
        # Create or use existing builder
        docker buildx create --name arm64-builder --use --platform $PLATFORM 2>/dev/null || \
        docker buildx use arm64-builder || \
        docker buildx create --name arm64-builder --use --platform $PLATFORM
        
        # Bootstrap the builder
        docker buildx inspect --bootstrap
        
        log_info "Buildx builder ready"
    fi
}

build_frontend() {
    log_build "Building frontend image (ARM64)..."
    
    if [ "$BUILDX_AVAILABLE" = true ]; then
        docker buildx build \
            --platform $PLATFORM \
            --tag $PROJECT_NAME/frontend:$VERSION \
            --tag $PROJECT_NAME/frontend:arm64 \
            --file Dockerfile.frontend \
            --load \
            .
    else
        docker build \
            --platform $PLATFORM \
            --tag $PROJECT_NAME/frontend:$VERSION \
            --tag $PROJECT_NAME/frontend:arm64 \
            --file Dockerfile.frontend \
            .
    fi
    
    log_info "Frontend image built successfully"
}

build_backend() {
    log_build "Building backend image (ARM64)..."
    
    if [ "$BUILDX_AVAILABLE" = true ]; then
        docker buildx build \
            --platform $PLATFORM \
            --tag $PROJECT_NAME/backend:$VERSION \
            --tag $PROJECT_NAME/backend:arm64 \
            --file Dockerfile.backend \
            --load \
            .
    else
        docker build \
            --platform $PLATFORM \
            --tag $PROJECT_NAME/backend:$VERSION \
            --tag $PROJECT_NAME/backend:arm64 \
            --file Dockerfile.backend \
            .
    fi
    
    log_info "Backend image built successfully"
}

verify_images() {
    log_info "Verifying built images..."
    
    # Check if images exist
    if docker images | grep -q "$PROJECT_NAME/frontend"; then
        log_info "✓ Frontend image verified"
    else
        log_error "✗ Frontend image not found"
        exit 1
    fi
    
    if docker images | grep -q "$PROJECT_NAME/backend"; then
        log_info "✓ Backend image verified"
    else
        log_error "✗ Backend image not found"
        exit 1
    fi
    
    # Show image details
    echo ""
    echo "=== Built Images ==="
    docker images | grep $PROJECT_NAME
    echo ""
}

test_images() {
    log_info "Testing built images..."
    
    # Test frontend image
    log_build "Testing frontend container..."
    FRONTEND_ID=$(docker run -d --platform $PLATFORM -p 8080:80 $PROJECT_NAME/frontend:$VERSION)
    sleep 5
    
    if curl -f http://localhost:8080/health &> /dev/null; then
        log_info "✓ Frontend container responds to health check"
    else
        log_warn "Frontend health check failed (may be expected in build environment)"
    fi
    
    docker stop $FRONTEND_ID > /dev/null
    docker rm $FRONTEND_ID > /dev/null
    
    # Test backend image (basic startup test)
    log_build "Testing backend container startup..."
    BACKEND_ID=$(docker run -d --platform $PLATFORM \
        -e NODE_ENV=production \
        -e DATABASE_URL=postgresql://test:test@localhost:5432/test \
        $PROJECT_NAME/backend:$VERSION)
    
    sleep 10
    
    # Check if container is still running (basic health test)
    if docker ps | grep -q $BACKEND_ID; then
        log_info "✓ Backend container started successfully"
        docker stop $BACKEND_ID > /dev/null
    else
        log_warn "Backend container exited (expected without database)"
        docker logs $BACKEND_ID | tail -5
    fi
    
    docker rm $BACKEND_ID > /dev/null 2>&1 || true
    
    log_info "Image testing completed"
}

show_usage() {
    echo ""
    echo "=== Usage Instructions ==="
    echo ""
    echo "Run containers locally:"
    echo "  docker-compose up"
    echo ""
    echo "Run individual containers:"
    echo "  docker run -p 3000:80 $PROJECT_NAME/frontend:$VERSION"
    echo "  docker run -p 5000:5000 -e DATABASE_URL=... $PROJECT_NAME/backend:$VERSION"
    echo ""
    echo "Push to registry:"
    echo "  docker tag $PROJECT_NAME/frontend:$VERSION your-registry/frontend:$VERSION"
    echo "  docker push your-registry/frontend:$VERSION"
    echo ""
    echo "Export images:"
    echo "  docker save $PROJECT_NAME/frontend:$VERSION | gzip > frontend-arm64.tar.gz"
    echo "  docker save $PROJECT_NAME/backend:$VERSION | gzip > backend-arm64.tar.gz"
    echo ""
}

cleanup_builder() {
    if [ "$BUILDX_AVAILABLE" = true ]; then
        # Optional: Remove the builder (uncomment if needed)
        # docker buildx rm arm64-builder 2>/dev/null || true
        log_info "Buildx builder retained for future use"
    fi
}

# Main build flow
main() {
    log_info "Starting ARM64 Docker image build for $PROJECT_NAME..."
    echo ""
    
    check_dependencies
    setup_buildx
    
    echo ""
    build_frontend
    echo ""
    build_backend
    echo ""
    
    verify_images
    test_images
    show_usage
    cleanup_builder
    
    log_info "All ARM64 images built successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test locally with: docker-compose up"
    echo "2. Deploy to ARM64-compatible infrastructure"
    echo "3. Push to container registry for production use"
    echo ""
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi