# AWS Deployment Guide - Customer Data Platform

## Complete Deployment Plan

This guide provides a comprehensive deployment strategy for the Customer Data Platform on AWS using containerized architecture with separate Docker containers for frontend and backend components.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      AWS Production Architecture                │
├─────────────────────────────────────────────────────────────────┤
│  Route 53 DNS → CloudFront CDN → Application Load Balancer     │
│  ├── Frontend Container (React/Vite) - ECS Fargate             │
│  └── Backend Container (Node.js/Express) - ECS Fargate         │
├─────────────────────────────────────────────────────────────────┤
│  RDS PostgreSQL (Dedicated Instance)                           │
│  S3 Bucket (Static Assets) + CloudFront                        │
│  ECR (Container Registry)                                       │
│  Secrets Manager (Credentials)                                  │
│  CloudWatch (Monitoring & Logs)                                │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Docker** installed locally
4. **Terraform** v1.0+ installed
5. **Domain name** configured in Route 53
6. **SSL certificate** in AWS Certificate Manager

## Component Details

### Frontend Container
- **Base Image**: nginx:alpine
- **Build**: Node.js 18 + Vite production build
- **Port**: 80
- **Size**: ~50MB optimized
- **Features**: Gzip compression, security headers, health checks

### Backend Container
- **Base Image**: node:18-alpine
- **Runtime**: Express API with TypeScript
- **Port**: 5000
- **Size**: ~200MB with dependencies
- **Features**: Health endpoints, Snowflake integration, session management

### Infrastructure Components
- **ECS Fargate**: Serverless container hosting
- **RDS PostgreSQL**: Managed database (db.t3.medium)
- **Application Load Balancer**: Traffic distribution
- **VPC**: Isolated network with public/private subnets
- **S3 + CloudFront**: Static asset delivery
- **Secrets Manager**: Secure credential storage

## Deployment Steps

### 1. Initial Setup

```bash
# Clone repository
git clone <your-repository>
cd customer-data-platform

# Copy environment template
cp .env.production.template .env.production

# Edit configuration (required)
nano .env.production
```

### 2. Configure Environment Variables

Edit `.env.production` with your values:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Domain Configuration  
DOMAIN_NAME=your-domain.com

# Database Configuration
DB_PASSWORD=secure-random-password

# Snowflake Configuration (Your existing setup)
SNOWFLAKE_ACCOUNT=q84sale
SNOWFLAKE_USER=CDP_USER
SNOWFLAKE_PASSWORD=your-snowflake-password
SNOWFLAKE_DATABASE=DBT_CORE_PROD_DATABASE
SNOWFLAKE_WAREHOUSE=LOOKER

# Session Security
SESSION_SECRET=long-random-string-for-sessions
```

### 3. Deploy Infrastructure

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run complete deployment
./deploy.sh
```

The deployment script will:
1. Validate dependencies and environment
2. Create ECR repositories
3. Build and push Docker images
4. Deploy infrastructure with Terraform
5. Initialize database schema
6. Start ECS services
7. Display access information

### 4. Manual Configuration Steps

After deployment, complete these steps:

1. **DNS Configuration**
   ```bash
   # Point your domain to the load balancer
   # Get ALB DNS from deployment output
   ```

2. **SSL Certificate**
   - Request certificate in AWS Certificate Manager
   - Add HTTPS listener to load balancer

3. **Domain Validation**
   - Verify DNS propagation
   - Test HTTPS endpoint

## File Structure

```
project-root/
├── Dockerfile.frontend          # Frontend container definition
├── Dockerfile.backend           # Backend container definition
├── docker-compose.yml           # Local development setup
├── infrastructure.tf            # Main AWS infrastructure
├── ecs-frontend.tf              # Frontend ECS configuration
├── ecs-backend.tf               # Backend ECS configuration
├── deploy.sh                    # Automated deployment script
├── nginx.conf                   # Frontend web server config
├── env-config.sh                # Runtime environment setup
├── .env.production.template     # Environment configuration template
└── AWS_DEPLOYMENT_README.md     # This guide
```

## Environment Management

### Production Environment Variables

**Backend Container:**
- `NODE_ENV=production`
- `DATABASE_URL` (auto-generated from RDS)
- `AWS_S3_BUCKET` (auto-generated)
- `SNOWFLAKE_*` (from Secrets Manager)
- `SESSION_SECRET` (from Secrets Manager)

