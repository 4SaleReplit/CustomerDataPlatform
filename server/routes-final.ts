import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertIntegrationSchema, type InsertIntegration } from "@shared/schema";
import bcrypt from "bcrypt";
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
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import * as cron from "node-cron";

const activeCronJobs = new Map<string, any>();

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Health check endpoint
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Check if it's a team member login
      const teamMember = await storage.getTeamMemberByEmail(username);
      if (teamMember) {
        const isValid = await bcrypt.compare(password, teamMember.passwordHash);
        if (isValid) {
          return res.json({
            id: teamMember.id,
            username: teamMember.email,
            email: teamMember.email,
            role: teamMember.role,
            firstName: teamMember.firstName,
            lastName: teamMember.lastName,
            tempPassword: teamMember.temporaryPassword,
            mustChangePassword: teamMember.mustChangePassword
          });
        }
      }

      // Check regular users table
      const user = await storage.getUserByUsername(username);
      if (user && user.password === password) {
        return res.json({
          id: user.id.toString(),
          username: user.username,
          email: user.username + '@company.com',
          role: user.username === 'admin' ? 'administrator' : 'user'
        });
      }

      res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Password generation utility
  function generateSecurePassword(length: number = 12): string {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Team management endpoints
  app.post("/api/team", async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, role } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      // Generate secure password
      const plainPassword = generateSecurePassword(12);
      const passwordHash = await bcrypt.hash(plainPassword, 10);

      const teamMemberData = {
        firstName,
        lastName,
        email,
        role: role || 'analyst',
        passwordHash,
        temporaryPassword: plainPassword,
        mustChangePassword: true
      };

      const teamMember = await storage.createTeamMember(teamMemberData);
      
      // Return the team member with the generated password
      res.status(201).json({
        ...teamMember,
        generatedPassword: plainPassword
      });
    } catch (error) {
      console.error("Create team member error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create team member" 
      });
    }
  });

  app.get("/api/team", async (req: Request, res: Response) => {
    try {
      const team = await storage.getTeamMembers();
      res.json(team);
    } catch (error) {
      console.error("Get team error:", error);
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  // Update team member endpoint
  app.patch("/api/team/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updated = await storage.updateTeamMember(id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Update team member error:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  // Delete team member endpoint
  app.delete("/api/team/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteTeamMember(id);
      if (!success) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete team member error:", error);
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // Change user password endpoint
  app.post("/api/team/:id/change-password", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Generate new secure password
      const newPassword = generateSecurePassword(12);
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update team member with new password
      const updated = await storage.updateTeamMember(id, {
        passwordHash,
        temporaryPassword: newPassword,
        mustChangePassword: true
      });

      if (!updated) {
        return res.status(404).json({ error: "Team member not found" });
      }

      res.json({
        success: true,
        newPassword,
        message: "Password changed successfully"
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Roles management
  app.get("/api/roles", async (req: Request, res: Response) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Get roles error:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  // Environment configurations
  app.get("/api/environment-configurations", async (req: Request, res: Response) => {
    try {
      // Return empty array as environment configurations aren't implemented yet
      res.json([]);
    } catch (error) {
      console.error("Get environment configurations error:", error);
      res.status(500).json({ error: "Failed to fetch environment configurations" });
    }
  });

  app.post("/api/dashboard/save-layout", async (req: Request, res: Response) => {
    try {
      const { tiles } = req.body;
      await storage.saveDashboardLayout(tiles);
      res.json({ success: true });
    } catch (error) {
      console.error("Save dashboard layout error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to save dashboard layout" 
      });
    }
  });

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
      
      // For temporary tiles (not yet saved), use the query from request body
      if (tileId.startsWith('tile-')) {
        const { query } = req.body;
        if (!query) {
          return res.status(400).json({ error: "Query is required for temporary tiles" });
        }

        // Execute the Snowflake query directly
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

        return res.json({
          columns: result.columns,
          rows: result.rows,
          success: true,
          tileId: tileId,
          query: query,
          lastRefreshAt: new Date().toISOString()
        });
      }

      // For saved tiles, look up from database
      const tiles = await storage.getDashboardTiles();
      const tile = tiles.find(t => t.id === tileId || t.tileId === tileId);
      
      if (!tile) {
        return res.status(404).json({ error: `Dashboard tile not found: ${tileId}` });
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

      // Update the tile's last refresh timestamp in the database
      const refreshTimestamp = new Date();
      try {
        console.log(`Updating last refresh timestamp for tile ${tileId}`);
        await storage.updateTileLastRefresh(tileId, refreshTimestamp);
        console.log(`Successfully updated timestamp for tile ${tileId}`);
      } catch (error) {
        console.error(`Failed to update last refresh timestamp for tile ${tileId}:`, error);
      }

      res.json({
        columns: result.columns,
        rows: result.rows,
        success: true,
        tileId: tileId,
        query: dataSource.query,
        lastRefreshAt: refreshTimestamp.toISOString()
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

  // Cohorts API Endpoints
  app.get("/api/cohorts", async (req: Request, res: Response) => {
    try {
      const cohorts = await storage.getCohorts();
      res.json(cohorts);
    } catch (error) {
      console.error("Get cohorts error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get cohorts" 
      });
    }
  });

  app.get("/api/cohorts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const cohort = await storage.getCohort(id);
      
      if (!cohort) {
        return res.status(404).json({ error: "Cohort not found" });
      }
      
      res.json(cohort);
    } catch (error) {
      console.error("Get cohort error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get cohort" 
      });
    }
  });

  app.post("/api/cohorts", async (req: Request, res: Response) => {
    try {
      console.log("Saving cohort:", req.body);
      const { insertCohortSchema } = await import('../shared/schema');
      const validatedData = insertCohortSchema.parse(req.body);
      
      // Add createdBy field with a default team member ID or null
      const cohortData = {
        ...validatedData,
        createdBy: null // Set to null since we don't have user context yet
      };
      
      const cohort = await storage.createCohort(cohortData);
      res.status(201).json(cohort);
    } catch (error) {
      console.error("Create cohort error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create cohort" 
      });
    }
  });

  app.put("/api/cohorts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const cohort = await storage.updateCohort(id, updates);
      
      if (!cohort) {
        return res.status(404).json({ error: "Cohort not found" });
      }
      
      res.json(cohort);
    } catch (error) {
      console.error("Update cohort error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update cohort" 
      });
    }
  });

  app.delete("/api/cohorts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCohort(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Cohort not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete cohort error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete cohort" 
      });
    }
  });

  // Integrations API Endpoints
  app.get("/api/integrations", async (req: Request, res: Response) => {
    try {
      const integrations = await storage.getIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error("Get integrations error:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.get("/api/integrations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const integration = await storage.getIntegration(id);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.json(integration);
    } catch (error) {
      console.error("Get integration error:", error);
      res.status(500).json({ error: "Failed to fetch integration" });
    }
  });

  app.post("/api/integrations", async (req: Request, res: Response) => {
    try {
      console.log("Creating integration with data:", JSON.stringify(req.body, null, 2));
      const { insertIntegrationSchema } = await import('../shared/schema');
      const validatedData = insertIntegrationSchema.parse(req.body);
      
      // Store credentials directly without encryption for now to fix the JSON parsing issue
      console.log("Validated data credentials:", validatedData.credentials);
      
      const integration = await storage.createIntegration(validatedData);
      console.log("Integration created successfully:", integration.id);
      res.status(201).json(integration);
    } catch (error) {
      console.error("Create integration error:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create integration" 
      });
    }
  });

  app.patch("/api/integrations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const integration = await storage.updateIntegration(id, updates);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.json(integration);
    } catch (error) {
      console.error("Update integration error:", error);
      res.status(500).json({ error: "Failed to update integration" });
    }
  });

  app.delete("/api/integrations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteIntegration(id);
      if (!success) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete integration error:", error);
      res.status(500).json({ error: "Failed to delete integration" });
    }
  });

  app.post("/api/integrations/:id/test", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const integration = await storage.getIntegration(id);
      
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      // Test connection based on integration type
      if (integration.type === 'snowflake') {
        const credentials = integration.credentials as any;
        const { getDynamicSnowflakeService } = await import('./services/snowflake');
        const snowflakeService = await getDynamicSnowflakeService();
        
        if (!snowflakeService) {
          return res.status(400).json({ 
            success: false, 
            error: "Snowflake integration not configured" 
          });
        }

        // Test with a simple query
        const testResult = await snowflakeService.executeQuery("SELECT 1 as test");
        
        if (testResult.success) {
          res.json({ 
            success: true, 
            message: "Snowflake connection successful",
            details: {
              database: credentials.database,
              warehouse: credentials.warehouse,
              account: credentials.account
            }
          });
        } else {
          res.json({ 
            success: false, 
            error: "Connection failed: " + (testResult.error || "Unknown error")
          });
        }
      } else if (integration.type === 'postgresql') {
        // Test PostgreSQL connection
        const credentials = integration.credentials as any;
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: credentials.connectionString
        });
        
        try {
          const client = await pool.connect();
          await client.query('SELECT 1');
          client.release();
          await pool.end();
          
          res.json({ 
            success: true, 
            message: "PostgreSQL connection successful" 
          });
        } catch (error) {
          res.json({ 
            success: false, 
            error: "PostgreSQL connection failed: " + (error instanceof Error ? error.message : "Unknown error")
          });
        }
      } else {
        res.json({ 
          success: true, 
          message: `${integration.type} connection test not implemented` 
        });
      }
    } catch (error) {
      console.error("Test integration error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to test integration: " + (error instanceof Error ? error.message : "Unknown error")
      });
    }
  });

  // Segments API Endpoints
  app.get("/api/segments", async (req: Request, res: Response) => {
    try {
      const segments = await storage.getSegments();
      res.json(segments);
    } catch (error) {
      console.error("Get segments error:", error);
      res.status(500).json({ error: "Failed to fetch segments" });
    }
  });

  app.get("/api/segments/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }
      res.json(segment);
    } catch (error) {
      console.error("Get segment error:", error);
      res.status(500).json({ error: "Failed to fetch segment" });
    }
  });

  app.post("/api/segments", async (req: Request, res: Response) => {
    try {
      const { insertSegmentSchema } = await import('../shared/schema');
      const validatedData = insertSegmentSchema.parse(req.body);
      const segment = await storage.createSegment(validatedData);
      res.status(201).json(segment);
    } catch (error) {
      console.error("Create segment error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create segment" 
      });
    }
  });

  app.put("/api/segments/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const segment = await storage.updateSegment(id, updates);
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }
      res.json(segment);
    } catch (error) {
      console.error("Update segment error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update segment" 
      });
    }
  });

  app.delete("/api/segments/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSegment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Segment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete segment error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete segment" 
      });
    }
  });

  app.post("/api/segments/:id/refresh", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get segment details
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }

      // Execute segment calculation query
      const { getDynamicSnowflakeService } = await import('./services/snowflake');
      const dynamicService = await getDynamicSnowflakeService();
      
      if (!dynamicService) {
        return res.status(400).json({ 
          error: "Snowflake integration not configured",
          details: "Please configure a Snowflake integration in the Integrations page"
        });
      }

      // Build SQL query from segment conditions
      const conditions = segment.conditions as any;
      let query = `SELECT COUNT(*) as user_count FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4`;
      
      if (conditions && conditions.rule) {
        query += ` WHERE ${conditions.rule}`;
      } else if (conditions && conditions.attribute && conditions.operator && conditions.value) {
        const operator = conditions.operator;
        const value = operator.includes('LIKE') ? `'%${conditions.value}%'` : 
                     isNaN(Number(conditions.value)) ? `'${conditions.value}'` : conditions.value;
        query += ` WHERE ${conditions.attribute} ${operator} ${value}`;
      }

      const queryResult = await dynamicService.executeQuery(query);
      if (!queryResult.success) {
        return res.status(500).json({ error: "Failed to execute segment query" });
      }

      const userCount = queryResult.rows[0]?.[0] || 0;

      // Update segment with new user count
      const updatedConditions = { 
        ...conditions, 
        userCount: Number(userCount),
        lastCalculatedAt: new Date().toISOString()
      };
      
      const updatedSegment = await storage.updateSegment(id, { 
        conditions: updatedConditions
      });

      res.json({ 
        segment: updatedSegment,
        userCount: Number(userCount),
        message: "Segment refreshed successfully"
      });
    } catch (error) {
      console.error("Segment refresh error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to refresh segment" 
      });
    }
  });

  // Campaigns/Upselling API Endpoints
  app.get("/api/campaigns", async (req: Request, res: Response) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Get campaign error:", error);
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", async (req: Request, res: Response) => {
    try {
      const { insertCampaignSchema } = await import('../shared/schema');
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create campaign" 
      });
    }
  });

  app.put("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const campaign = await storage.updateCampaign(id, updates);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update campaign" 
      });
    }
  });

  app.delete("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCampaign(id);
      if (!deleted) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete campaign error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete campaign" 
      });
    }
  });

  // Amplitude configuration endpoint
  app.get("/api/amplitude/config", async (req: Request, res: Response) => {
    try {
      const { CredentialManager } = await import('./services/credentialManager');
      const credentialManager = new CredentialManager();
      const credentials = await credentialManager.getAmplitudeCredentials();
      
      if (!credentials) {
        return res.status(404).json({ 
          error: "Amplitude integration not configured",
          details: "Please configure an Amplitude integration in the Integrations page"
        });
      }

      res.json({
        apiKey: credentials.apiKey,
        projectId: credentials.projectId,
        environment: credentials.environment
      });
    } catch (error) {
      console.error("Get Amplitude config error:", error);
      res.status(500).json({ error: "Failed to fetch Amplitude configuration" });
    }
  });

  // Snowflake schema endpoint for segments page
  app.get("/api/snowflake/schema", async (req: Request, res: Response) => {
    try {
      const { getDynamicSnowflakeService } = await import('./services/snowflake');
      const dynamicService = await getDynamicSnowflakeService();
      
      if (!dynamicService) {
        return res.status(400).json({ 
          error: "Snowflake integration not configured",
          details: "Please configure a Snowflake integration in the Integrations page"
        });
      }

      // Get table schema information
      const schemaQuery = `
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM DBT_CORE_PROD_DATABASE.INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'OPERATIONS' 
        AND TABLE_NAME = 'USER_SEGMENTATION_PROJECT_V4'
        ORDER BY ORDINAL_POSITION
      `;

      const result = await dynamicService.executeQuery(schemaQuery);
      if (!result.success) {
        return res.status(500).json({ error: "Failed to fetch schema information" });
      }

      const columns = result.rows.map(row => ({
        name: row[0],
        type: row[1]
      }));

      res.json({ columns });
    } catch (error) {
      console.error("Get schema error:", error);
      res.status(500).json({ error: "Failed to fetch schema" });
    }
  });

  // Amplitude sync endpoint
  app.post("/api/cohorts/:id/sync-amplitude", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { ownerEmail = "data-team@yourcompany.com" } = req.body;
      
      console.log(`Starting Amplitude sync for cohort ${id} with owner ${ownerEmail}`);
      
      // Get cohort details
      const cohort = await storage.getCohort(id);
      if (!cohort) {
        return res.status(404).json({ error: "Cohort not found" });
      }

      // Execute the cohort query to get user IDs
      if (!cohort.calculationQuery) {
        return res.status(400).json({ error: "Cohort has no calculation query" });
      }

      const { getDynamicSnowflakeService } = await import('./services/snowflake');
      const dynamicService = await getDynamicSnowflakeService();
      
      if (!dynamicService) {
        return res.status(400).json({ 
          error: "Snowflake integration not configured",
          details: "Please configure a Snowflake integration in the Integrations page"
        });
      }

      console.log(`Executing cohort query: ${cohort.calculationQuery}`);
      const queryResult = await dynamicService.executeQuery(cohort.calculationQuery);
      if (!queryResult.success) {
        console.error("Cohort query failed:", queryResult.error);
        return res.status(500).json({ error: "Failed to execute cohort query" });
      }

      // Extract user IDs from query result
      const userIds = queryResult.rows.map(row => row[0]?.toString()).filter(Boolean);
      console.log(`Found ${userIds.length} user IDs for cohort sync`);
      
      // Sync to Amplitude
      const { amplitudeService } = await import('./services/amplitude');
      console.log(`Syncing cohort "${cohort.name}" to Amplitude...`);
      const syncResult = await amplitudeService.syncCohort(cohort.name, userIds, ownerEmail);

      if (syncResult.success) {
        console.log(`Amplitude sync successful, cohort ID: ${syncResult.cohortId}`);
        // Update cohort sync status
        await storage.updateCohort(id, { 
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          amplitudeCohortId: syncResult.cohortId
        });

        res.json({ 
          message: "Successfully synced to Amplitude",
          amplitudeCohortId: syncResult.cohortId,
          syncedUserCount: userIds.length
        });
      } else {
        console.error("Amplitude sync failed:", syncResult.error);
        res.status(500).json({ 
          error: `Amplitude sync failed: ${syncResult.error}` 
        });
      }

    } catch (error) {
      console.error("Amplitude sync error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to sync to Amplitude" 
      });
    }
  });

  return server;
}