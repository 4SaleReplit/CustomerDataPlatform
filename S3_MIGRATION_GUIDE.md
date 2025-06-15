# S3 Image Storage Migration Guide

## Overview

Your Customer Data Platform now includes comprehensive S3 integration that automatically handles image uploads to AWS S3 and provides migration tools to move existing local images to cloud storage for production deployment.

## S3 Integration Features

### Automatic S3 Upload
- New image uploads automatically go to S3 when configured
- Falls back to local storage if S3 credentials are missing
- Organizes images by date in S3 (images/YYYY/MM/filename)
- Maintains database references with full S3 URLs

### Migration System
- **Web Interface**: Migrate via Integrations page
- **Command Line**: `node migrate-images-to-s3.js`
- **API Endpoints**: `/api/migrate/s3` and `/api/migrate/s3/status`

## Using S3 Migration

### From Integrations Page
1. Go to **Integrations** page
2. Click **"Migrate to S3"** (blue button)
3. Enter S3 credentials:
   - **Bucket Name**: Your S3 bucket name
   - **Access Key ID**: AWS access key
   - **Secret Access Key**: AWS secret key
   - **Region**: AWS region (default: us-east-1)
4. Click **"Start S3 Migration"**

### Migration Process
1. **Validation**: Verifies S3 credentials and bucket access
2. **Upload**: Transfers all local images to S3
3. **Database Update**: Updates image URLs to point to S3
4. **Slide References**: Updates slide content with S3 URLs
5. **Validation**: Confirms successful migration

## S3 Setup Requirements

### AWS S3 Bucket Configuration
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

### IAM User Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

## Production Environment Variables

After successful migration, set these environment variables in production:

```bash
# S3 Configuration
S3_BUCKET_NAME=your-production-bucket
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE
AWS_REGION=us-east-1
```

## Command Line Migration

### Interactive Mode
```bash
node migrate-images-to-s3.js
```

### With Parameters
```bash
# Set environment variables first
export S3_BUCKET_NAME=your-bucket
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=us-east-1

# Run migration
node migrate-images-to-s3.js --yes
```

### Dry Run Mode
```bash
node migrate-images-to-s3.js --dry-run
```

## Migration Status API

### Check Migration Status
```bash
GET /api/migrate/s3/status
```

Response:
```json
{
  "total": 150,
  "local": 45,
  "s3": 105,
  "migrationNeeded": true,
  "s3Configured": false
}
```

### Start Migration via API
```bash
POST /api/migrate/s3
Content-Type: application/json

{
  "bucketName": "your-bucket",
  "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
  "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE",
  "region": "us-east-1"
}
```

## File Organization in S3

### Directory Structure
```
your-bucket/
├── images/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── image1.png
│   │   │   └── image2.jpg
│   │   ├── 02/
│   │   │   └── image3.png
│   │   └── 06/
│   │       └── image4.jpg
│   └── 2024/
│       └── 12/
│           └── old-image.png
```

### URL Format
- **S3 URL**: `https://your-bucket.s3.us-east-1.amazonaws.com/images/2025/06/filename.png`
- **Database**: Stores full S3 URL
- **Slides**: Content updated to reference S3 URLs

## Migration Safety Features

### Backup and Recovery
- Original local files remain untouched
- Database URLs updated only after successful S3 upload
- Can revert by changing environment variables back
- Detailed migration logs for troubleshooting

### Error Handling
- Validates S3 credentials before starting
- Skips files already on S3 (idempotent)
- Continues migration even if individual files fail
- Comprehensive error reporting

### Data Integrity
- Verifies upload success before updating database
- Maintains original filenames and metadata
- Preserves image quality and format
- Updates all slide references automatically

## Post-Migration Steps

### 1. Verify Migration Success
- Check that images load correctly in slides
- Verify new uploads go to S3
- Test image URLs are accessible

### 2. Update Production Environment
```bash
# Set S3 environment variables
S3_BUCKET_NAME=your-production-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### 3. Clean Up (Optional)
- Remove local images after verifying S3 migration
- Update any hardcoded image references
- Monitor S3 usage and costs

## Troubleshooting

### Common Issues

**S3 Access Denied**
- Verify bucket policy allows public read
- Check IAM user has required permissions
- Ensure bucket name is correct

**Migration Fails**
- Check AWS credentials are valid
- Verify bucket exists in specified region
- Ensure network connectivity to AWS

**Images Not Loading**
- Verify bucket has public read access
- Check S3 URLs are correctly formatted
- Confirm CORS settings if needed

### Support Commands

```bash
# Test S3 connection
aws s3 ls s3://your-bucket-name

# Check migration logs
tail -f migration.log

# Manual S3 upload test
aws s3 cp test-image.png s3://your-bucket/test/
```

## Cost Optimization

### S3 Storage Classes
- **Standard**: For frequently accessed images
- **IA (Infrequent Access)**: For older images
- **Glacier**: For archived images

### Lifecycle Policies
```json
{
  "Rules": [
    {
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 365,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

Your S3 integration provides production-ready image storage with seamless migration from local files, ensuring your Customer Data Platform scales efficiently in cloud environments.