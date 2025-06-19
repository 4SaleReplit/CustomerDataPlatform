import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storage } from '../storage';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

export interface TemplateS3Storage {
  templateS3Key: string;
  templateUrl: string;
  slides: SlideS3Storage[];
  images: ImageS3Storage[];
}

export interface SlideS3Storage {
  slideId: string;
  s3Key: string;
  url: string;
}

export interface ImageS3Storage {
  imageId: string;
  s3Key: string;
  url: string;
  originalPath: string;
}

export class TemplateS3StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string = '';
  private region: string = '';

  async initialize(): Promise<boolean> {
    try {
      // Get S3 integration from database
      const integrations = await storage.getIntegrationsByType('s3');
      const s3Integration = integrations.find(i => i.status === 'connected');
      
      if (!s3Integration) {
        console.warn('No connected S3 integration found for template storage');
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
      
      console.log(`✅ Template S3 Storage initialized with bucket: ${this.bucketName}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize template S3 storage:', error);
      return false;
    }
  }

  async storeTemplate(templateId: string, templateData: any, slideIds: string[]): Promise<TemplateS3Storage> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) {
        throw new Error('S3 storage not available');
      }
    }

    const templateS3Key = `templates/${templateId}/template.json`;
    const slides: SlideS3Storage[] = [];
    const images: ImageS3Storage[] = [];

    try {
      // 1. Store template metadata
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: templateS3Key,
        Body: JSON.stringify(templateData, null, 2),
        ContentType: 'application/json',
      }));

      const templateUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${templateS3Key}`;
      console.log(`✅ Template metadata stored: ${templateS3Key}`);

      // 2. Store each slide's content and extract images
      for (const slideId of slideIds) {
        const slide = await storage.getSlide(slideId);
        if (slide) {
          // Store slide content
          const slideS3Key = `templates/${templateId}/slides/${slideId}.json`;
          await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: slideS3Key,
            Body: JSON.stringify(slide, null, 2),
            ContentType: 'application/json',
          }));

          const slideUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${slideS3Key}`;
          slides.push({ slideId, s3Key: slideS3Key, url: slideUrl });
          
          // 3. Extract and store images from slide elements
          if (slide.elements && Array.isArray(slide.elements)) {
            for (const element of slide.elements) {
              if (element.type === 'image') {
                if (element.uploadedImageId) {
                  // Store uploaded image
                  const imageRecord = await storage.getUploadedImage(element.uploadedImageId);
                  if (imageRecord) {
                    const localPath = path.join('uploads', imageRecord.filename);
                    if (existsSync(localPath)) {
                      const imageS3Key = `templates/${templateId}/images/${element.uploadedImageId}_${imageRecord.filename}`;
                      const fileBuffer = readFileSync(localPath);
                      
                      await this.s3Client.send(new PutObjectCommand({
                        Bucket: this.bucketName,
                        Key: imageS3Key,
                        Body: fileBuffer,
                        ContentType: imageRecord.mimeType || 'image/png',
                      }));

                      const imageUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${imageS3Key}`;
                      images.push({ 
                        imageId: element.uploadedImageId, 
                        s3Key: imageS3Key, 
                        url: imageUrl,
                        originalPath: localPath
                      });
                      
                      console.log(`✅ Image stored: ${imageS3Key}`);
                    }
                  }
                } else if (element.content && element.content.startsWith('/uploads/')) {
                  // Handle direct file path references
                  const filename = path.basename(element.content);
                  const localPath = path.join('.', element.content);
                  if (existsSync(localPath)) {
                    const imageS3Key = `templates/${templateId}/images/${filename}`;
                    const fileBuffer = readFileSync(localPath);
                    
                    await this.s3Client.send(new PutObjectCommand({
                      Bucket: this.bucketName,
                      Key: imageS3Key,
                      Body: fileBuffer,
                      ContentType: 'image/png',
                    }));

                    const imageUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${imageS3Key}`;
                    images.push({ 
                      imageId: filename, 
                      s3Key: imageS3Key, 
                      url: imageUrl,
                      originalPath: localPath
                    });
                    
                    console.log(`✅ Direct image stored: ${imageS3Key}`);
                  }
                }
              }
            }
          }
        }
      }

      console.log(`✅ Template ${templateId} stored with ${slides.length} slides and ${images.length} images`);
      
      return {
        templateS3Key,
        templateUrl,
        slides,
        images
      };

    } catch (error) {
      console.error('Failed to store template in S3:', error);
      throw error;
    }
  }

  async storeReport(reportId: string, reportData: any, slideIds: string[]): Promise<TemplateS3Storage> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) {
        throw new Error('S3 storage not available');
      }
    }

    const reportS3Key = `reports/${reportId}/report.json`;
    const slides: SlideS3Storage[] = [];
    const images: ImageS3Storage[] = [];

    try {
      // 1. Store report metadata
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: reportS3Key,
        Body: JSON.stringify(reportData, null, 2),
        ContentType: 'application/json',
      }));

      const reportUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${reportS3Key}`;
      console.log(`✅ Report metadata stored: ${reportS3Key}`);

      // 2. Store each slide's content and extract images
      for (const slideId of slideIds) {
        const slide = await storage.getSlide(slideId);
        if (slide) {
          // Store slide content
          const slideS3Key = `reports/${reportId}/slides/${slideId}.json`;
          await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: slideS3Key,
            Body: JSON.stringify(slide, null, 2),
            ContentType: 'application/json',
          }));

          const slideUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${slideS3Key}`;
          slides.push({ slideId, s3Key: slideS3Key, url: slideUrl });
          
          // 3. Extract and store images from slide elements
          if (slide.elements && Array.isArray(slide.elements)) {
            for (const element of slide.elements) {
              if (element.type === 'image') {
                if (element.uploadedImageId) {
                  // Store uploaded image
                  const imageRecord = await storage.getUploadedImage(element.uploadedImageId);
                  if (imageRecord) {
                    const localPath = path.join('uploads', imageRecord.filename);
                    if (existsSync(localPath)) {
                      const imageS3Key = `reports/${reportId}/images/${element.uploadedImageId}_${imageRecord.filename}`;
                      const fileBuffer = readFileSync(localPath);
                      
                      await this.s3Client.send(new PutObjectCommand({
                        Bucket: this.bucketName,
                        Key: imageS3Key,
                        Body: fileBuffer,
                        ContentType: imageRecord.mimeType || 'image/png',
                      }));

                      const imageUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${imageS3Key}`;
                      images.push({ 
                        imageId: element.uploadedImageId, 
                        s3Key: imageS3Key, 
                        url: imageUrl,
                        originalPath: localPath
                      });
                      
                      console.log(`✅ Report image stored: ${imageS3Key}`);
                    }
                  }
                } else if (element.content && element.content.startsWith('/uploads/')) {
                  // Handle direct file path references
                  const filename = path.basename(element.content);
                  const localPath = path.join('.', element.content);
                  if (existsSync(localPath)) {
                    const imageS3Key = `reports/${reportId}/images/${filename}`;
                    const fileBuffer = readFileSync(localPath);
                    
                    await this.s3Client.send(new PutObjectCommand({
                      Bucket: this.bucketName,
                      Key: imageS3Key,
                      Body: fileBuffer,
                      ContentType: 'image/png',
                    }));

                    const imageUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${imageS3Key}`;
                    images.push({ 
                      imageId: filename, 
                      s3Key: imageS3Key, 
                      url: imageUrl,
                      originalPath: localPath
                    });
                    
                    console.log(`✅ Report direct image stored: ${imageS3Key}`);
                  }
                }
              }
            }
          }
        }
      }

      console.log(`✅ Report ${reportId} stored with ${slides.length} slides and ${images.length} images`);
      
      return {
        templateS3Key: reportS3Key,
        templateUrl: reportUrl,
        slides,
        images
      };

    } catch (error) {
      console.error('Failed to store report in S3:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) {
        throw new Error('S3 storage not available');
      }
    }

    try {
      // Delete all files under templates/{templateId}/
      const prefix = `templates/${templateId}/`;
      
      // Note: For production, implement proper batch delete using ListObjectsV2 and DeleteObjects
      // For now, we'll delete the main template file
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: `${prefix}template.json`,
      }));

      console.log(`✅ Template ${templateId} deleted from S3`);
      return true;
    } catch (error) {
      console.error('Failed to delete template from S3:', error);
      return false;
    }
  }

  async deleteReport(reportId: string): Promise<boolean> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) {
        throw new Error('S3 storage not available');
      }
    }

    try {
      // Delete all files under reports/{reportId}/
      const prefix = `reports/${reportId}/`;
      
      // Note: For production, implement proper batch delete using ListObjectsV2 and DeleteObjects
      // For now, we'll delete the main report file
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: `${prefix}report.json`,
      }));

      console.log(`✅ Report ${reportId} deleted from S3`);
      return true;
    } catch (error) {
      console.error('Failed to delete report from S3:', error);
      return false;
    }
  }

  async getSignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
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
}

export const templateS3Storage = new TemplateS3StorageService();