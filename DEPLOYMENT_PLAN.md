# AWS Deployment Plan - Customer Data Platform

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Infrastructure                     │
├─────────────────────────────────────────────────────────────────┤
│  Application Load Balancer (ALB)                               │
│  ├── Frontend (React/Vite) - ECS Fargate Container             │
│  └── Backend (Node.js/Express) - ECS Fargate Container         │
├─────────────────────────────────────────────────────────────────┤
│  RDS PostgreSQL Database (Dedicated Instance)                  │
│  S3 Bucket (Static Assets & Images)                            │
│  CloudFront CDN                                                 │
│  Route 53 DNS                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Frontend Container
- **Base**: nginx:alpine
- **Build**: Node.js 18 + Vite production build
- **Port**: 80
- **Size**: ~50MB
- **Features**: Optimized static serving, gzip compression

### 2. Backend Container  
- **Base**: node:18-alpine
- **Runtime**: Node.js + Express + TypeScript
- **Port**: 5000
- **Size**: ~200MB
- **Features**: API endpoints, Snowflake integration, session management

### 3. Database
- **Service**: RDS PostgreSQL 15
- **Instance**: db.t3.medium
- **Storage**: 100GB GP3 SSD
- **Backup**: 7-day automated backups

### 4. Static Assets
- **Storage**: S3 bucket with versioning
- **CDN**: CloudFront distribution
- **Security**: Private bucket with CloudFront access

## Deployment Steps

1. **Create Docker Images**
2. **Set up AWS Infrastructure** 
3. **Deploy Containers to ECS**
4. **Configure Database**
5. **Set up Load Balancer**
6. **Configure Domain & SSL**

## Cost Estimation (Monthly)

- ECS Fargate: $60-120
- RDS PostgreSQL: $40-80
- Load Balancer: $20
- S3 + CloudFront: $10-20
- **Total**: $130-240/month

## Security Features

- VPC with private subnets
- Security groups with minimal access
- IAM roles with least privilege
- SSL/TLS encryption
- RDS encryption at rest
- Secrets Manager for credentials

Ready to proceed with detailed implementation?