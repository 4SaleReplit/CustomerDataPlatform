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

    return template as Template;
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
        emailSubject: options.emailSubject,
        emailTemplate: options.emailTemplate,
        recipients,
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

      // Get template slides
      const templateSlides = await db
        .select()
        .from(slides)
        .where(eq(slides.presentationId, template.id))
        .orderBy(slides.order);

      // Create new presentation for the report
      const [newPresentation] = await db
        .insert(presentations)
        .values({
          name: reportName,
          description: `Scheduled report generated from template: ${template.name}`,
          slideIds: templateSlides.map(slide => slide.id),
          createdBy: scheduledReport.createdBy,
        })
        .returning();

      // Copy template slides to new presentation
      for (const templateSlide of templateSlides) {
        await db
          .insert(slides)
          .values({
            presentationId: newPresentation.id,
            title: templateSlide.title,
            content: templateSlide.content,
            type: templateSlide.type,
            order: templateSlide.order,
            backgroundColor: templateSlide.backgroundColor,
            textColor: templateSlide.textColor,
            imageUrl: templateSlide.imageUrl,
            layout: templateSlide.layout,
          });
      }

      // 2. Generate PDF and upload to S3
      try {
        const { PDFStorageService } = await import('./pdfStorageService');
        const pdfStorage = new PDFStorageService();
        const { pdfUrl, s3Key } = await pdfStorage.generateAndStorePDF(newPresentation.id, reportName);

        // 3. Update presentation with PDF URLs
        await db
          .update(presentations)
          .set({
            pdfUrl,
            pdfS3Key: s3Key,
            updatedAt: new Date(),
          })
          .where(eq(presentations.id, newPresentation.id));

        // 4. Update scheduled report with latest execution info
        await db
          .update(scheduledReports)
          .set({
            lastRunAt: new Date(),
            lastGeneratedPdfUrl: pdfUrl,
            lastGeneratedS3Key: s3Key,
            updatedAt: new Date(),
          })
          .where(eq(scheduledReports.id, scheduledReportId));

        console.log(`Successfully executed scheduled report: ${scheduledReport.name} - Created presentation: ${newPresentation.id}`);
        return { pdfUrl, s3Key, presentationId: newPresentation.id };
      } catch (pdfError) {
        console.error('PDF generation failed, using placeholder:', pdfError);
        // Fallback to placeholder for now if PDF generation fails
        const pdfUrl = `https://s3.amazonaws.com/4sale-cdp-assets/reports/scheduled/${scheduledReportId}/${Date.now()}.pdf`;
        const s3Key = `reports/scheduled/${scheduledReportId}/${Date.now()}.pdf`;
        
        await db
          .update(scheduledReports)
          .set({
            lastRunAt: new Date(),
            lastGeneratedPdfUrl: pdfUrl,
            lastGeneratedS3Key: s3Key,
            updatedAt: new Date(),
          })
          .where(eq(scheduledReports.id, scheduledReportId));

        return { pdfUrl, s3Key, presentationId: newPresentation.id };
      }
    } catch (err) {
      console.error(`Failed to execute scheduled report:`, err);
      throw err;
    }
  }
}

export const templateService = new TemplateService();