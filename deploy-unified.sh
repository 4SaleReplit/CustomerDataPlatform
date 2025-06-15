#!/bin/bash

# Unified AWS Deployment Script - Single Container for Frontend + Backend
set -e

# Configuration
PROJECT_NAME="cdp-platform"
AWS_REGION="us-east-1"
ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed"
        exit 1
    fi
    
    log_info "All dependencies are installed"
}

setup_environment() {
    log_info "Setting up environment variables..."
    
    if [ ! -f ".env.production" ]; then
        log_warn ".env.production not found, creating template..."
        cat > .env.production << EOF
# AWS Configuration
AWS_REGION=$AWS_REGION
AWS_ACCOUNT_ID=

# Domain Configuration
DOMAIN_NAME=your-domain.com

# Database Configuration
DB_PASSWORD=your-secure-password

# Snowflake Configuration
SNOWFLAKE_PASSWORD=your-snowflake-password

# Session Configuration
SESSION_SECRET=your-session-secret

# Project Configuration
PROJECT_NAME=$PROJECT_NAME
ENVIRONMENT=$ENVIRONMENT
EOF
        log_error "Please fill in .env.production and run again"
        exit 1
    fi
    
    source .env.production
    export $(cut -d= -f1 .env.production)
    
    log_info "Environment variables loaded"
}

get_account_id() {
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    export AWS_ACCOUNT_ID
    log_info "AWS Account ID: $AWS_ACCOUNT_ID"
}

create_ecr_repository() {
    log_info "Creating ECR repository..."
    
    aws ecr describe-repositories --repository-names "$PROJECT_NAME/unified" --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name "$PROJECT_NAME/unified" --region $AWS_REGION
    
    log_info "ECR repository ready"
}

build_and_push_unified_image() {
    log_info "Building and pushing unified Docker image..."
    
    # Get ECR login token
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Build unified image
    log_info "Building unified image (frontend + backend)..."
    docker buildx build \
        --platform linux/arm64 \
        -f Dockerfile.unified \
        -t $PROJECT_NAME/unified:latest \
        --load \
        .
    
    # Tag for ECR
    docker tag $PROJECT_NAME/unified:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/unified:latest
    
    # Push to ECR
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/unified:latest
    
    log_info "Unified Docker image pushed to ECR"
}

deploy_infrastructure() {
    log_info "Deploying simplified infrastructure with Terraform..."
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    terraform plan \
        -var="aws_region=$AWS_REGION" \
        -var="project_name=$PROJECT_NAME" \
        -var="environment=$ENVIRONMENT" \
        -var="domain_name=$DOMAIN_NAME" \
        -var="db_password=$DB_PASSWORD" \
        -var="snowflake_password=$SNOWFLAKE_PASSWORD" \
        -var="session_secret=$SESSION_SECRET" \
        -out=tfplan
    
    # Apply deployment
    terraform apply tfplan
    
    log_info "Infrastructure deployed successfully"
}

setup_database() {
    log_info "Setting up database schema..."
    
    # Get database endpoint from Terraform output
    DB_ENDPOINT=$(terraform output -raw database_endpoint)
    
    # Run database migrations
    DATABASE_URL="postgresql://postgres:$DB_PASSWORD@$DB_ENDPOINT/cdp_platform" node migrate-database.js
    
    log_info "Database schema initialized"
}

update_ecs_service() {
    log_info "Updating ECS service..."
    
    # Force new deployment to pick up latest image
    aws ecs update-service \
        --cluster "$PROJECT_NAME-cluster" \
        --service "$PROJECT_NAME-app" \
        --force-new-deployment \
        --region $AWS_REGION
    
    log_info "ECS service updated"
}

wait_for_deployment() {
    log_info "Waiting for service to stabilize..."
    
    aws ecs wait services-stable \
        --cluster "$PROJECT_NAME-cluster" \
        --services "$PROJECT_NAME-app" \
        --region $AWS_REGION
    
    log_info "Service is stable"
}

show_endpoints() {
    log_info "Deployment completed successfully!"
    
    ALB_DNS=$(terraform output -raw load_balancer_dns)
    S3_BUCKET=$(terraform output -raw s3_bucket_name)
    
    echo ""
    echo "=== Unified Deployment Information ==="
    echo "Application URL: http://$ALB_DNS"
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo "S3 Assets Bucket: $S3_BUCKET"
    echo ""
    echo "Architecture: Single container with:"
    echo "  • Frontend (React/Vite) served by nginx on port 80"
    echo "  • Backend (Node.js/Express) API on port 5000"
    echo "  • PostgreSQL database (RDS)"
    echo "  • Snowflake integration"
    echo ""
    echo "Next steps:"
    echo "1. Configure your domain DNS to point to: $ALB_DNS"
    echo "2. Set up SSL certificate in AWS Certificate Manager"
    echo "3. Update ALB listener to use HTTPS"
    echo "4. Test the application functionality"
    echo ""
    echo "Cost Estimate: ~$50-80/month (vs $135-255 with separate containers)"
    echo ""
}

# Main deployment flow
main() {
    log_info "Starting unified deployment of $PROJECT_NAME to AWS..."
    
    check_dependencies
    setup_environment
    get_account_id
    create_ecr_repository
    build_and_push_unified_image
    deploy_infrastructure
    setup_database
    update_ecs_service
    wait_for_deployment
    show_endpoints
    
    log_info "Unified deployment completed successfully!"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi