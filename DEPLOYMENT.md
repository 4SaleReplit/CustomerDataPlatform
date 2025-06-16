# Customer Data Platform - Deployment Guide

## Quick Start

The Customer Data Platform is designed for simple deployment on Replit with Autoscale.

### Development Environment (Replit)
```bash
npm install
npm run dev
```

### Production Deployment

#### Prerequisites
- Replit account with Autoscale
- PostgreSQL database (Neon recommended)
- Environment variables configured in Replit Secrets

#### Replit Autoscale Deployment
1. Click the "Deploy" button in Replit
2. Configure environment secrets
3. Deploy with Autoscale for production traffic

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