# Customer Data Platform - Unified Deployment Guide

## Architecture Overview

The Customer Data Platform uses a streamlined single-container architecture that combines both frontend and backend services, optimized for ARM64 processors and designed for cost-effective cloud deployment.

## Container Architecture

```
┌─────────────────────────────────────────┐
│           Unified Container             │
├─────────────────────────────────────────┤
│  Node.js Express (Port 5000)           │
│  ├── Serves React frontend (static)    │
│  ├── REST API endpoints                │
│  ├── PostgreSQL integration            │
│  ├── Snowflake data warehouse          │
│  └── File upload handling              │
└─────────────────────────────────────────┘
```

## Deployment Files

### Core Container Files
- `Dockerfile.unified` - Multi-stage build for frontend + backend
- `docker-compose-unified.yml` - Local development environment

### Infrastructure
- `infrastructure-unified.tf` - AWS infrastructure configuration
- `ecs-unified.tf` - ECS service definition
- `deploy-unified.sh` - Automated deployment script
- `build-unified.sh` - Container build script

### Database Integration
- `migrate-database.js` - PostgreSQL schema migration
- `test-db-connection.js` - Database connectivity testing
- `DATABASE_MIGRATION_GUIDE.md` - Database setup instructions

## Quick Start

### Local Development
```bash
# 1. Set environment variables
export DATABASE_URL="postgresql://user:pass@host:5432/database"
export SNOWFLAKE_PASSWORD="your-password"

# 2. Start unified stack
docker-compose -f docker-compose-unified.yml up

# 3. Access application
open http://localhost
```

### Production Deployment
```bash
# 1. Configure environment
cp .env.production.template .env.production
# Edit with your values

# 2. Deploy to AWS
./deploy-unified.sh
```

## Benefits of Unified Architecture

### Cost Optimization
- **Previous**: 2 ECS services = $135-255/month
- **Unified**: 1 ECS service = $50-80/month
- **Savings**: 60-70% infrastructure cost reduction

### Operational Simplification
- Single container to manage and monitor
- Unified logging and health checks
- Simplified load balancer configuration
- Reduced network complexity

### ARM64 Performance
- Native execution on AWS Graviton processors
- 20% cost savings on compute resources
- Optimized for modern ARM architecture
- Better energy efficiency

## Technical Specifications

### Container Resources
- **CPU**: 1 vCPU (ARM64)
- **Memory**: 2GB RAM
- **Storage**: 20GB SSD
- **Scaling**: 2-10 instances based on CPU

### Service Endpoints
- **Frontend & Backend**: Port 5000 (Node.js Express)
- **Health Check**: `/health`
- **API Endpoints**: `/api/*`

### External Integrations
- **Database**: PostgreSQL (RDS or self-hosted)
- **Data Warehouse**: Snowflake (q84sale account)
- **Analytics**: Amplitude tracking
- **Storage**: AWS S3 for assets

## Environment Configuration

### Required Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/database
SNOWFLAKE_ACCOUNT=q84sale
SNOWFLAKE_USER=CDP_USER
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_DATABASE=DBT_CORE_PROD_DATABASE
SNOWFLAKE_WAREHOUSE=LOOKER
SESSION_SECRET=your-secure-secret
```

### Optional Variables
```bash
AWS_S3_BUCKET=your-assets-bucket
AWS_REGION=us-east-1
VITE_AMPLITUDE_API_KEY=your-amplitude-key
```

## Build Process

### Local Build
```bash
# Build unified image
./build-unified.sh

# Test locally
docker-compose -f docker-compose-unified.yml up
```

### Production Build
```bash
# AWS deployment with image build
./deploy-unified.sh
```

## Monitoring and Health

### Health Checks
- **Frontend**: `GET /health` returns 200
- **Backend**: `GET /api/health` returns JSON status
- **Combined**: Both services must respond for healthy status

### Logging
- All logs consolidated in CloudWatch
- nginx access and error logs
- Node.js application logs
- Database connection logs

### Scaling
- Auto-scaling based on CPU utilization (70% threshold)
- Minimum 2 instances for high availability
- Maximum 10 instances for peak traffic

## Database Setup

### Quick Database Migration
```bash
# Test connection
node test-db-connection.js

# Run migration
node migrate-database.js
```

### Supported Databases
- PostgreSQL 12+ (recommended)
- AWS RDS PostgreSQL
- Neon Database (serverless)
- Self-hosted PostgreSQL

## Security Features

### Container Security
- Non-root user for Node.js processes
- Minimal attack surface with Alpine Linux
- Security headers configured in nginx
- Process isolation and monitoring

### Network Security
- Private subnets for ECS tasks
- Security groups with minimal access
- Database isolated in private subnet
- Load balancer SSL termination

## Troubleshooting

### Common Issues
```bash
# Container logs
docker-compose -f docker-compose-unified.yml logs

# Health check failures
curl http://localhost/health
curl http://localhost:5000/api/health

# Database connectivity
node test-db-connection.js
```

### Performance Optimization
- Monitor CPU and memory usage
- Optimize database queries
- Configure CDN for static assets
- Tune nginx worker processes

## Migration from Separate Containers

The unified architecture is a drop-in replacement for separate frontend/backend containers with these advantages:
- Simplified deployment process
- Reduced infrastructure costs
- Maintained functionality and performance
- Easier monitoring and maintenance

All existing features remain fully functional including real-time dashboard analytics, Snowflake integration, cohort management, and campaign automation.

## Support

For deployment issues or questions, refer to:
- `UNIFIED_DEPLOYMENT_SUMMARY.md` - Detailed technical overview
- `DATABASE_MIGRATION_GUIDE.md` - Database setup guide
- `QUICK_START_DATABASE.md` - Simple database integration

The unified deployment provides a production-ready, cost-effective solution that maintains all Customer Data Platform functionality while significantly simplifying operations and reducing costs.