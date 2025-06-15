/**
 * S3 Image Migration Tool - Production Ready
 * Migrates all local images to S3 storage for production deployment
 */

const { Pool } = require('pg');
const { S3Client, PutObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

class S3ImageMigrator {
  constructor() {
    this.pool = null;
    this.s3Client = null;
    this.bucketName = '';
    this.region = 'us-east-1';
    this.migratedCount = 0;
    this.failedCount = 0;
    this.skippedCount = 0;
  }

  async askQuestion(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  async validateS3Configuration() {
    logStep(1, 'Validating S3 Configuration');

    // Check for required environment variables
    const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      logError(`Missing required environment variables: ${missing.join(', ')}`);
      
      // Interactive setup
      log('\nPlease provide the following S3 credentials:', 'yellow');
      
      if (!process.env.AWS_ACCESS_KEY_ID) {
        process.env.AWS_ACCESS_KEY_ID = await this.askQuestion('AWS Access Key ID: ');
      }
      
      if (!process.env.AWS_SECRET_ACCESS_KEY) {
        process.env.AWS_SECRET_ACCESS_KEY = await this.askQuestion('AWS Secret Access Key: ');
      }
      
      if (!process.env.S3_BUCKET_NAME) {
        process.env.S3_BUCKET_NAME = await this.askQuestion('S3 Bucket Name: ');
      }

      if (process.env.AWS_REGION) {
        this.region = process.env.AWS_REGION;
      } else {
        const region = await this.askQuestion(`AWS Region (default: ${this.region}): `);
        this.region = region || this.region;
        process.env.AWS_REGION = this.region;
      }
    }

    this.bucketName = process.env.S3_BUCKET_NAME;
    
    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Test S3 connection and bucket access
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      logSuccess(`S3 bucket "${this.bucketName}" is accessible`);
    } catch (error) {
      logError(`Cannot access S3 bucket "${this.bucketName}": ${error.message}`);
      throw new Error('S3 validation failed');
    }
  }

  async connectDatabase() {
    logStep(2, 'Connecting to Database');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      logError('DATABASE_URL environment variable is required');
      throw new Error('Database connection failed');
    }

    this.pool = new Pool({ connectionString: databaseUrl });

    try {
      await this.pool.query('SELECT 1');
      logSuccess('Database connection established');
    } catch (error) {
      logError(`Database connection failed: ${error.message}`);
      throw error;
    }
  }

  async getUploadedImages() {
    logStep(3, 'Fetching Images from Database');

    try {
      const result = await this.pool.query('SELECT * FROM uploaded_images ORDER BY created_at');
      logSuccess(`Found ${result.rows.length} images in database`);
      return result.rows;
    } catch (error) {
      logError(`Failed to fetch images: ${error.message}`);
      throw error;
    }
  }

  async uploadImageToS3(imagePath, s3Key, contentType = 'image/png') {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Local file not found: ${imagePath}`);
    }

    const fileStream = fs.createReadStream(imagePath);
    const stats = fs.statSync(imagePath);

    const uploadParams = {
      Bucket: this.bucketName,
      Key: s3Key,
      Body: fileStream,
      ContentType: contentType,
      ACL: 'public-read',
      Metadata: {
        'original-name': path.basename(imagePath),
        'file-size': stats.size.toString(),
        'migration-date': new Date().toISOString()
      }
    };

    await this.s3Client.send(new PutObjectCommand(uploadParams));
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
  }

  async updateImageUrl(imageId, newUrl) {
    await this.pool.query(
      'UPDATE uploaded_images SET url = $1, updated_at = NOW() WHERE id = $2',
      [newUrl, imageId]
    );
  }

  async migrateImages(images, options = {}) {
    logStep(4, `Migrating ${images.length} Images to S3`);

    const { dryRun = false, skipExisting = true } = options;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const progress = `[${i + 1}/${images.length}]`;
      
      try {
        log(`${progress} Processing: ${image.filename}`, 'blue');

        // Check if already migrated to S3
        if (skipExisting && image.url && image.url.includes('s3.amazonaws.com')) {
          log(`${progress} Skipping (already on S3): ${image.filename}`, 'yellow');
          this.skippedCount++;
          continue;
        }

        // Determine local file path
        const localPath = path.join(process.cwd(), 'uploads', image.filename);
        
        if (!fs.existsSync(localPath)) {
          logWarning(`${progress} Local file not found: ${localPath}`);
          this.failedCount++;
          continue;
        }

        // Generate S3 key (organize by date)
        const uploadDate = new Date(image.created_at);
        const year = uploadDate.getFullYear();
        const month = String(uploadDate.getMonth() + 1).padStart(2, '0');
        const s3Key = `images/${year}/${month}/${image.filename}`;

        if (dryRun) {
          log(`${progress} [DRY RUN] Would upload: ${localPath} -> s3://${this.bucketName}/${s3Key}`, 'cyan');
          continue;
        }

        // Upload to S3
        const s3Url = await this.uploadImageToS3(localPath, s3Key, image.content_type);
        
        // Update database with new URL
        await this.updateImageUrl(image.id, s3Url);

        logSuccess(`${progress} Migrated: ${image.filename} -> ${s3Url}`);
        this.migratedCount++;

      } catch (error) {
        logError(`${progress} Failed to migrate ${image.filename}: ${error.message}`);
        this.failedCount++;
      }
    }
  }

  async updateSlideImageReferences() {
    logStep(5, 'Updating Slide Image References');

    try {
      // Get all slides with local image references
      const slidesResult = await this.pool.query(`
        SELECT id, content 
        FROM slides 
        WHERE content LIKE '%/uploads/%' OR content LIKE '%localhost%'
      `);

      log(`Found ${slidesResult.rows.length} slides with local image references`, 'blue');

      for (const slide of slidesResult.rows) {
        let updatedContent = slide.content;
        let hasChanges = false;

        // Replace local image URLs with S3 URLs
        const localImagePattern = /(?:http:\/\/localhost:\d+)?\/uploads\/([^"'\s]+)/g;
        let match;

        while ((match = localImagePattern.exec(slide.content)) !== null) {
          const filename = match[1];
          
          // Find the corresponding S3 URL
          const imageResult = await this.pool.query(
            'SELECT url FROM uploaded_images WHERE filename = $1',
            [filename]
          );

          if (imageResult.rows.length > 0 && imageResult.rows[0].url.includes('s3.amazonaws.com')) {
            updatedContent = updatedContent.replace(match[0], imageResult.rows[0].url);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          await this.pool.query(
            'UPDATE slides SET content = $1, updated_at = NOW() WHERE id = $2',
            [updatedContent, slide.id]
          );
          logSuccess(`Updated slide ${slide.id} with S3 image references`);
        }
      }

    } catch (error) {
      logError(`Failed to update slide references: ${error.message}`);
    }
  }

  async generateMigrationReport() {
    logStep(6, 'Generating Migration Report');

    const totalImages = this.migratedCount + this.failedCount + this.skippedCount;
    
    log('\n' + '='.repeat(60), 'cyan');
    log('S3 MIGRATION REPORT', 'bright');
    log('='.repeat(60), 'cyan');
    
    log(`Total Images Processed: ${totalImages}`, 'blue');
    log(`Successfully Migrated: ${this.migratedCount}`, 'green');
    log(`Skipped (Already on S3): ${this.skippedCount}`, 'yellow');
    log(`Failed: ${this.failedCount}`, 'red');
    
    const successRate = totalImages > 0 ? ((this.migratedCount / totalImages) * 100).toFixed(1) : 0;
    log(`Success Rate: ${successRate}%`, successRate > 90 ? 'green' : 'yellow');

    log('\nPost-Migration Steps:', 'yellow');
    log('1. Update environment variables:', 'blue');
    log('   - Set S3_BUCKET_NAME in production', 'reset');
    log('   - Set AWS_ACCESS_KEY_ID in production', 'reset');
    log('   - Set AWS_SECRET_ACCESS_KEY in production', 'reset');
    log('   - Set AWS_REGION in production', 'reset');
    log('2. Test image loading in production', 'blue');
    log('3. Remove local uploads directory after verification', 'blue');
    
    log('\n' + '='.repeat(60), 'cyan');
  }

  async cleanup() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async migrate(options = {}) {
    const startTime = Date.now();
    
    try {
      log('S3 IMAGE MIGRATION TOOL', 'bright');
      log('Migrating local images to AWS S3 for production deployment\n', 'blue');

      await this.validateS3Configuration();
      await this.connectDatabase();
      
      const images = await this.getUploadedImages();
      
      if (images.length === 0) {
        logWarning('No images found to migrate');
        return;
      }

      // Show migration preview
      log('\nMigration Preview:', 'yellow');
      log(`- Source: Local uploads directory`, 'reset');
      log(`- Target: S3 bucket "${this.bucketName}"`, 'reset');
      log(`- Images to process: ${images.length}`, 'reset');
      log(`- Region: ${this.region}`, 'reset');

      if (!options.skipConfirmation) {
        const confirm = await this.askQuestion('\nProceed with migration? (y/N): ');
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
          log('Migration cancelled by user', 'yellow');
          return;
        }
      }

      await this.migrateImages(images, options);
      await this.updateSlideImageReferences();
      await this.generateMigrationReport();

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      logSuccess(`\nMigration completed in ${duration} seconds`);

    } catch (error) {
      logError(`Migration failed: ${error.message}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

async function main() {
  const migrator = new S3ImageMigrator();
  
  try {
    const args = process.argv.slice(2);
    const options = {
      dryRun: args.includes('--dry-run'),
      skipConfirmation: args.includes('--yes'),
      skipExisting: !args.includes('--force')
    };

    if (options.dryRun) {
      log('Running in DRY RUN mode - no changes will be made', 'yellow');
    }

    await migrator.migrate(options);
  } catch (error) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { S3ImageMigrator };