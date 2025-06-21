import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storage } from '../storage';

export interface PDFStorageResult {
  s3Key: string;
  publicUrl: string;
  filename: string;
}

export class PDFStorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string = '';
  private region: string = '';

  async initialize(): Promise<boolean> {
    try {
      // Get S3 integration from database
      const integrations = await storage.getIntegrationsByType('s3');
      const s3Integration = integrations.find(i => i.status === 'connected');
      
      if (!s3Integration) {
        console.warn('No connected S3 integration found for PDF storage');
        return false;
      }

      const credentials = s3Integration.credentials as any;
      
      this.s3Client = new S3Client({
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        },
      });

      this.bucketName = credentials.bucketName;
      this.region = credentials.region;
      
      console.log(`✅ PDF Storage initialized with S3 bucket: ${this.bucketName}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize PDF storage:', error);
      return false;
    }
  }

  async uploadPDF(presentationId: string, pdfBuffer: Buffer, filename: string): Promise<PDFStorageResult> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) {
        throw new Error('S3 storage not available for PDF upload');
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const s3Key = `reports/pdfs/${presentationId}/${timestamp}_${filename}`;
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        CacheControl: 'max-age=31536000', // 1 year cache
        ServerSideEncryption: 'AES256',
        Metadata: {
          'presentation-id': presentationId,
          'generated-at': new Date().toISOString(),
          'content-type': 'report-pdf'
        }
      });

      await this.s3Client.send(command);
      
      // Generate public URL for public-read objects
      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
      
      console.log(`✅ PDF uploaded to S3 with public access: ${s3Key}`);
      
      return {
        s3Key,
        publicUrl,
        filename
      };
    } catch (error) {
      console.error('Failed to upload PDF to S3:', error);
      throw error;
    }
  }

  async getSignedDownloadUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) {
        throw new Error('S3 storage not available');
      }
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      throw error;
    }
  }

  async deletePDF(s3Key: string): Promise<boolean> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) {
        throw new Error('S3 storage not available');
      }
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      console.log(`✅ PDF deleted from S3: ${s3Key}`);
      return true;
    } catch (error) {
      console.error('Failed to delete PDF from S3:', error);
      return false;
    }
  }

  async updatePresentationPdfUrl(presentationId: string, pdfUrl: string, s3Key: string): Promise<void> {
    try {
      await storage.updatePresentation(presentationId, {
        pdfUrl,
        pdfS3Key: s3Key
      });
      
      console.log(`✅ Updated presentation ${presentationId} with PDF URL: ${pdfUrl}`);
    } catch (error) {
      console.error('Failed to update presentation PDF URL:', error);
      throw error;
    }
  }
}

export const pdfStorageService = new PDFStorageService();