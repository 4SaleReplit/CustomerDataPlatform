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

  // Delete template
  async deleteTemplate(id: string): Promise<void> {
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

  // Execute scheduled report (refresh data and generate PDF)
  async executeScheduledReport(scheduledReportId: string): Promise<{ pdfUrl: string; s3Key: string }> {
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

    // Create execution record
    const [execution] = await db
      .insert(reportExecutions)
      .values({
        scheduledReportId,
        status: 'running',
      })
      .returning();

    try {
      // Here we would:
      // 1. Refresh all queries in the template slides
      // 2. Generate PDF from refreshed data
      // 3. Upload to S3
      // 4. Return public URL

      // For now, return placeholder - this will be implemented with actual PDF generation
      const pdfUrl = `https://s3.amazonaws.com/4sale-cdp-assets/reports/scheduled/${scheduledReportId}/${Date.now()}.pdf`;
      const s3Key = `reports/scheduled/${scheduledReportId}/${Date.now()}.pdf`;

      // Update execution as completed
      await db
        .update(reportExecutions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          generatedPdfUrl: pdfUrl,
          generatedS3Key: s3Key,
        })
        .where(eq(reportExecutions.id, execution.id));

      // Update scheduled report with latest execution info
      await db
        .update(scheduledReports)
        .set({
          lastRunAt: new Date(),
          lastGeneratedPdfUrl: pdfUrl,
          lastGeneratedS3Key: s3Key,
        })
        .where(eq(scheduledReports.id, scheduledReportId));

      return { pdfUrl, s3Key };
    } catch (error) {
      // Update execution as failed
      await db
        .update(reportExecutions)
        .set({
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(reportExecutions.id, execution.id));

      throw error;
    }
  }
}

export const templateService = new TemplateService();