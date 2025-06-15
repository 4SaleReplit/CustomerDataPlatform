import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream, existsSync } from 'fs';
import path from 'path';

export class S3StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.S3_BUCKET_NAME || '';
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }

  isConfigured(): boolean {
    return !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET_NAME
    );
  }

  async uploadFile(localPath: string, s3Key: string, contentType: string = 'image/png'): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('S3 credentials not configured');
    }

    if (!existsSync(localPath)) {
      throw new Error(`Local file not found: ${localPath}`);
    }

    const fileStream = createReadStream(localPath);

    const uploadParams = {
      Bucket: this.bucketName,
      Key: s3Key,
      Body: fileStream,
      ContentType: contentType,
      ACL: 'public-read' as const
    };

    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
    } catch (error) {
      throw new Error(`Failed to upload to S3: ${error}`);
    }
  }

  async uploadBuffer(buffer: Buffer, s3Key: string, contentType: string = 'image/png'): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('S3 credentials not configured');
    }

    const uploadParams = {
      Bucket: this.bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read' as const
    };

    try {
      await this.s3Client.send(new PutObjectCommand(uploadParams));
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
    } catch (error) {
      throw new Error(`Failed to upload to S3: ${error}`);
    }
  }

  async deleteFile(s3Key: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('S3 credentials not configured');
    }

    const deleteParams = {
      Bucket: this.bucketName,
      Key: s3Key
    };

    try {
      await this.s3Client.send(new DeleteObjectCommand(deleteParams));
    } catch (error) {
      throw new Error(`Failed to delete from S3: ${error}`);
    }
  }

  async getSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('S3 credentials not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error}`);
    }
  }

  getPublicUrl(s3Key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
  }

  extractS3Key(url: string): string | null {
    const s3UrlPattern = new RegExp(`https://${this.bucketName}\\.s3\\.${this.region}\\.amazonaws\\.com/(.+)`);
    const match = url.match(s3UrlPattern);
    return match ? match[1] : null;
  }
}

export const s3Storage = new S3StorageService();