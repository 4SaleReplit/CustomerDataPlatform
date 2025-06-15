# Customer Data Platform - Deployment Guide

## Quick Start

The Customer Data Platform uses a simplified single-container architecture optimized for production deployment.

### Development Environment (Replit)
```bash
npm install
npm run dev
```

### Local Docker Testing (Recommended First Step)

Before deploying to AWS, test the complete functionality locally with Docker:

#### Prerequisites
- Docker and Docker Compose installed
- Environment variables configured in `.env`

#### Local Docker Build & Test

**Option 1: Automated Testing Script (Recommended)**
```bash
# Run the automated testing script
./test-docker-local.sh
```

**Option 2: Manual Testing**
```bash
# Build production image locally
docker build -f Dockerfile.production -t cdp-platform:latest .

# Test locally with docker-compose
docker-compose -f docker-compose.production.yml up

# Access application at http://localhost:5000
# Verify all features work as expected
```

**Monitoring and Debugging**
```bash
# View application logs
docker-compose -f docker-compose.production.yml logs -f

# Stop the application
docker-compose -f docker-compose.production.yml down

# Rebuild if needed
docker-compose -f docker-compose.production.yml up --build
```

#### Local Testing Checklist
- [ ] Application loads successfully
- [ ] Database connections work
- [ ] Snowflake queries execute
- [ ] Amplitude analytics track events
- [ ] File uploads function
- [ ] All pages render correctly
- [ ] User authentication works

#### Troubleshooting Local Docker Issues

**Common Issues and Solutions:**

1. **Port Already in Use**
   ```bash
   # Kill process using port 5000
   lsof -ti:5000 | xargs kill -9
   ```

2. **Environment Variables Not Loaded**
   - Verify `.env` file exists in project root
   - Check environment variables are properly formatted
   - Restart containers: `docker-compose -f docker-compose.production.yml down && docker-compose -f docker-compose.production.yml up`

3. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check network connectivity to database
   - Ensure database allows connections from Docker containers

4. **Build Failures**
   ```bash
   # Clean Docker cache and rebuild
   docker system prune -f
   docker build --no-cache -f Dockerfile.production -t cdp-platform:latest .
   ```

5. **Application Not Starting**
   ```bash
   # Check container logs
   docker-compose -f docker-compose.production.yml logs
   
   # Check container status
   docker-compose -f docker-compose.production.yml ps
   ```

### Production Deployment (After Local Testing)

#### Prerequisites
- Local Docker testing completed successfully
- AWS account configured
- Production database (Neon) provisioned
- Production environment variables configured

#### AWS Production Deployment
```bash
# Build and tag for production
./build-production.sh

# Deploy to AWS
./deploy-production.sh
```

## Architecture

**Simplified Container Strategy:**
- Single Express.js container serving both API and static files
- No nginx required - 40-50% memory reduction
- ARM64 optimized for AWS Graviton processors
- 70-75% infrastructure cost savings

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# External Services
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema

# Analytics (Optional)
VITE_AMPLITUDE_API_KEY=your_amplitude_key

# File Storage (Optional)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET_NAME=your_bucket
AWS_REGION=us-east-1
```

## Migration Tools

### Database Migration
Use the built-in migration interface in Admin → Migrations or run:
```bash
node migrate-production-database.js
```

### Image Migration to S3
For production file storage:
```bash
node migrate-images-to-s3.js
```

## Production Files

- `Dockerfile.production` - Production container configuration
- `docker-compose.production.yml` - Production orchestration
- `build-production.sh` - Automated build script
- `deploy-production.sh` - Automated deployment script

## Platform Support

- **Development**: Replit cloud environment
- **Production**: AWS, Google Cloud, Azure, or any Docker-compatible platform
- **Database**: Neon PostgreSQL, AWS RDS, or any PostgreSQL provider
- **Analytics**: Snowflake for data warehousing
- **File Storage**: Local filesystem (development) or AWS S3 (production)

## Monitoring

The application includes built-in health checks and comprehensive Amplitude analytics for monitoring user interactions and system performance.

## Support

For deployment issues, check the application logs and ensure all required environment variables are properly configured.