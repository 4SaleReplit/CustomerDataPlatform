# ARM64 Docker Build Commands

## Prerequisites
Ensure Docker with buildx support is installed on your local machine or CI/CD environment.

## Setup Multi-Platform Builder
```bash
# Create and use ARM64 builder
docker buildx create --name arm64-builder --use --platform linux/arm64
docker buildx inspect --bootstrap
```

## Build Frontend Image (ARM64)
```bash
# Build frontend with ARM64 architecture
docker buildx build \
  --platform linux/arm64 \
  --tag cdp-platform/frontend:latest \
  --tag cdp-platform/frontend:arm64 \
  --file Dockerfile.frontend \
  --load \
  .

# Verify frontend image
docker images | grep cdp-platform/frontend
```

## Build Backend Image (ARM64)
```bash
# Build backend with ARM64 architecture
docker buildx build \
  --platform linux/arm64 \
  --tag cdp-platform/backend:latest \
  --tag cdp-platform/backend:arm64 \
  --file Dockerfile.backend \
  --load \
  .

# Verify backend image
docker images | grep cdp-platform/backend
```

## Test Images Locally
```bash
# Test frontend container
docker run -d --name test-frontend -p 3000:80 cdp-platform/frontend:arm64
curl http://localhost:3000/health

# Test backend container (with environment variables)
docker run -d --name test-backend \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  cdp-platform/backend:arm64

# Check logs
docker logs test-backend

# Cleanup
docker stop test-frontend test-backend
docker rm test-frontend test-backend
```

## Push to Registry (ECR Example)
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag for ECR
docker tag cdp-platform/frontend:arm64 $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cdp-platform/frontend:latest
docker tag cdp-platform/backend:arm64 $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cdp-platform/backend:latest

# Push images
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cdp-platform/frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cdp-platform/backend:latest
```

## Export Images for Transfer
```bash
# Export ARM64 images
docker save cdp-platform/frontend:arm64 | gzip > frontend-arm64.tar.gz
docker save cdp-platform/backend:arm64 | gzip > backend-arm64.tar.gz

# Import on target system
docker load < frontend-arm64.tar.gz
docker load < backend-arm64.tar.gz
```

## Run with Docker Compose (ARM64)
```bash
# Use the updated docker-compose.yml
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs
```