import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { storage } from '../storage';

interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
}

interface TemplateData {
  id: string;
  name: string;
  description?: string;
  slides: any[];
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export class TemplateS3Service {
  private s3Client: S3Client | null = null;
  private bucketName: string = '';

  async initialize(): Promise<boolean> {
    try {
      // Get S3 integration from database
      const integrations = await storage.getIntegrationsByType('s3');
      const s3Integration = integrations.find(int => int.active);
      
      if (!s3Integration?.credentials) {
        console.log('No active S3 integration found for template storage');
        return false;
      }

      const creds = typeof s3Integration.credentials === 'string' 
        ? JSON.parse(s3Integration.credentials) 
        : s3Integration.credentials;

      this.s3Client = new S3Client({
        region: creds.region,
        credentials: {
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
        },
      });

      this.bucketName = creds.bucketName;
      
      // Ensure templates folder exists
      await this.ensureTemplatesFolder();
      
      console.log(`✅ TemplateS3Service initialized with bucket: ${this.bucketName}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize TemplateS3Service:', error);
      return false;
    }
  }

  private async ensureTemplatesFolder(): Promise<void> {
    if (!this.s3Client) return;

    try {
      // Create a placeholder file to ensure the templates/ folder exists
      const placeholderKey = 'templates/.gitkeep';
      
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: placeholderKey,
        Body: 'Templates folder placeholder',
        ContentType: 'text/plain'
      }));
      
      console.log('✅ Templates folder ensured in S3');
    } catch (error) {
      console.error('Error ensuring templates folder:', error);
    }
  }

  async saveTemplate(templateData: TemplateData): Promise<string | null> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) return null;
    }

    try {
      // Create S3 key using template name for easier discoverability
      const sanitizedName = this.sanitizeFileName(templateData.name);
      const s3Key = `templates/${sanitizedName}-${templateData.id}.json`;

      // Prepare template data for S3 storage
      const s3TemplateData = {
        ...templateData,
        s3Key,
        syncedAt: new Date().toISOString()
      };

      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: JSON.stringify(s3TemplateData, null, 2),
        ContentType: 'application/json',
        Metadata: {
          templateId: templateData.id,
          templateName: templateData.name,
          lastUpdated: templateData.updatedAt
        }
      }));

      console.log(`✅ Template saved to S3: ${s3Key}`);
      return s3Key;
    } catch (error) {
      console.error('Error saving template to S3:', error);
      return null;
    }
  }

  async updateTemplate(templateData: TemplateData, existingS3Key?: string): Promise<string | null> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) return null;
    }

    try {
      // If template name changed, we need a new S3 key
      const sanitizedName = this.sanitizeFileName(templateData.name);
      const newS3Key = `templates/${sanitizedName}-${templateData.id}.json`;

      // If we have an existing key and it's different, delete the old one
      if (existingS3Key && existingS3Key !== newS3Key) {
        await this.deleteTemplate(existingS3Key);
      }

      // Save with new/updated key
      return await this.saveTemplate(templateData);
    } catch (error) {
      console.error('Error updating template in S3:', error);
      return null;
    }
  }

  async cloneTemplate(originalTemplateData: TemplateData, newTemplateId: string, newTemplateName: string): Promise<string | null> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) return null;
    }

    try {
      // Create new template data for the clone
      const clonedTemplateData: TemplateData = {
        ...originalTemplateData,
        id: newTemplateId,
        name: newTemplateName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save the cloned template with new S3 key
      const s3Key = await this.saveTemplate(clonedTemplateData);
      
      if (s3Key) {
        console.log(`✅ Template cloned in S3: ${s3Key}`);
      }
      
      return s3Key;
    } catch (error) {
      console.error('Error cloning template in S3:', error);
      return null;
    }
  }

  async deleteTemplate(s3Key: string): Promise<boolean> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) return false;
    }

    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      }));

      console.log(`✅ Template deleted from S3: ${s3Key}`);
      return true;
    } catch (error) {
      console.error('Error deleting template from S3:', error);
      return false;
    }
  }

  async getTemplate(s3Key: string): Promise<TemplateData | null> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) return null;
    }

    try {
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      }));

      if (response.Body) {
        const bodyString = await response.Body.transformToString();
        return JSON.parse(bodyString);
      }

      return null;
    } catch (error) {
      console.error('Error getting template from S3:', error);
      return null;
    }
  }

  async listTemplates(): Promise<{ key: string, name: string, lastModified: Date, size: number }[]> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) return [];
    }

    try {
      const response = await this.s3Client.send(new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: 'templates/',
        MaxKeys: 1000
      }));

      return (response.Contents || [])
        .filter(obj => obj.Key && obj.Key.endsWith('.json'))
        .map(obj => ({
          key: obj.Key!,
          name: this.extractTemplateNameFromKey(obj.Key!),
          lastModified: obj.LastModified || new Date(),
          size: obj.Size || 0
        }));
    } catch (error) {
      console.error('Error listing templates from S3:', error);
      return [];
    }
  }

  async syncAllTemplatesToS3(): Promise<{ synced: number, errors: number }> {
    if (!this.s3Client) {
      await this.initialize();
      if (!this.s3Client) return { synced: 0, errors: 0 };
    }

    try {
      console.log('🔄 Starting bulk template sync to S3...');
      
      // Get all templates from database
      const templates = await storage.getTemplates();
      let synced = 0;
      let errors = 0;

      for (const template of templates) {
        try {
          const templateData: TemplateData = {
            id: template.id,
            name: template.name,
            description: template.description || undefined,
            slides: template.slideIds || [],
            metadata: {},
            createdAt: template.createdAt ? template.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: template.updatedAt ? template.updatedAt.toISOString() : new Date().toISOString()
          };

          const s3Key = await this.saveTemplate(templateData);
          
          if (s3Key) {
            // Update database with S3 key using the update method
            await storage.updateTemplate(template.id, { 
              s3Key, 
              lastSyncedAt: new Date()
            } as any);
            synced++;
          } else {
            errors++;
          }
        } catch (error) {
          console.error(`Error syncing template ${template.id}:`, error);
          errors++;
        }
      }

      console.log(`✅ Template sync completed: ${synced} synced, ${errors} errors`);
      return { synced, errors };
    } catch (error) {
      console.error('Error in bulk template sync:', error);
      return { synced: 0, errors: 1 };
    }
  }

  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase()
      .substring(0, 50); // Limit length
  }

  private extractTemplateNameFromKey(s3Key: string): string {
    const fileName = s3Key.split('/').pop() || '';
    const nameWithoutExt = fileName.replace('.json', '');
    const lastDashIndex = nameWithoutExt.lastIndexOf('-');
    
    if (lastDashIndex > 0) {
      return nameWithoutExt.substring(0, lastDashIndex)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return nameWithoutExt;
  }

  async getStatus(): Promise<{ initialized: boolean, bucketName: string, templatesCount: number }> {
    const isInitialized = this.s3Client !== null;
    let templatesCount = 0;

    if (isInitialized) {
      const templates = await this.listTemplates();
      templatesCount = templates.length;
    }

    return {
      initialized: isInitialized,
      bucketName: this.bucketName,
      templatesCount
    };
  }
}

// Export singleton instance
export const templateS3Service = new TemplateS3Service();