import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertIntegrationSchema, type InsertIntegration } from "@shared/schema";
import * as BrazeModule from "./services/braze";
import { s3Storage } from "./services/s3Storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { 
  insertTeamSchema, insertDashboardTileInstanceSchema, insertCohortSchema, insertSegmentSchema,
  insertRoleSchema, updateRoleSchema, insertPermissionSchema, insertRolePermissionSchema,
  insertUploadedImageSchema, insertSlideSchema, updateSlideSchema, insertPresentationSchema,
  environmentConfigurations, insertEnvironmentConfigurationSchema,
  scheduledReports, mailingLists, reportExecutions
} from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import cron from "node-cron";

const activeCronJobs = new Map<string, any>();

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Scheduled Reports API Endpoints
  app.get("/api/scheduled-reports", async (req: Request, res: Response) => {
    try {
      const scheduledReports = await storage.getScheduledReports();
      res.json(scheduledReports);
    } catch (error) {
      console.error("Error fetching scheduled reports:", error);
      res.status(500).json({ error: "Failed to fetch scheduled reports" });
    }
  });

  app.get("/api/scheduled-reports/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const scheduledReport = await storage.getScheduledReportById(id);
      if (!scheduledReport) {
        return res.status(404).json({ error: "Scheduled report not found" });
      }
      res.json(scheduledReport);
    } catch (error) {
      console.error("Error fetching scheduled report:", error);
      res.status(500).json({ error: "Failed to fetch scheduled report" });
    }
  });

  app.post("/api/scheduled-reports", async (req: Request, res: Response) => {
    try {
      const reportData = req.body;
      
      // Calculate next execution based on cron expression and timezone
      const nextExecution = calculateNextExecution(reportData.cronExpression, reportData.timezone);
      
      // Auto-generate PDF delivery URL based on report ID and domain
      const baseUrl = process.env.REPLIT_DEV_DOMAIN ? 
        `https://${process.env.REPLIT_DEV_DOMAIN}` : 
        `${req.protocol}://${req.get('host')}`;
      const pdfDeliveryUrl = `${baseUrl}/api/reports/pdf/${reportData.presentationId}`;
      
      const scheduledReport = await storage.createScheduledReport({
        ...reportData,
        pdfDeliveryUrl,
        nextExecution,
        executionCount: 0,
        errorCount: 0,
        successCount: 0,
        lastExecutionAt: null,
        lastError: null,
        createdBy: (req as any).session?.user?.id || 'system'
      });
      
      // Schedule the actual cron job
      if (scheduledReport.isActive && scheduledReport.cronExpression) {
        scheduleReportJob(scheduledReport);
      }
      
      res.status(201).json(scheduledReport);
    } catch (error) {
      console.error("Error creating scheduled report:", error);
      res.status(500).json({ error: "Failed to create scheduled report" });
    }
  });

  app.patch("/api/scheduled-reports/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (updateData.cronExpression && updateData.timezone) {
        updateData.nextExecution = calculateNextExecution(updateData.cronExpression, updateData.timezone);
      }
      
      const updatedReport = await storage.updateScheduledReport(id, updateData);
      
      if (updatedReport) {
        // Reschedule cron job if necessary
        if (activeCronJobs.has(id)) {
          activeCronJobs.get(id).destroy();
          activeCronJobs.delete(id);
        }
        
        if (updatedReport.isActive && updatedReport.cronExpression) {
          scheduleReportJob(updatedReport);
        }
        
        res.json(updatedReport);
      } else {
        res.status(404).json({ error: "Scheduled report not found" });
      }
    } catch (error) {
      console.error("Error updating scheduled report:", error);
      res.status(500).json({ error: "Failed to update scheduled report" });
    }
  });

  app.delete("/api/scheduled-reports/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Cancel cron job
      if (activeCronJobs.has(id)) {
        activeCronJobs.get(id).destroy();
        activeCronJobs.delete(id);
      }
      
      await storage.deleteScheduledReport(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting scheduled report:", error);
      res.status(500).json({ error: "Failed to delete scheduled report" });
    }
  });

  app.post("/api/scheduled-reports/:id/execute", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const scheduledReport = await storage.getScheduledReportById(id);
      
      if (!scheduledReport) {
        return res.status(404).json({ error: "Scheduled report not found" });
      }
      
      const execution = await executeScheduledReport(scheduledReport);
      res.json(execution);
    } catch (error) {
      console.error("Error executing scheduled report:", error);
      res.status(500).json({ error: "Failed to execute scheduled report" });
    }
  });

  // Mailing Lists API Endpoints
  app.get("/api/mailing-lists", async (req: Request, res: Response) => {
    try {
      const mailingLists = await storage.getMailingLists();
      res.json(mailingLists);
    } catch (error) {
      console.error("Error fetching mailing lists:", error);
      res.status(500).json({ error: "Failed to fetch mailing lists" });
    }
  });

  app.post("/api/mailing-lists", async (req: Request, res: Response) => {
    try {
      const mailingListData = req.body;
      const mailingList = await storage.createMailingList(mailingListData);
      res.status(201).json(mailingList);
    } catch (error) {
      console.error("Error creating mailing list:", error);
      res.status(500).json({ error: "Failed to create mailing list" });
    }
  });

  app.patch("/api/mailing-lists/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedMailingList = await storage.updateMailingList(id, updateData);
      res.json(updatedMailingList);
    } catch (error) {
      console.error("Error updating mailing list:", error);
      res.status(500).json({ error: "Failed to update mailing list" });
    }
  });

  app.delete("/api/mailing-lists/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteMailingList(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting mailing list:", error);
      res.status(500).json({ error: "Failed to delete mailing list" });
    }
  });

  // Report Executions API
  app.get("/api/scheduled-reports/:id/executions", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const executions = await storage.getReportExecutions(id);
      res.json(executions);
    } catch (error) {
      console.error("Error fetching report executions:", error);
      res.status(500).json({ error: "Failed to fetch report executions" });
    }
  });

  // Presentations API endpoint for Reports Scheduler dropdown
  app.get("/api/presentations", async (req: Request, res: Response) => {
    try {
      const presentations = await storage.getPresentations();
      res.json(presentations);
    } catch (error) {
      console.error("Error fetching presentations:", error);
      res.status(500).json({ error: "Failed to fetch presentations" });
    }
  });

  // PDF Report Generation Endpoint
  app.get("/api/reports/pdf/:presentationId", async (req: Request, res: Response) => {
    try {
      const { presentationId } = req.params;
      const presentation = await storage.getPresentationById(presentationId);
      
      if (!presentation) {
        return res.status(404).json({ error: "Presentation not found" });
      }
      
      // Generate PDF from presentation data
      const pdfBuffer = await generateReportFile(presentation, { format: 'pdf', includeCharts: true });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${presentation.title}.pdf"`);
      res.send(pdfBuffer.content);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ error: "Failed to generate PDF report" });
    }
  });

  // SQL Execution endpoint for tile creation
  app.post("/api/sql/execute", async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Execute the Snowflake query using dynamic credentials
      const { getDynamicSnowflakeService } = await import('./services/snowflake');
      const dynamicService = await getDynamicSnowflakeService();
      
      if (!dynamicService) {
        return res.status(400).json({ 
          error: "Snowflake integration not configured",
          details: "Please configure a Snowflake integration in the Integrations page"
        });
      }

      const result = await dynamicService.executeQuery(query);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: result.error,
          query: query 
        });
      }

      res.json({
        columns: result.columns,
        rows: result.rows,
        success: true,
        query: query
      });
    } catch (error) {
      console.error("Query execution error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to execute query" 
      });
    }
  });

  // Dashboard APIs
  app.get("/api/dashboard/tiles", async (req: Request, res: Response) => {
    try {
      const tiles = await storage.getDashboardTiles();
      res.json(tiles);
    } catch (error) {
      console.error("Get dashboard tiles error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get dashboard tiles" 
      });
    }
  });

  app.post("/api/dashboard/layout", async (req: Request, res: Response) => {
    try {
      const { tiles } = req.body;
      console.log("Saving dashboard layout with tiles:", tiles.map((t: any) => ({ id: t.id, x: t.x, y: t.y, width: t.width, height: t.height })));
      
      // Convert tiles to the format expected by storage
      const tileInstances = tiles.map((tile: any) => ({
        tileId: tile.id || tile.tileId,
        dashboardId: tile.dashboardId || null,
        type: tile.type,
        title: tile.title,
        x: tile.x,
        y: tile.y,
        width: tile.width,
        height: tile.height,
        icon: tile.icon,
        dataSource: tile.dataSource,
        refreshConfig: tile.refreshConfig
      }));
      
      const savedTiles = await storage.saveDashboardLayout(tileInstances);
      console.log("Dashboard layout saved successfully");
      res.json({ success: true, tiles: savedTiles });
    } catch (error) {
      console.error("Save dashboard layout error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to save dashboard layout" 
      });
    }
  });

  // Dashboard tile data loading endpoint
  app.post("/api/dashboard/tiles/:tileId/data", async (req: Request, res: Response) => {
    try {
      const { tileId } = req.params;
      const tile = await storage.getDashboardTiles().then(tiles => 
        tiles.find(t => t.id === tileId)
      );
      
      if (!tile) {
        return res.status(404).json({ error: "Dashboard tile not found" });
      }

      const dataSource = tile.dataSource as Record<string, any>;
      if (!dataSource?.query) {
        return res.status(400).json({ error: "No query configured for this tile" });
      }

      // Execute the Snowflake query
      const { getDynamicSnowflakeService } = await import('./services/snowflake');
      const dynamicService = await getDynamicSnowflakeService();
      
      if (!dynamicService) {
        return res.status(400).json({ 
          error: "Snowflake integration not configured",
          details: "Please configure a Snowflake integration in the Integrations page"
        });
      }

      const result = await dynamicService.executeQuery(dataSource.query);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: result.error,
          query: dataSource.query 
        });
      }

      res.json({
        columns: result.columns,
        rows: result.rows,
        success: true,
        tileId: tileId,
        query: dataSource.query
      });
    } catch (error) {
      console.error("Dashboard tile data loading error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to load tile data" 
      });
    }
  });

  // Snowflake query execution endpoint
  app.post("/api/snowflake/query", async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Execute the Snowflake query using dynamic credentials
      const { getDynamicSnowflakeService } = await import('./services/snowflake');
      const dynamicService = await getDynamicSnowflakeService();
      
      if (!dynamicService) {
        return res.status(400).json({ 
          error: "Snowflake integration not configured",
          details: "Please configure a Snowflake integration in the Integrations page"
        });
      }

      const result = await dynamicService.executeQuery(query);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: result.error,
          query: query 
        });
      }

      res.json({
        columns: result.columns,
        rows: result.rows,
        success: true,
        query: query
      });
    } catch (error) {
      console.error("Snowflake query execution error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to execute query" 
      });
    }
  });

  // Airflow Test Connection
  app.post("/api/airflow/test-connection", async (req: Request, res: Response) => {
    try {
      const { airflowBaseUrl, airflowUsername, airflowPassword } = req.body;
      const isConnected = await testAirflowConnection(airflowBaseUrl, airflowUsername, airflowPassword);
      res.json({ connected: isConnected });
    } catch (error) {
      console.error("Error testing Airflow connection:", error);
      res.status(500).json({ error: "Failed to test Airflow connection" });
    }
  });

  // Helper Functions
  function scheduleReportJob(scheduledReport: any) {
    const jobId = scheduledReport.id;
    
    // Cancel existing job if it exists
    if (activeCronJobs.has(jobId)) {
      activeCronJobs.get(jobId).destroy();
    }
    
    try {
      const task = cron.schedule(scheduledReport.cronExpression, async () => {
        console.log(`Executing scheduled report: ${scheduledReport.name}`);
        try {
          await executeScheduledReport(scheduledReport);
          
          // Update execution metadata
          await storage.updateScheduledReport(jobId, {
            executionCount: (scheduledReport.executionCount || 0) + 1,
            successCount: (scheduledReport.successCount || 0) + 1,
            lastExecutionAt: new Date(),
            nextExecution: calculateNextExecution(scheduledReport.cronExpression, scheduledReport.timezone)
          });
        } catch (error) {
          console.error(`Error executing scheduled report ${scheduledReport.name}:`, error);
          
          // Update error metadata
          await storage.updateScheduledReport(jobId, {
            executionCount: (scheduledReport.executionCount || 0) + 1,
            errorCount: (scheduledReport.errorCount || 0) + 1,
            lastExecutionAt: new Date(),
            lastError: error instanceof Error ? error.message : 'Unknown error',
            nextExecution: calculateNextExecution(scheduledReport.cronExpression, scheduledReport.timezone)
          });
        }
      }, {
        timezone: scheduledReport.timezone || 'Africa/Cairo'
      });
      
      task.start();
      activeCronJobs.set(jobId, task);
      
      console.log(`Scheduled cron job for report: ${scheduledReport.name} with expression: ${scheduledReport.cronExpression}`);
    } catch (error) {
      console.error(`Error scheduling cron job for report ${scheduledReport.name}:`, error);
    }
  }

  function calculateNextExecution(cronExpression: string, timezone: string = 'Africa/Cairo'): Date {
    const cronParser = require('cron-parser');
    try {
      const interval = cronParser.parseExpression(cronExpression, { tz: timezone });
      return interval.next().toDate();
    } catch (error) {
      console.error('Error parsing cron expression:', error);
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to 24 hours from now
    }
  }

  async function executeScheduledReport(scheduledReport: any) {
    try {
      console.log(`Starting execution of scheduled report: ${scheduledReport.name}`);
      
      // Get the presentation/report
      const presentation = await storage.getPresentationById(scheduledReport.presentationId);
      if (!presentation) {
        throw new Error(`Presentation not found: ${scheduledReport.presentationId}`);
      }
      
      // Generate the report file (PDF/PowerPoint)
      const reportFile = await generateReportFile(presentation, scheduledReport.formatSettings || { format: 'pdf', includeCharts: true });
      
      // Process email template with placeholders
      const processedSubject = processEmailTemplate(scheduledReport.emailSubject, scheduledReport);
      const processedBody = processEmailTemplate(scheduledReport.emailBody, scheduledReport);
      
      // Prepare email data
      const emailData = {
        to: scheduledReport.recipientList || [],
        cc: scheduledReport.ccList || [],
        bcc: scheduledReport.bccList || [],
        subject: processedSubject,
        html: processedBody,
        attachments: reportFile ? [reportFile] : []
      };
      
      // Send email
      await sendReportEmail(emailData);
      
      console.log(`Successfully executed scheduled report: ${scheduledReport.name}`);
      
    } catch (error) {
      console.error(`Error in executeScheduledReport for ${scheduledReport.name}:`, error);
      throw error;
    }
  }

  function processEmailTemplate(template: string, scheduledReport: any): string {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const replacements = {
      '{date}': new Date().toISOString().split('T')[0],
      '{time}': new Date().toTimeString().split(' ')[0],
      '{report_name}': scheduledReport.name,
      '{execution_date}': new Date().toLocaleDateString(),
      '{execution_time}': new Date().toLocaleTimeString(),
      '{next_execution}': scheduledReport.nextExecution ? new Date(scheduledReport.nextExecution).toLocaleDateString() : 'TBD',
      '{week_start}': weekStart.toISOString().split('T')[0],
      '{week_end}': weekEnd.toISOString().split('T')[0],
      '{month_start}': monthStart.toISOString().split('T')[0],
      '{month_end}': monthEnd.toISOString().split('T')[0],
      '{year}': new Date().getFullYear().toString(),
      '{quarter}': `Q${Math.floor((new Date().getMonth() + 3) / 3)}`
    };

    let result = template;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return result;
  }

  async function generateReportFile(presentation: any, formatSettings: any) {
    // Implementation would generate actual PDF/PowerPoint from presentation data
    return {
      filename: `${presentation.title}_${new Date().toISOString().split('T')[0]}.pdf`,
      content: Buffer.from('Generated report content')
    };
  }

  async function sendReportEmail(emailData: any) {
    // Implementation would use SendGrid to send actual emails
    console.log('Sending scheduled report email:', emailData.subject, 'to:', emailData.to.length, 'recipients');
    return true;
  }

  async function testAirflowConnection(baseUrl: string, username: string, password: string): Promise<boolean> {
    try {
      // Mock implementation - replace with actual Airflow API test
      return true;
    } catch (error) {
      return false;
    }
  }

  return server;
}