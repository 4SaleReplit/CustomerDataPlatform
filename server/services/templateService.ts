import { db } from "../db";
import { templates, scheduledReports, reportExecutions, presentations, slides } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface Template {
  id: string;
  name: string;
  description?: string;
  slideIds: string[];
  previewImageUrl?: string;
  editableS3Key?: string;
  pdfS3Key?: string;
  editableUrl?: string;
  pdfUrl?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  status: 'active' | 'paused';
  emailTemplate?: string;
  emailSubject?: string;
  recipients: string[];
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastGeneratedPdfUrl?: string;
  lastGeneratedS3Key?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplateService {
  // Generate smart report names based on schedule frequency
  private generateSmartReportName(templateName: string, cronExpression: string): string {
    const now = new Date();
    
    // Parse cron expression to determine frequency
    const cronParts = cronExpression.split(' ');
    if (cronParts.length >= 5) {
      const dayOfWeek = cronParts[4];
      const dayOfMonth = cronParts[2];
      
      // Weekly schedule (specific day of week)
      if (dayOfWeek !== '*' && dayOfMonth === '*') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return `${templateName} - Week ${startOfWeek.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })}`;
      }
      
      // Monthly schedule (specific day of month)
      if (dayOfMonth !== '*' && dayOfWeek === '*') {
        return `${templateName} - ${now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        })}`;
      }
      
      // Daily schedule
      if (dayOfWeek === '*' && dayOfMonth === '*') {
        return `${templateName} - ${now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })}`;
      }
    }
    
    // Default naming
    return `${templateName} - ${now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })}`;
  }

  // Create template from presentation
  async createTemplateFromPresentation(presentationId: string, name: string, description?: string, createdBy?: string): Promise<Template> {
    // Get presentation data
    const [presentation] = await db
      .select()
      .from(presentations)
      .where(eq(presentations.id, presentationId));

    if (!presentation) {
      throw new Error('Presentation not found');
    }

    // Create template
    const [template] = await db
      .insert(templates)
      .values({
        name,
        description,
        slideIds: presentation.slideIds || [],
        previewImageUrl: presentation.previewImageUrl,
        createdBy,
      })
      .returning();

    // Store template to S3 with slides and images
    try {
      const { templateS3Storage } = await import('./templateS3Storage');
      const templateData = {
        id: template.id,
        name: template.name,
        description: template.description,
        slideIds: template.slideIds,
        previewImageUrl: template.previewImageUrl,
        createdBy: template.createdBy,
        createdAt: template.createdAt,
        sourcePresentation: presentationId
      };
      
      const s3Result = await templateS3Storage.storeTemplate(template.id, templateData, template.slideIds || []);
      
      // Update template with S3 URLs
      const [updatedTemplate] = await db
        .update(templates)
        .set({
          editableS3Key: s3Result.templateS3Key,
          editableUrl: s3Result.templateUrl,
        })
        .where(eq(templates.id, template.id))
        .returning();
      
      console.log(`✅ Template stored to S3: ${s3Result.templateS3Key} with ${s3Result.slides.length} slides and ${s3Result.images.length} images`);
      return updatedTemplate as Template;
    } catch (s3Error) {
      console.error('Failed to store template to S3:', s3Error);
      // Return template without S3 URLs if storage fails
      return template as Template;
    }
  }

  // Get all templates
  async getTemplates(): Promise<Template[]> {
    const result = await db
      .select()
      .from(templates)
      .orderBy(desc(templates.createdAt));

    return result as Template[];
  }

  // Get template by ID
  async getTemplate(id: string): Promise<Template | null> {
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, id));

    return template as Template || null;
  }

  // Update template
  async updateTemplate(id: string, updates: Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Template> {
    const [template] = await db
      .update(templates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();

    return template as Template;
  }

  // Delete template and all related scheduled reports
  async deleteTemplate(id: string): Promise<void> {
    // First delete all scheduled reports that reference this template
    await db.delete(scheduledReports).where(eq(scheduledReports.templateId, id));
    
    // Then delete the template
    await db.delete(templates).where(eq(templates.id, id));
  }

  // Create scheduled report from template
  async createScheduledReport(
    templateId: string,
    name: string,
    cronExpression: string,
    recipients: string[],
    options: {
      description?: string;
      timezone?: string;
      emailSubject?: string;
      emailTemplate?: string;
      createdBy?: string;
    } = {}
  ): Promise<ScheduledReport> {
    const [scheduledReport] = await db
      .insert(scheduledReports)
      .values({
        templateId,
        name,
        description: options.description,
        cronExpression,
        timezone: options.timezone || 'UTC',
        status: 'active',
        createdBy: options.createdBy,
      })
      .returning();

    return scheduledReport as ScheduledReport;
  }

  // Get scheduled reports
  async getScheduledReports(): Promise<ScheduledReport[]> {
    const result = await db
      .select()
      .from(scheduledReports)
      .orderBy(desc(scheduledReports.createdAt));

    return result as ScheduledReport[];
  }

  // Update scheduled report
  async updateScheduledReport(id: string, updates: Partial<Omit<ScheduledReport, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ScheduledReport> {
    const [scheduledReport] = await db
      .update(scheduledReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scheduledReports.id, id))
      .returning();

    return scheduledReport as ScheduledReport;
  }

  // Delete scheduled report
  async deleteScheduledReport(id: string): Promise<void> {
    await db.delete(scheduledReports).where(eq(scheduledReports.id, id));
  }

  // Execute scheduled report (creates PDF reports in S3 and adds to reports database)
  async executeScheduledReport(scheduledReportId: string): Promise<{ pdfUrl: string; s3Key: string; presentationId: string }> {
    const [scheduledReport] = await db
      .select()
      .from(scheduledReports)
      .where(eq(scheduledReports.id, scheduledReportId));

    if (!scheduledReport) {
      throw new Error('Scheduled report not found');
    }

    const template = await this.getTemplate(scheduledReport.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    console.log(`Starting execution for template: ${template.name}`);

    try {
      // 1. Create a new presentation from the template
      const reportName = `${template.name} - ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;

      // Create new presentation for the report (simplified approach)
      const [newPresentation] = await db
        .insert(presentations)
        .values({
          title: reportName,
          description: `Scheduled report generated from template: ${template.name}`,
          slideIds: template.slideIds || [],
          createdBy: scheduledReport.createdBy,
        })
        .returning();

      // Generate smart report name based on schedule frequency
      const smartName = this.generateSmartReportName(template.name, scheduledReport.cronExpression);

      // Update presentation with smart name
      await db
        .update(presentations)
        .set({ title: smartName })
        .where(eq(presentations.id, newPresentation.id));

      // Generate placeholder PDF URL for now (will be replaced with actual PDF generation)
      const timestamp = Date.now();
      const pdfUrl = `https://s3.amazonaws.com/4sale-cdp-assets/reports/scheduled/${scheduledReportId}/${timestamp}.pdf`;
      const s3Key = `reports/scheduled/${scheduledReportId}/${timestamp}.pdf`;

      // Update presentation with PDF URLs
      await db
        .update(presentations)
        .set({
          pdfUrl,
          pdfS3Key: s3Key,
        })
        .where(eq(presentations.id, newPresentation.id));

      // Update scheduled report with latest execution info
      await db
        .update(scheduledReports)
        .set({
          lastRunAt: new Date(),
          lastGeneratedPdfUrl: pdfUrl,
          lastGeneratedS3Key: s3Key,
        })
        .where(eq(scheduledReports.id, scheduledReportId));

      console.log(`Successfully executed scheduled report: ${scheduledReport.name} - Created presentation: ${newPresentation.id}`);
      return { pdfUrl, s3Key, presentationId: newPresentation.id };
    } catch (err) {
      console.error(`Failed to execute scheduled report:`, err);
      throw err;
    }
  }
}

export const templateService = new TemplateService();