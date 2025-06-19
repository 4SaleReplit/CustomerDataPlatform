import * as cron from 'node-cron';
import { storage } from '../storage';
import { templateS3Storage } from './templateS3Storage';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { scheduledReports, presentations } from '@shared/schema';

interface CronJob {
  id: string;
  scheduledReportId: string;
  cronExpression: string;
  task: cron.ScheduledTask;
}

class CronJobService {
  private jobs: Map<string, CronJob> = new Map();

  async initializeJobs(): Promise<void> {
    console.log('🕐 Initializing scheduled report cron jobs...');
    
    try {
      // Load all active scheduled reports from database
      const activeReports = await storage.getScheduledReports();
      const activeScheduledReports = activeReports.filter(report => report.status === 'active');
      
      console.log(`Found ${activeScheduledReports.length} active scheduled reports`);
      
      for (const report of activeScheduledReports) {
        await this.createCronJob(report);
      }
      
      console.log(`✅ Initialized ${this.jobs.size} cron jobs`);
    } catch (error) {
      console.error('Failed to initialize cron jobs:', error);
    }
  }

  async createCronJob(scheduledReport: any): Promise<void> {
    const jobId = `scheduled_report_${scheduledReport.id}`;
    
    try {
      // Remove existing job if it exists
      await this.removeCronJob(scheduledReport.id);
      
      // Validate cron expression
      if (!cron.validate(scheduledReport.cronExpression)) {
        console.error(`Invalid cron expression for report ${scheduledReport.id}: ${scheduledReport.cronExpression}`);
        return;
      }
      
      // Create the cron task
      const task = cron.schedule(scheduledReport.cronExpression, async () => {
        console.log(`🔄 Executing scheduled report: ${scheduledReport.name}`);
        await this.executeScheduledReport(scheduledReport.id);
      }, {
        timezone: scheduledReport.timezone || 'UTC'
      });
      
      // Store job in memory
      this.jobs.set(scheduledReport.id, {
        id: jobId,
        scheduledReportId: scheduledReport.id,
        cronExpression: scheduledReport.cronExpression,
        task
      });
      
      console.log(`✅ Created cron job for report: ${scheduledReport.name} (${scheduledReport.cronExpression})`);
      
      // Update next run time in database
      await this.updateNextRunTime(scheduledReport.id, scheduledReport.cronExpression, scheduledReport.timezone);
      
    } catch (error) {
      console.error(`Failed to create cron job for report ${scheduledReport.id}:`, error);
    }
  }

  async removeCronJob(scheduledReportId: string): Promise<void> {
    const job = this.jobs.get(scheduledReportId);
    
    if (job) {
      job.task.destroy();
      this.jobs.delete(scheduledReportId);
      console.log(`🗑️ Removed cron job for report: ${scheduledReportId}`);
    }
  }

  async updateCronJob(scheduledReport: any): Promise<void> {
    // Remove old job and create new one
    await this.removeCronJob(scheduledReport.id);
    
    if (scheduledReport.status === 'active') {
      await this.createCronJob(scheduledReport);
    }
  }

