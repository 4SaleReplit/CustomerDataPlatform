#!/bin/bash

# AWS Deployment Script for Customer Data Platform
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

# Functions
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
    
    # Check if .env.production exists
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
    
    # Source environment variables
    source .env.production
    export $(cut -d= -f1 .env.production)
    
    log_info "Environment variables loaded"
}

get_account_id() {
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    export AWS_ACCOUNT_ID
    log_info "AWS Account ID: $AWS_ACCOUNT_ID"
}

create_ecr_repositories() {
    log_info "Creating ECR repositories..."
    
    # Create frontend repository
    aws ecr describe-repositories --repository-names "$PROJECT_NAME/frontend" --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name "$PROJECT_NAME/frontend" --region $AWS_REGION
    
    # Create backend repository
    aws ecr describe-repositories --repository-names "$PROJECT_NAME/backend" --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name "$PROJECT_NAME/backend" --region $AWS_REGION
    
    log_info "ECR repositories ready"
}

build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Get ECR login token
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Build and push frontend
    log_info "Building frontend image..."
    docker build -f Dockerfile.frontend -t $PROJECT_NAME/frontend .
    docker tag $PROJECT_NAME/frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/frontend:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/frontend:latest
    
    # Build and push backend
    log_info "Building backend image..."
    docker build -f Dockerfile.backend -t $PROJECT_NAME/backend .
    docker tag $PROJECT_NAME/backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/backend:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME/backend:latest
    
    log_info "Docker images pushed to ECR"
}

deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    
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
    DATABASE_URL="postgresql://postgres:$DB_PASSWORD@$DB_ENDPOINT/cdp_platform" npm run db:push
    
    log_info "Database schema initialized"
}

update_ecs_services() {
    log_info "Updating ECS services..."
    
    # Force new deployment to pick up latest images
    aws ecs update-service \
        --cluster "$PROJECT_NAME-cluster" \
        --service "$PROJECT_NAME-frontend" \
        --force-new-deployment \
        --region $AWS_REGION
    
    aws ecs update-service \
        --cluster "$PROJECT_NAME-cluster" \
        --service "$PROJECT_NAME-backend" \
        --force-new-deployment \
        --region $AWS_REGION
    
    log_info "ECS services updated"
}

wait_for_deployment() {
    log_info "Waiting for services to stabilize..."
    
    aws ecs wait services-stable \
        --cluster "$PROJECT_NAME-cluster" \
        --services "$PROJECT_NAME-frontend" "$PROJECT_NAME-backend" \
        --region $AWS_REGION
    
    log_info "Services are stable"
}

show_endpoints() {
    log_info "Deployment completed successfully!"
    
    ALB_DNS=$(terraform output -raw load_balancer_dns)
    CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain)
    
    echo ""
    echo "=== Deployment Information ==="
    echo "Application URL: http://$ALB_DNS"
    echo "CloudFront CDN: https://$CLOUDFRONT_DOMAIN"
    echo "Environment: $ENVIRONMENT"
    echo "Region: $AWS_REGION"
    echo ""
    echo "Next steps:"
    echo "1. Configure your domain DNS to point to: $ALB_DNS"
    echo "2. Set up SSL certificate in AWS Certificate Manager"
    echo "3. Update ALB listener to use HTTPS"
    echo "4. Test the application functionality"
    echo ""
}

# Main deployment flow
main() {
    log_info "Starting deployment of $PROJECT_NAME to AWS..."
    
    check_dependencies
    setup_environment
    get_account_id
    create_ecr_repositories
    build_and_push_images
    deploy_infrastructure
    setup_database
    update_ecs_services
    wait_for_deployment
    show_endpoints
    
    log_info "Deployment completed successfully!"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi