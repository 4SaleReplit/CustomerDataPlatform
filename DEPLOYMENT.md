# Customer Data Platform - Deployment Guide

## Quick Start

The Customer Data Platform supports both Replit deployment and Docker deployment.

### Development Environment
```bash
npm install
npm run dev
```

### Production Deployment Options

#### Option 1: Replit Autoscale (Recommended)
1. Configure .env file with DATABASE_URL for production database
2. Set up integrations through the admin interface 
3. Click "Deploy" button in Replit
4. Deploy with Autoscale for production traffic

#### Option 2: Docker Deployment

**Fix for "Vite requires" error:**
The issue you encountered was caused by the original build trying to use Vite in production. Use the dedicated production server instead:

```bash
# Method 1: Use the build script (recommended)
./build-docker.sh

# Method 2: Manual build process
npm run build
npx esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18
docker build -t cdp-platform .
docker run -p 5000:5000 --env-file .env cdp-platform

# Method 3: Direct production server (no Docker)
NODE_ENV=production tsx server/production-server.ts
```

**Key changes that fix the Vite issue:**
- Uses `server/production-server.ts` instead of `server/index.ts`
- Eliminates all Vite dependencies in production
- Properly serves static files without development tools

## Architecture

**Replit-Optimized Strategy:**
- Single Express.js application serving both API and static files
- No containerization required
- Automatic scaling and load balancing
- Simplified deployment process

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

## Platform Support

- **Development**: Replit cloud environment
- **Production**: Replit Autoscale deployment
- **Database**: Neon PostgreSQL or any PostgreSQL provider
- **Analytics**: Snowflake for data warehousing
- **File Storage**: Local filesystem (development) or AWS S3 (production)

## Monitoring

The application includes comprehensive Amplitude analytics for monitoring user interactions and system performance.

## Support

For deployment issues, check the Replit console logs and ensure all required environment variables are properly configured in Replit Secrets.d.