**Frontend Container:**
- `VITE_API_URL` (load balancer URL)
- `VITE_AWS_S3_BUCKET` (S3 bucket name)
- `VITE_AWS_CLOUDFRONT_URL` (CDN URL)

### Security Configuration

1. **Network Security**
   - VPC with private subnets for containers
   - Security groups with minimal access
   - RDS in private subnet only

2. **Data Security**
   - RDS encryption at rest
   - SSL/TLS for all communications
   - Secrets Manager for credentials

3. **Access Control**
   - IAM roles with least privilege
   - Container-level security
   - Regular security updates

## Monitoring & Maintenance

### CloudWatch Monitoring
- Container logs in CloudWatch Logs
- Custom metrics and alarms
- Performance monitoring

### Health Checks
- Load balancer health checks
- Container health endpoints
- Database connection monitoring

### Backup Strategy
- RDS automated backups (7-day retention)
- S3 versioning for static assets
- Infrastructure as Code backup

## Cost Optimization

### Monthly Cost Breakdown (USD)
- **ECS Fargate**: $60-120 (2 services, auto-scaling)
- **RDS PostgreSQL**: $40-80 (db.t3.medium)
- **Application Load Balancer**: $20
- **S3 + CloudFront**: $10-20
- **Data Transfer**: $5-15
- **Total Estimated**: $135-255/month

### Cost Optimization Tips
1. Use Fargate Spot for non-critical workloads
2. Enable RDS storage auto-scaling
3. Configure CloudFront caching
4. Monitor unused resources

## Scaling Configuration

### Auto Scaling Setup
- **Frontend**: 2-10 containers based on CPU
- **Backend**: 2-10 containers based on CPU/memory
- **Database**: Storage auto-scaling enabled
- **Load Balancer**: Automatic traffic distribution

### Performance Optimization
- Container resource optimization
- Database query optimization
- CDN cache configuration
- Connection pooling

## Troubleshooting

### Common Issues

1. **Container Startup Failures**
   ```bash
   # Check ECS logs
   aws logs get-log-events --log-group-name /ecs/cdp-platform/backend
   ```

2. **Database Connection Issues**
   ```bash
   # Verify security groups and connectivity
   aws rds describe-db-instances --db-instance-identifier cdp-platform-db
   ```

3. **Load Balancer Health Checks**
   ```bash
   # Check target group health
   aws elbv2 describe-target-health --target-group-arn <target-group-arn>
   ```

### Recovery Procedures

1. **Service Recovery**
   ```bash
   # Force new deployment
   aws ecs update-service --cluster cdp-platform-cluster --service cdp-platform-backend --force-new-deployment
   ```

2. **Database Recovery**
   - Automated backups available
   - Point-in-time recovery supported
   - Manual snapshot creation

## Security Best Practices

1. **Network Security**
   - Private subnets for all application components
   - WAF protection for public endpoints
   - VPC flow logs enabled

2. **Application Security**
   - Regular container image updates
   - Vulnerability scanning enabled
   - Secrets rotation policy

3. **Data Protection**
   - Encryption in transit and at rest
   - Regular backup verification
   - Access logging enabled

## Support & Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Review CloudWatch metrics and logs
2. **Monthly**: Update container images and dependencies
3. **Quarterly**: Review cost optimization opportunities
4. **Annually**: Update SSL certificates and credentials

### Emergency Contacts
- AWS Support (if applicable)
- Infrastructure team contact
- Application team contact

## Deployment Checklist

- [ ] AWS credentials configured
- [ ] Environment variables set
- [ ] Domain name ready
- [ ] SSL certificate prepared
- [ ] Snowflake credentials verified
- [ ] Deployment script executed
- [ ] DNS configuration completed
- [ ] HTTPS setup verified
- [ ] Application functionality tested
- [ ] Monitoring configured
- [ ] Backup verification completed

## Next Steps After Deployment

1. **Immediate Post-Deployment**
   - Verify application functionality
   - Test database connections
   - Confirm Snowflake integration
   - Validate user authentication

2. **Performance Optimization**
   - Monitor application metrics
   - Optimize database queries
   - Configure CDN caching
   - Review auto-scaling policies

3. **Security Hardening**
   - Enable AWS WAF
   - Configure security monitoring
   - Set up intrusion detection
   - Review access permissions

This deployment plan provides a production-ready, scalable, and secure infrastructure for the Customer Data Platform on AWS. The containerized architecture ensures easy maintenance and updates while providing high availability and performance.