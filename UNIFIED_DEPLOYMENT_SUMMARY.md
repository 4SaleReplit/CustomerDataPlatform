# Unified Docker Deployment - Single Container Architecture

## Overview
The Customer Data Platform now uses a simplified single-container deployment that combines both frontend and backend in one Docker image, reducing complexity and infrastructure costs while maintaining all functionality.

## Architecture Benefits

### Single Container Design
- **Frontend**: React/Vite served by nginx on port 80
- **Backend**: Node.js/Express API on port 5000
- **Proxy**: nginx routes API calls to internal backend
- **Process Management**: Both services run in parallel with health monitoring

### Cost Reduction
- **Previous**: 2 separate ECS services = $135-255/month
- **Unified**: 1 ECS service = $50-80/month
- **Savings**: 40-60% reduction in infrastructure costs

### Deployment Simplification
- Single ECR repository instead of two
- One ECS service to manage
- Simplified load balancer configuration
- Reduced network complexity

## Component Files

### Docker Configuration
- `Dockerfile.unified` - Multi-stage build combining frontend and backend
- `nginx-unified.conf` - nginx configuration with API proxy
- `start-unified.sh` - Process management script
- `docker-compose-unified.yml` - Local development setup

### Infrastructure
- `infrastructure-unified.tf` - Simplified AWS infrastructure
- `ecs-unified.tf` - Single ECS service configuration
- `deploy-unified.sh` - Automated deployment script

## Build Process

### Multi-Stage Build
1. **Builder Stage**: Compiles both React frontend and TypeScript backend
2. **Production Stage**: nginx + Node.js runtime with ARM64 optimization
3. **Process Management**: Parallel execution with health monitoring

### Build Commands
```bash
# Build unified image
docker buildx build --platform linux/arm64 -f Dockerfile.unified -t cdp-platform/unified:latest .

# Local testing
docker-compose -f docker-compose-unified.yml up

# Production deployment
./deploy-unified.sh
```

## Local Development

### Quick Start
```bash
# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/cdp_platform"
export SNOWFLAKE_PASSWORD="your-password"

# Start unified stack
docker-compose -f docker-compose-unified.yml up
```

### Service Access
- **Frontend**: http://localhost/
- **Backend API**: http://localhost/api/
- **Direct Backend**: http://localhost:5000/
- **Database**: localhost:5432

## Production Deployment

### Infrastructure Components
- **ECS Fargate**: Single service with 2-10 instances
- **Application Load Balancer**: Routes to unified container port 80
- **RDS PostgreSQL**: Dedicated database instance
- **S3**: Asset storage bucket
- **Secrets Manager**: Secure credential storage

### ARM64 Optimization
- Native ARM64 performance on AWS Graviton
- 20% cost savings on compute
- Optimized container images
- Better energy efficiency

## Process Management

### Service Monitoring
The unified container runs both services with automatic restart:
- nginx process monitoring and restart
- Node.js process monitoring and restart
- Health checks for both services
- Graceful shutdown handling

### Health Checks
```bash
# Combined health check
curl -f http://localhost/ && curl -f http://localhost:5000/api/health

# Individual service checks
curl http://localhost/health          # nginx
curl http://localhost:5000/api/health # backend
```

## Environment Configuration

### Development
```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/cdp_platform
SNOWFLAKE_ACCOUNT=q84sale
SNOWFLAKE_USER=CDP_USER
SNOWFLAKE_PASSWORD=your-password
SESSION_SECRET=development-secret
```

### Production (AWS)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:pass@rds-endpoint:5432/cdp_platform
AWS_S3_BUCKET=cdp-platform-assets-xyz
AWS_REGION=us-east-1
# Secrets from AWS Secrets Manager
```

## Deployment Process

### Automated Deployment
```bash
# Configure environment
cp .env.production.template .env.production
# Edit .env.production with your values

# Deploy to AWS
chmod +x deploy-unified.sh
./deploy-unified.sh
```

### Manual Steps
1. Set AWS credentials and region
2. Configure environment variables
3. Run deployment script
4. Configure DNS and SSL

## Performance Characteristics

### Container Resources
- **CPU**: 1 vCPU (ARM64 Graviton)
- **Memory**: 2GB RAM
- **Storage**: 20GB SSD
- **Network**: Optimized for API traffic

### Scaling Configuration
- **Min Instances**: 2
- **Max Instances**: 10
- **Target CPU**: 70%
- **Auto-scaling**: Based on CPU and memory

### Expected Performance
- **Frontend Load Time**: <2 seconds
- **API Response Time**: <200ms
- **Database Queries**: <100ms
- **Snowflake Queries**: 1-3 seconds

## Monitoring and Maintenance

### CloudWatch Integration
- Container logs in `/ecs/cdp-platform/app`
- CPU and memory metrics
- Health check monitoring
- Auto-scaling events

### Maintenance Tasks
- **Weekly**: Review logs and metrics
- **Monthly**: Update container image
- **Quarterly**: Review scaling policies
- **As needed**: Database maintenance

## Migration from Separate Containers

### Migration Steps
1. Build unified image
2. Update infrastructure configuration
3. Deploy new ECS service
4. Test functionality
5. Remove old services
6. Update DNS if needed

### Rollback Plan
The separate container configurations remain available for rollback if needed.

## Security Configuration

### Container Security
- Non-root user for Node.js process
- nginx runs with minimal privileges
- Security headers configured
- Process isolation

### Network Security
- Private subnets for containers
- Security groups with minimal access
- ALB security groups
- Database security isolation

## Cost Analysis

### Monthly Costs (USD)
- **ECS Fargate**: $30-50 (single service)
- **RDS PostgreSQL**: $15-25 (db.t3.micro)
- **Application Load Balancer**: $20
- **S3 + Data Transfer**: $5-10
- **Total**: $50-80/month

### Cost Comparison
- **Separate Containers**: $135-255/month
- **Unified Container**: $50-80/month
- **Savings**: $85-175/month (60-70% reduction)

## Troubleshooting

### Common Issues
```bash
# Check container logs
docker-compose -f docker-compose-unified.yml logs

# Test individual processes
docker exec -it container_name curl http://localhost/
docker exec -it container_name curl http://localhost:5000/api/health

# Restart specific process
docker exec -it container_name pkill nginx
# (will auto-restart via start-unified.sh)
```

### Performance Optimization
- Monitor CPU and memory usage
- Optimize nginx configuration
- Tune database connections
- Configure CloudFront caching

The unified deployment provides a production-ready, cost-effective solution that maintains all Customer Data Platform functionality while significantly reducing infrastructure complexity and costs.