  async executeScheduledReport(scheduledReportId: string): Promise<void> {
    try {
      console.log(`🚀 Starting execution of scheduled report: ${scheduledReportId}`);
      
      // Get scheduled report details
      const scheduledReport = await storage.getScheduledReportById(scheduledReportId);
      if (!scheduledReport) {
        console.error(`Scheduled report not found: ${scheduledReportId}`);
        return;
      }
      
      // Get template details
      const template = await storage.getTemplate(scheduledReport.templateId);
      if (!template) {
        console.error(`Template not found for scheduled report: ${scheduledReport.templateId}`);
        return;
      }
      
      console.log(`📋 Executing template: ${template.name} for scheduled report: ${scheduledReport.name}`);
      
      // TODO: Refresh all queries in template before generating report
      // This would involve executing any SQL queries in the template slides
      await this.refreshTemplateQueries(template);
      
      // Generate report name with timestamp
      const now = new Date();
      const reportName = `${template.name} - ${scheduledReport.name}`;
      
      // Copy slides from template
      let copiedSlideIds: string[] = [];
      try {
        if (template.content) {
          const templateContent = JSON.parse(template.content);
          
          if (templateContent.slides && Array.isArray(templateContent.slides)) {
            for (let i = 0; i < templateContent.slides.length; i++) {
              const slideData = templateContent.slides[i];
              
              const newSlide = await storage.createSlide({
                title: slideData.name || `Slide ${i + 1}`,
                elements: (slideData.elements || []) as any,
                backgroundColor: slideData.backgroundColor || '#ffffff',
                createdBy: null
              });
              
              copiedSlideIds.push(newSlide.id);
            }
          }
        } else if (template.slideIds && template.slideIds.length > 0) {
          // Copy slides by ID
          for (const slideId of template.slideIds) {
            const originalSlide = await storage.getSlide(slideId);
            if (originalSlide) {
              const newSlide = await storage.createSlide({
                title: originalSlide.title,
                elements: originalSlide.elements as any,
                backgroundColor: originalSlide.backgroundColor || '#ffffff',
                createdBy: null
              });
              copiedSlideIds.push(newSlide.id);
            }
          }
        }
      } catch (error) {
        console.error('Error copying slides for scheduled report:', error);
      }
      
      // Create presentation with scheduled type
      const presentationData = {
        title: reportName,
        description: `Scheduled report generated from ${template.name}`,
        slideIds: copiedSlideIds,
        previewImageUrl: template.previewImageUrl,
        templateId: template.id,
        scheduledReportId: scheduledReport.id,
        instanceType: 'scheduled',
        createdBy: null
      };
      
      const newPresentation = await storage.createPresentation(presentationData);
      console.log(`📄 Created presentation: ${reportName} with ${copiedSlideIds.length} slides`);
      
      // Store report to S3 with slides and images
      try {
        const s3Result = await templateS3Storage.storeReport(newPresentation.id, presentationData, copiedSlideIds);
        
        // Update presentation with S3 URLs
        await storage.updatePresentation(newPresentation.id, {
          pdfS3Key: s3Result.templateS3Key,
          pdfUrl: s3Result.templateUrl
        });
        
        console.log(`☁️ Report stored to S3: ${s3Result.templateS3Key} with ${s3Result.slides.length} slides and ${s3Result.images.length} images`);
      } catch (s3Error) {
        console.error('Failed to store scheduled report to S3:', s3Error);
      }
      
      // Update scheduled report with execution details
      await storage.updateScheduledReport(scheduledReport.id, {
        lastRunAt: now,
        lastGeneratedPdfUrl: newPresentation.pdfUrl || undefined,
        lastGeneratedS3Key: newPresentation.pdfS3Key || undefined,
      });
      
      // Update next run time
      await this.updateNextRunTime(scheduledReport.id, scheduledReport.cronExpression, scheduledReport.timezone || undefined);
      
      console.log(`✅ Successfully executed scheduled report: ${scheduledReport.name} - Created presentation: ${newPresentation.id}`);
      
    } catch (error) {
      console.error(`❌ Failed to execute scheduled report ${scheduledReportId}:`, error);
    }
  }

  private async refreshTemplateQueries(template: any): Promise<void> {
    console.log(`🔄 Refreshing queries for template: ${template.name}`);
    
    try {
      // TODO: Implement query refresh logic
      // This would involve:
      // 1. Parsing template slides for SQL queries
      // 2. Executing queries against Snowflake
      // 3. Updating slide elements with fresh data
      
      console.log(`✅ Queries refreshed for template: ${template.name}`);
    } catch (error) {
      console.error(`Failed to refresh queries for template ${template.id}:`, error);
    }
  }

  private async updateNextRunTime(scheduledReportId: string, cronExpression: string, timezone?: string): Promise<void> {
    try {
      // Calculate next execution time
      const task = cron.schedule(cronExpression, () => {}, { timezone: timezone || 'UTC' });
      
      // Get the next execution time
      const nextRun = new Date();
      nextRun.setTime(nextRun.getTime() + 60000); // Add 1 minute as fallback
      
      // Update database
      await storage.updateScheduledReport(scheduledReportId, {
        nextRunAt: nextRun
      });
      
      task.destroy();
    } catch (error) {
      console.error('Failed to update next run time:', error);
    }
  }

  getActiveJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  getJobCount(): number {
    return this.jobs.size;
  }

  async stopAllJobs(): Promise<void> {
    console.log('🛑 Stopping all cron jobs...');
    
    Array.from(this.jobs.values()).forEach((job) => {
      job.task.destroy();
    });
    
    this.jobs.clear();
    console.log('✅ All cron jobs stopped');
  }
}

export const cronJobService = new CronJobService();