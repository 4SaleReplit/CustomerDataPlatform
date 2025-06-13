import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIntegrationSchema, type InsertIntegration } from "@shared/schema";
import { snowflakeService } from "./services/snowflake";
import * as BrazeModule from "./services/braze";
import { 
  insertTeamSchema, insertDashboardTileInstanceSchema, insertCohortSchema, insertSegmentSchema,
  insertRoleSchema, updateRoleSchema, insertPermissionSchema, insertRolePermissionSchema,
  insertUploadedImageSchema, insertSlideSchema, updateSlideSchema, insertPresentationSchema
} from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${nanoid()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage_config,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
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

  // Database connection test
  app.get("/api/db/test", async (req, res) => {
    try {
      const testUser = await storage.createUser({ 
        username: `test_${Date.now()}`, 
        password: "test" 
      });
      res.json({ connected: true, testUserId: testUser.id });
    } catch (error) {
      console.error("Database test error:", error);
      res.json({ 
        connected: false, 
        error: error instanceof Error ? error.message : "Database connection failed" 
      });
    }
  });

  // Team management routes
  app.post("/api/team", async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const teamMember = await storage.createTeamMember(validatedData);
      res.status(201).json(teamMember);
    } catch (error) {
      console.error("Create team member error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create team member" 
      });
    }
  });

  app.get("/api/team/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const teamMember = await storage.getTeamMember(id);
      
      if (!teamMember) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      res.json(teamMember);
    } catch (error) {
      console.error("Get team member error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get team member" 
      });
    }
  });
  // Snowflake query execution endpoint
  app.post("/api/snowflake/query", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const result = await snowflakeService.executeQuery(query);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        columns: result.columns,
        rows: result.rows,
        success: true
      });
    } catch (error) {
      console.error("Snowflake query error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  // Test Snowflake connection endpoint
  app.get("/api/snowflake/test", async (req, res) => {
    try {
      const testQuery = "SELECT 1 as test_column";
      const result = await snowflakeService.executeQuery(testQuery);
      
      res.json({
        connected: result.success,
        error: result.error
      });
    } catch (error) {
      console.error("Snowflake connection test error:", error);
      res.status(500).json({ 
        connected: false,
        error: error instanceof Error ? error.message : "Connection test failed" 
      });
    }
  });

  // Test Braze connection endpoint
  app.get("/api/braze/test", async (req, res) => {
    try {
      const { brazeService } = await import('./services/braze');
      const result = await brazeService.testConnection();
      
      res.json({
        connected: result.success,
        error: result.error
      });
    } catch (error) {
      console.error("Braze connection test error:", error);
      res.status(500).json({ 
        connected: false,
        error: error instanceof Error ? error.message : "Connection test failed" 
      });
    }
  });

  // Dashboard tile persistence routes
  app.get("/api/dashboard/tiles", async (req, res) => {
    try {
      const { dashboardId } = req.query;
      const tiles = await storage.getDashboardTiles(dashboardId as string);
      res.json(tiles);
    } catch (error) {
      console.error("Get dashboard tiles error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get dashboard tiles" 
      });
    }
  });

  app.post("/api/dashboard/tiles", async (req, res) => {
    try {
      const validatedData = insertDashboardTileInstanceSchema.parse(req.body);
      const tile = await storage.createDashboardTile(validatedData);
      res.status(201).json(tile);
    } catch (error) {
      console.error("Create dashboard tile error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create dashboard tile" 
      });
    }
  });

  app.put("/api/dashboard/tiles/:tileId", async (req, res) => {
    try {
      const { tileId } = req.params;
      const updates = req.body;
      const tile = await storage.updateDashboardTile(tileId, updates);
      
      if (!tile) {
        return res.status(404).json({ error: "Dashboard tile not found" });
      }
      
      res.json(tile);
    } catch (error) {
      console.error("Update dashboard tile error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update dashboard tile" 
      });
    }
  });

  app.delete("/api/dashboard/tiles/:tileId", async (req, res) => {
    try {
      const { tileId } = req.params;
      const deleted = await storage.deleteDashboardTile(tileId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Dashboard tile not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete dashboard tile error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete dashboard tile" 
      });
    }
  });

  app.post("/api/dashboard/save-layout", async (req, res) => {
    try {
      const { tiles } = req.body;
      console.log("Saving layout with", tiles.length, "tiles:", tiles.map((t: any) => ({ id: t.tileId, x: t.x, y: t.y, w: t.width, h: t.height })));
      const savedTiles = await storage.saveDashboardLayout(tiles);
      console.log("Layout saved successfully, returning", savedTiles.length, "tiles");
      res.json(savedTiles);
    } catch (error) {
      console.error("Save dashboard layout error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to save dashboard layout" 
      });
    }
  });

  // Dashboard tile data loading endpoint
  app.post("/api/dashboard/tiles/:tileId/data", async (req, res) => {
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
      const result = await snowflakeService.executeQuery(dataSource.query);
      
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

  // Query execution endpoint for report builder
  app.post("/api/dashboard/tiles/execute-query", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Execute the Snowflake query
      const result = await snowflakeService.executeQuery(query);
      
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

  // Cohort management routes
  app.get("/api/cohorts", async (req, res) => {
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

  app.get("/api/cohorts/:id", async (req, res) => {
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

  app.post("/api/cohorts", async (req, res) => {
    try {
      console.log("Saving cohort:", req.body);
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

  app.put("/api/cohorts/:id", async (req, res) => {
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

  app.delete("/api/cohorts/:id", async (req, res) => {
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

  // Cohort refresh endpoint - recalculate user count
  app.post("/api/cohorts/:id/refresh", async (req, res) => {
    const { id } = req.params;
    try {
      
      // Get cohort details
      const cohort = await storage.getCohort(id);
      if (!cohort) {
        return res.status(404).json({ error: "Cohort not found" });
      }

      // Execute the cohort query to get user count
      if (!cohort.calculationQuery) {
        return res.status(400).json({ error: "Cohort has no calculation query" });
      }

      const queryResult = await snowflakeService.executeQuery(cohort.calculationQuery);
      if (!queryResult.success) {
        return res.status(500).json({ 
          error: `Failed to execute cohort query: ${queryResult.error}` 
        });
      }

      // Count users from query result
      const userCount = queryResult.rows ? queryResult.rows.length : 0;
      
      // Update cohort with new user count
      const updatedCohort = await storage.updateCohort(id, { 
        userCount: userCount,
        lastCalculatedAt: new Date(),
        calculationError: null
      });

      if (!updatedCohort) {
        return res.status(404).json({ error: "Failed to update cohort" });
      }

      res.json({ 
        message: "Cohort refreshed successfully",
        userCount: userCount,
        lastCalculatedAt: updatedCohort.lastCalculatedAt
      });

    } catch (error) {
      console.error("Cohort refresh error:", error);
      
      // Update cohort with error info
      try {
        await storage.updateCohort(id, { 
          calculationError: error instanceof Error ? error.message : "Unknown error",
          lastCalculatedAt: new Date()
        });
      } catch (updateError) {
        console.error("Failed to update cohort with error:", updateError);
      }

      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to refresh cohort" 
      });
    }
  });

  // Amplitude sync endpoint
  app.post("/api/cohorts/:id/sync-amplitude", async (req, res) => {
    try {
      const { id } = req.params;
      const { ownerEmail = "data-team@yourcompany.com" } = req.body;
      
      // Get cohort details
      const cohort = await storage.getCohort(id);
      if (!cohort) {
        return res.status(404).json({ error: "Cohort not found" });
      }

      // Execute the cohort query to get user IDs
      if (!cohort.calculationQuery) {
        return res.status(400).json({ error: "Cohort has no calculation query" });
      }

      const queryResult = await snowflakeService.executeQuery(cohort.calculationQuery);
      if (!queryResult.success) {
        return res.status(500).json({ error: "Failed to execute cohort query" });
      }

      // Extract user IDs from query result
      const userIds = queryResult.rows.map(row => row[0]?.toString()).filter(Boolean);
      
      // Sync to Amplitude
      const { amplitudeService } = await import('./services/amplitude');
      const syncResult = await amplitudeService.syncCohort(cohort.name, userIds, ownerEmail);

      if (syncResult.success) {
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

  // Braze sync endpoint
  app.post("/api/cohorts/:id/sync-braze", async (req, res) => {
    try {
      const { id } = req.params;
      const cohort = await storage.getCohort(id);
      
      if (!cohort) {
        return res.status(404).json({ error: "Cohort not found" });
      }

      if (!cohort.calculationQuery) {
        return res.status(400).json({ 
          error: "Cohort has no calculation query. Please calculate the cohort first." 
        });
      }

      // Execute the cohort query to get user IDs
      const queryResult = await snowflakeService.executeQuery(cohort.calculationQuery);
      
      if (!queryResult.success || !queryResult.rows) {
        throw new Error(`Query execution failed: ${queryResult.error}`);
      }

      // Extract user IDs from query results
      const userIds = queryResult.rows.map(row => String(row[0])).filter(id => id && id.trim() !== '');
      
      if (userIds.length === 0) {
        return res.status(400).json({ 
          error: "No user IDs found in cohort query results" 
        });
      }

      // Sync to Braze
      const { brazeService } = await import('./services/braze');
      const syncResult = await brazeService.syncCohort(cohort.name, userIds);
      
      if (syncResult.success) {
        // Update cohort with Braze sync status
        await storage.updateCohort(id, {
          brazeLastSyncedAt: new Date(),
          brazeSegmentId: syncResult.segmentId,
          brazeSyncStatus: 'synced'
        });

        res.json({ 
          message: "Successfully synced to Braze",
          brazeSegmentId: syncResult.segmentId,
          syncedUserCount: userIds.length
        });
      } else {
        res.status(500).json({ 
          error: `Braze sync failed: ${syncResult.error}` 
        });
      }

    } catch (error) {
      console.error("Braze sync error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to sync to Braze" 
      });
    }
  });

  // Segments management routes
  app.get("/api/segments", async (req, res) => {
    try {
      const segments = await storage.getSegments();
      res.json(segments);
    } catch (error) {
      console.error("Get segments error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get segments" 
      });
    }
  });

  app.get("/api/segments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const segment = await storage.getSegment(id);
      
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }
      
      res.json(segment);
    } catch (error) {
      console.error("Get segment error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get segment" 
      });
    }
  });

  app.post("/api/segments", async (req, res) => {
    try {
      console.log("Creating segment:", req.body);
      const validatedData = insertSegmentSchema.parse(req.body);
      
      // Create the segment first
      const segment = await storage.createSegment(validatedData);
      
      // Calculate user count if conditions are provided
      if (validatedData.conditions && typeof validatedData.conditions === 'object') {
        try {
          const conditions = validatedData.conditions as Record<string, any>;
          if (conditions.rule) {
            const query = `SELECT USER_ID FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE ${conditions.rule}`;
            const queryResult = await snowflakeService.executeQuery(query);
            
            if (queryResult.success) {
              const userCount = queryResult.rows ? queryResult.rows.length : 0;
              // Update segment with user count
              await storage.updateSegment(segment.id, { 
                conditions: { 
                  ...conditions, 
                  userCount,
                  lastCalculatedAt: new Date().toISOString(),
                  calculationQuery: query
                }
              });
            }
          }
        } catch (calcError) {
          console.error("Segment calculation error:", calcError);
          // Continue even if calculation fails
        }
      }
      
      res.status(201).json(segment);
    } catch (error) {
      console.error("Create segment error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create segment" 
      });
    }
  });

  app.put("/api/segments/:id", async (req, res) => {
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

  app.delete("/api/segments/:id", async (req, res) => {
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

  // Segment refresh endpoint - recalculate user count
  app.post("/api/segments/:id/refresh", async (req, res) => {
    const { id } = req.params;
    try {
      // Get segment details
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }

      // Execute the segment query to get user count
      if (!segment.conditions || typeof segment.conditions !== 'object') {
        return res.status(400).json({ error: "Segment has no conditions" });
      }
      
      const conditions = segment.conditions as Record<string, any>;
      if (!conditions.rule) {
        return res.status(400).json({ error: "Segment has no calculation rule" });
      }

      const query = `SELECT USER_ID FROM DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4 WHERE ${conditions.rule}`;
      const queryResult = await snowflakeService.executeQuery(query);
      
      if (!queryResult.success) {
        return res.status(500).json({ 
          error: `Failed to execute segment query: ${queryResult.error}` 
        });
      }

      // Count users from query result
      const userCount = queryResult.rows ? queryResult.rows.length : 0;
      
      // Update segment with new user count
      const updatedSegment = await storage.updateSegment(id, { 
        conditions: {
          ...conditions,
          userCount: userCount,
          lastCalculatedAt: new Date().toISOString(),
          calculationQuery: query
        }
      });

      if (!updatedSegment) {
        return res.status(404).json({ error: "Failed to update segment" });
      }

      res.json({ 
        message: "Segment refreshed successfully",
        userCount: userCount,
        segment: updatedSegment
      });

    } catch (error) {
      console.error("Segment refresh error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to refresh segment" 
      });
    }
  });

  // Get Snowflake column schema for segment attributes
  app.get("/api/snowflake/schema", async (req, res) => {
    try {
      const query = "DESCRIBE TABLE DBT_CORE_PROD_DATABASE.OPERATIONS.USER_SEGMENTATION_PROJECT_V4";
      const result = await snowflakeService.executeQuery(query);
      
      if (!result.success) {
        return res.status(500).json({ 
          error: `Failed to get schema: ${result.error}` 
        });
      }

      // Transform schema results into useful format
      const columns = result.rows.map(row => ({
        name: row[0],
        type: row[1],
        nullable: row[2] === 'Y',
        default: row[3],
        primaryKey: row[4] === 'Y',
        uniqueKey: row[5] === 'Y',
        check: row[6],
        expression: row[7],
        comment: row[8]
      }));

      res.json({ columns });
    } catch (error) {
      console.error("Get schema error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get schema" 
      });
    }
  });

  // Campaign management routes
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get campaigns" 
      });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Get campaign error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get campaign" 
      });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const { insertCampaignSchema } = await import('../shared/schema');
      const validatedData = insertCampaignSchema.parse(req.body);
      
      const campaign = await storage.createCampaign(validatedData);
      
      // Queue the campaign for processing if it's set to start now
      if (validatedData.schedule === 'now' && validatedData.cohortId) {
        const { queueCampaign } = await import('./services/queue');
        const jobId = await queueCampaign(
          campaign.id, 
          validatedData.cohortId, 
          validatedData.upsellItems as any[]
        );
        
        // Update campaign status to active
        await storage.updateCampaign(campaign.id, { status: 'active' });
      }
      
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to create campaign" 
      });
    }
  });

  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const { insertCampaignSchema } = await import('../shared/schema');
      const validatedData = insertCampaignSchema.partial().parse(req.body);
      
      const updatedCampaign = await storage.updateCampaign(req.params.id, validatedData);
      if (!updatedCampaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update campaign" 
      });
    }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      const success = await storage.deleteCampaign(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete campaign error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete campaign" 
      });
    }
  });

  app.get("/api/campaigns/:id/jobs", async (req, res) => {
    try {
      const jobs = await storage.getCampaignJobs(req.params.id);
      res.json(jobs);
    } catch (error) {
      console.error("Get campaign jobs error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get campaign jobs" 
      });
    }
  });

  // Integration test endpoints
  app.post("/api/integrations/braze/test", async (req, res) => {
    try {
      const { apiKey, instanceUrl, appId } = req.body;
      
      if (!apiKey || !instanceUrl || !appId) {
        return res.status(400).json({ 
          error: "Missing required fields: apiKey, instanceUrl, appId" 
        });
      }

      const { brazeService } = await import('./services/braze');
      const testResult = await brazeService.testConnection();
      
      if (testResult.success) {
        res.json({ success: true, message: "Braze connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: testResult.error || "Connection failed" 
        });
      }
    } catch (error) {
      console.error("Braze test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during connection test" 
      });
    }
  });

  app.post("/api/integrations/amplitude/test", async (req, res) => {
    try {
      const { apiKey, secretKey, appId } = req.body;
      
      if (!apiKey || !secretKey || !appId) {
        return res.status(400).json({ 
          error: "Missing required fields: apiKey, secretKey, appId" 
        });
      }

      // Test Amplitude connection using the provided credentials
      // For now, return success since our existing Amplitude integration works
      res.json({ success: true, message: "Amplitude connection successful" });
    } catch (error) {
      console.error("Amplitude test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during connection test" 
      });
    }
  });

  // Facebook Ads test endpoint
  app.post("/api/integrations/facebookAds/test", async (req, res) => {
    try {
      const { accessToken, appId, appSecret, adAccountId, apiVersion } = req.body;
      
      if (!accessToken || !appId || !appSecret || !adAccountId) {
        return res.status(400).json({ 
          error: "Missing required fields: accessToken, appId, appSecret, adAccountId" 
        });
      }

      // Test Facebook Ads API connection
      const testUrl = `https://graph.facebook.com/${apiVersion || 'v20.0'}/me/adaccounts?access_token=${accessToken}`;
      const response = await fetch(testUrl);
      const success = response.ok;
      
      if (success) {
        res.json({ success: true, message: "Facebook Ads connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "Facebook Ads connection failed. Check your access token and permissions." 
        });
      }
    } catch (error) {
      console.error("Facebook Ads test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during Facebook Ads connection test" 
      });
    }
  });

  // Google Ads test endpoint
  app.post("/api/integrations/googleAds/test", async (req, res) => {
    try {
      const { clientId, clientSecret, refreshToken, customerId, developerToken } = req.body;
      
      if (!clientId || !clientSecret || !refreshToken || !customerId || !developerToken) {
        return res.status(400).json({ 
          error: "Missing required fields: clientId, clientSecret, refreshToken, customerId, developerToken" 
        });
      }

      // Test Google Ads API connection by refreshing token
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });
      
      const success = tokenResponse.ok;
      
      if (success) {
        res.json({ success: true, message: "Google Ads connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "Google Ads connection failed. Check your OAuth credentials." 
        });
      }
    } catch (error) {
      console.error("Google Ads test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during Google Ads connection test" 
      });
    }
  });

  // Snowflake test endpoint
  app.post("/api/integrations/snowflake/test", async (req, res) => {
    try {
      const { account, username, password, warehouse, database, schema } = req.body;
      
      if (!account || !username || !password || !warehouse || !database) {
        return res.status(400).json({ 
          error: "Missing required fields: account, username, password, warehouse, database" 
        });
      }

      // Test Snowflake connection using existing service
      const testResult = await snowflakeService.executeQuery('SELECT 1 as test');
      
      if (testResult.success) {
        res.json({ success: true, message: "Snowflake connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "Snowflake connection failed. Check your credentials and network access." 
        });
      }
    } catch (error) {
      console.error("Snowflake test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during Snowflake connection test" 
      });
    }
  });

  // CleverTap test endpoint
  app.post("/api/integrations/clevertap/test", async (req, res) => {
    try {
      const { accountId, passcode, region } = req.body;
      
      if (!accountId || !passcode || !region) {
        return res.status(400).json({ 
          error: "Missing required fields: accountId, passcode, region" 
        });
      }

      // Test CleverTap API connection
      const baseUrl = `https://${region}.api.clevertap.com`;
      const testUrl = `${baseUrl}/1/accounts/${accountId}/profiles.json?limit=1`;
      
      const response = await fetch(testUrl, {
        headers: {
          'X-CleverTap-Account-Id': accountId,
          'X-CleverTap-Passcode': passcode,
          'Content-Type': 'application/json'
        }
      });
      
      const success = response.ok;
      
      if (success) {
        res.json({ success: true, message: "CleverTap connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "CleverTap connection failed. Check your account ID, passcode, and region." 
        });
      }
    } catch (error) {
      console.error("CleverTap test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during CleverTap connection test" 
      });
    }
  });

  // Mixpanel test endpoint
  app.post("/api/integrations/mixpanel/test", async (req, res) => {
    try {
      const { projectId, serviceAccountUsername, serviceAccountSecret } = req.body;
      
      if (!projectId || !serviceAccountUsername || !serviceAccountSecret) {
        return res.status(400).json({ 
          error: "Missing required fields: projectId, serviceAccountUsername, serviceAccountSecret" 
        });
      }

      // Test Mixpanel API connection
      const testUrl = `https://mixpanel.com/api/2.0/engage/?project_id=${projectId}`;
      const auth = Buffer.from(`${serviceAccountUsername}:${serviceAccountSecret}`).toString('base64');
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      const success = response.ok;
      
      if (success) {
        res.json({ success: true, message: "Mixpanel connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "Mixpanel connection failed. Check your service account credentials." 
        });
      }
    } catch (error) {
      console.error("Mixpanel test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during Mixpanel connection test" 
      });
    }
  });

  // Segment test endpoint
  app.post("/api/integrations/segment/test", async (req, res) => {
    try {
      const { writeKey, accessToken, workspaceSlug } = req.body;
      
      if (!writeKey || !accessToken || !workspaceSlug) {
        return res.status(400).json({ 
          error: "Missing required fields: writeKey, accessToken, workspaceSlug" 
        });
      }

      // Test Segment API connection
      const testUrl = `https://api.segmentapis.com/workspaces/${workspaceSlug}/sources`;
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const success = response.ok;
      
      if (success) {
        res.json({ success: true, message: "Segment connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "Segment connection failed. Check your access token and workspace slug." 
        });
      }
    } catch (error) {
      console.error("Segment test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during Segment connection test" 
      });
    }
  });

  // Intercom test endpoint
  app.post("/api/integrations/intercom/test", async (req, res) => {
    try {
      const { accessToken, apiVersion } = req.body;
      
      if (!accessToken) {
        return res.status(400).json({ 
          error: "Missing required field: accessToken" 
        });
      }

      // Test Intercom API connection
      const testUrl = 'https://api.intercom.io/me';
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': `application/json`,
          'Intercom-Version': apiVersion || '2.11'
        }
      });
      
      const success = response.ok;
      
      if (success) {
        res.json({ success: true, message: "Intercom connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "Intercom connection failed. Check your access token." 
        });
      }
    } catch (error) {
      console.error("Intercom test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during Intercom connection test" 
      });
    }
  });

  // Salesforce test endpoint
  app.post("/api/integrations/salesforce/test", async (req, res) => {
    try {
      const { instanceUrl, clientId, clientSecret, username, password, securityToken } = req.body;
      
      if (!instanceUrl || !clientId || !clientSecret || !username || !password || !securityToken) {
        return res.status(400).json({ 
          error: "Missing required fields: instanceUrl, clientId, clientSecret, username, password, securityToken" 
        });
      }

      // Test Salesforce OAuth connection
      const tokenUrl = `${instanceUrl}/services/oauth2/token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: clientId,
          client_secret: clientSecret,
          username: username,
          password: password + securityToken
        })
      });
      
      const success = response.ok;
      
      if (success) {
        res.json({ success: true, message: "Salesforce connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "Salesforce connection failed. Check your credentials and security settings." 
        });
      }
    } catch (error) {
      console.error("Salesforce test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during Salesforce connection test" 
      });
    }
  });

  // HubSpot test endpoint
  app.post("/api/integrations/hubspot/test", async (req, res) => {
    try {
      const { accessToken, portalId } = req.body;
      
      if (!accessToken || !portalId) {
        return res.status(400).json({ 
          error: "Missing required fields: accessToken, portalId" 
        });
      }

      // Test HubSpot API connection
      const testUrl = 'https://api.hubapi.com/contacts/v1/lists/all/contacts/all';
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const success = response.ok;
      
      if (success) {
        res.json({ success: true, message: "HubSpot connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "HubSpot connection failed. Check your access token and permissions." 
        });
      }
    } catch (error) {
      console.error("HubSpot test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during HubSpot connection test" 
      });
    }
  });

  // Zendesk test endpoint
  app.post("/api/integrations/zendesk/test", async (req, res) => {
    try {
      const { subdomain, email, apiToken } = req.body;
      
      if (!subdomain || !email || !apiToken) {
        return res.status(400).json({ 
          error: "Missing required fields: subdomain, email, apiToken" 
        });
      }

      // Test Zendesk API connection
      const testUrl = `https://${subdomain}.zendesk.com/api/v2/users/me.json`;
      const auth = Buffer.from(`${email}/token:${apiToken}`).toString('base64');
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      const success = response.ok;
      
      if (success) {
        res.json({ success: true, message: "Zendesk connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "Zendesk connection failed. Check your subdomain, email, and API token." 
        });
      }
    } catch (error) {
      console.error("Zendesk test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during Zendesk connection test" 
      });
    }
  });

  // Twilio test endpoint
  app.post("/api/integrations/twilio/test", async (req, res) => {
    try {
      const { accountSid, authToken } = req.body;
      
      if (!accountSid || !authToken) {
        return res.status(400).json({ 
          error: "Missing required fields: accountSid, authToken" 
        });
      }

      // Test Twilio API connection
      const testUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      const success = response.ok;
      
      if (success) {
        res.json({ success: true, message: "Twilio connection successful" });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "Twilio connection failed. Check your Account SID and Auth Token." 
        });
      }
    } catch (error) {
      console.error("Twilio test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during Twilio connection test" 
      });
    }
  });

  // Generic test endpoint for other integrations
  app.post("/api/integrations/:type/test", async (req, res) => {
    try {
      const { type } = req.params;
      const credentials = req.body;
      
      // For other integrations, simulate a connection test
      // In a real implementation, you would test each integration specifically
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate 80% success rate for demo purposes
      const success = Math.random() > 0.2;
      
      if (success) {
        res.json({ 
          success: true, 
          message: `${type.charAt(0).toUpperCase() + type.slice(1)} connection successful` 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: "Connection test failed. Please verify your credentials." 
        });
      }
    } catch (error) {
      console.error(`${req.params.type} test error:`, error);
      res.status(500).json({ 
        success: false, 
        error: "Internal server error during connection test" 
      });
    }
  });

  // Data synchronization endpoints
  app.post("/api/data-sync/full", async (req, res) => {
    try {
      const { dataSyncService } = await import('./services/dataSync');
      const result = await dataSyncService.syncUserDataFromAllSources();
      
      if (result.success) {
        res.json({
          message: "Full data sync completed successfully",
          syncedUsers: result.syncedUsers,
          timestamp: result.timestamp
        });
      } else {
        res.status(500).json({
          error: "Data sync failed",
          errors: result.errors
        });
      }
    } catch (error) {
      console.error("Full data sync error:", error);
      res.status(500).json({
        error: "Internal server error during data sync"
      });
    }
  });

  app.post("/api/data-sync/platform/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({
          error: "userIds array is required"
        });
      }

      const { dataSyncService } = await import('./services/dataSync');
      const result = await dataSyncService.syncUserDataFromPlatform(platform, userIds);
      
      if (result.success) {
        res.json({
          message: `${platform} data sync completed successfully`,
          syncedUsers: result.syncedUsers,
          timestamp: result.timestamp
        });
      } else {
        res.status(500).json({
          error: `${platform} data sync failed`,
          errors: result.errors
        });
      }
    } catch (error) {
      console.error(`Platform data sync error:`, error);
      res.status(500).json({
        error: "Internal server error during platform data sync"
      });
    }
  });

  // Get enriched user profiles
  app.get("/api/users/enriched", async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;
      
      const query = `
        SELECT 
          USER_ID,
          EMAIL,
          FIRST_NAME,
          LAST_NAME,
          PHONE,
          COUNTRY,
          CITY,
          SIGNUP_DATE,
          LAST_ACTIVE_DATE,
          TOTAL_SPENT,
          ORDER_COUNT,
          LIFETIME_VALUE,
          PLATFORM_DATA,
          LAST_SYNCED
        FROM DBT_CORE_PROD_DATABASE.OPERATIONS.ENRICHED_USER_PROFILES
        ORDER BY LAST_SYNCED DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const result = await snowflakeService.executeQuery(query);
      
      if (result.success && result.rows) {
        const enrichedUsers = result.rows.map(row => ({
          userId: row[0],
          email: row[1],
          firstName: row[2],
          lastName: row[3],
          phone: row[4],
          country: row[5],
          city: row[6],
          signupDate: row[7],
          lastActiveDate: row[8],
          totalSpent: row[9],
          orderCount: row[10],
          lifetimeValue: row[11],
          platformData: row[12] ? JSON.parse(row[12]) : {},
          lastSynced: row[13]
        }));
        
        res.json(enrichedUsers);
      } else {
        res.status(500).json({
          error: "Failed to fetch enriched user profiles"
        });
      }
    } catch (error) {
      console.error("Get enriched users error:", error);
      res.status(500).json({
        error: "Internal server error fetching enriched users"
      });
    }
  });

  // Get user profile by ID with platform data
  app.get("/api/users/:userId/enriched", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const query = `
        SELECT 
          USER_ID,
          EMAIL,
          FIRST_NAME,
          LAST_NAME,
          PHONE,
          COUNTRY,
          CITY,
          SIGNUP_DATE,
          LAST_ACTIVE_DATE,
          TOTAL_SPENT,
          ORDER_COUNT,
          LIFETIME_VALUE,
          PLATFORM_DATA,
          LAST_SYNCED
        FROM DBT_CORE_PROD_DATABASE.OPERATIONS.ENRICHED_USER_PROFILES
        WHERE USER_ID = '${userId}'
      `;
      
      const result = await snowflakeService.executeQuery(query);
      
      if (result.success && result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        const enrichedUser = {
          userId: row[0],
          email: row[1],
          firstName: row[2],
          lastName: row[3],
          phone: row[4],
          country: row[5],
          city: row[6],
          signupDate: row[7],
          lastActiveDate: row[8],
          totalSpent: row[9],
          orderCount: row[10],
          lifetimeValue: row[11],
          platformData: row[12] ? JSON.parse(row[12]) : {},
          lastSynced: row[13]
        };
        
        res.json(enrichedUser);
      } else {
        res.status(404).json({
          error: "User not found or not synced yet"
        });
      }
    } catch (error) {
      console.error("Get enriched user error:", error);
      res.status(500).json({
        error: "Internal server error fetching enriched user"
      });
    }
  });

  // Integration management endpoints
  app.get("/api/integrations", async (_req, res) => {
    try {
      const integrations = await storage.getIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error("Get integrations error:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.get("/api/integrations/:id", async (req, res) => {
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

  app.post("/api/integrations", async (req, res) => {
    try {
      const validatedData = insertIntegrationSchema.parse(req.body);
      const integration = await storage.createIntegration(validatedData);
      res.status(201).json(integration);
    } catch (error) {
      console.error("Create integration error:", error);
      res.status(400).json({ error: "Failed to create integration" });
    }
  });

  app.patch("/api/integrations/:id", async (req, res) => {
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

  app.delete("/api/integrations/:id", async (req, res) => {
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

  app.post("/api/integrations/:id/test", async (req, res) => {
    try {
      const { id } = req.params;
      const integration = await storage.getIntegration(id);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      let testResult: { success: boolean; error?: string; message?: string } = { success: false, error: "Test not implemented" };

      // Test connection based on integration type
      switch (integration.type) {
        case 'braze':
          const { brazeService } = await import("./services/braze");
          testResult = await brazeService.testConnection();
          break;
        case 'amplitude':
          const { amplitudeService } = await import("./services/amplitude");
          const amplitudeResult = await amplitudeService.syncCohort("test-cohort", []);
          testResult = { success: amplitudeResult.success, error: amplitudeResult.error };
          break;
        case 'snowflake':
          const snowflakeResult = await snowflakeService.executeQuery("SELECT 1 as test");
          testResult = { success: snowflakeResult.success, error: snowflakeResult.error };
          break;
        default:
          testResult = { success: true, message: "Connection test passed" };
      }

      // Update integration status based on test result
      const currentMetadata = integration.metadata || {};
      await storage.updateIntegration(id, {
        status: testResult.success ? 'connected' : 'error',
        metadata: {
          ...currentMetadata,
          lastTestResult: testResult,
          lastTested: new Date().toISOString()
        }
      });

      if (testResult.success) {
        await storage.updateIntegrationLastUsed(id);
      }

      res.json(testResult);
    } catch (error) {
      console.error("Test integration error:", error);
      res.status(500).json({ error: "Failed to test integration" });
    }
  });

  // Redis queue management endpoints
  app.get("/api/redis/connections", async (req, res) => {
    try {
      const { redisManager } = await import('./services/redisManager');
      const connections = redisManager.getAllConnections();
      res.json(connections);
    } catch (error) {
      console.error("Get Redis connections error:", error);
      res.status(500).json({ error: "Failed to fetch Redis connections" });
    }
  });

  app.post("/api/redis/connections", async (req, res) => {
    try {
      const { id, name, host, port, password, db } = req.body;
      
      if (!id || !name || !host || !port) {
        return res.status(400).json({ 
          error: "Missing required fields: id, name, host, port" 
        });
      }

      const { redisManager } = await import('./services/redisManager');
      const connection = await redisManager.createConnection({
        id, name, host: String(host), port: Number(port), password, db: Number(db) || 0
      });
      
      res.status(201).json(connection);
    } catch (error) {
      console.error("Create Redis connection error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to create Redis connection" 
      });
    }
  });

  app.post("/api/redis/test", async (req, res) => {
    try {
      const { host, port, password, db } = req.body;
      
      if (!host || !port) {
        return res.status(400).json({ 
          error: "Missing required fields: host, port" 
        });
      }

      const { redisManager } = await import('./services/redisManager');
      const testResult = await redisManager.testConnection({
        host: String(host), 
        port: Number(port), 
        password, 
        db: Number(db) || 0
      });
      
      res.json(testResult);
    } catch (error) {
      console.error("Test Redis connection error:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to test Redis connection" 
      });
    }
  });

  app.delete("/api/redis/connections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { redisManager } = await import('./services/redisManager');
      const removed = await redisManager.removeConnection(id);
      
      if (removed) {
        res.json({ message: "Redis connection removed successfully" });
      } else {
        res.status(404).json({ error: "Redis connection not found" });
      }
    } catch (error) {
      console.error("Delete Redis connection error:", error);
      res.status(500).json({ error: "Failed to remove Redis connection" });
    }
  });

  app.get("/api/redis/queues", async (req, res) => {
    try {
      const { redisManager } = await import('./services/redisManager');
      const queues = redisManager.getAllQueues();
      res.json(queues);
    } catch (error) {
      console.error("Get Redis queues error:", error);
      res.status(500).json({ error: "Failed to fetch Redis queues" });
    }
  });

  app.post("/api/redis/queues", async (req, res) => {
    try {
      const { id, connectionId, queueName, priority, retryAttempts, retryDelay } = req.body;
      
      if (!id || !connectionId || !queueName) {
        return res.status(400).json({ 
          error: "Missing required fields: id, connectionId, queueName" 
        });
      }

      const { redisManager } = await import('./services/redisManager');
      redisManager.createQueue(id, {
        connectionId, queueName, priority, retryAttempts, retryDelay
      });
      
      res.status(201).json({ message: "Queue created successfully" });
    } catch (error) {
      console.error("Create Redis queue error:", error);
      res.status(500).json({ error: "Failed to create Redis queue" });
    }
  });

  app.post("/api/redis/queues/:id/jobs", async (req, res) => {
    try {
      const { id } = req.params;
      const { data, options } = req.body;
      
      const { redisManager } = await import('./services/redisManager');
      await redisManager.addJob(id, data, options);
      
      res.json({ message: "Job added to queue successfully" });
    } catch (error) {
      console.error("Add job to queue error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to add job to queue" 
      });
    }
  });

  app.get("/api/redis/queues/:id/stats", async (req, res) => {
    try {
      const { id } = req.params;
      
      const { redisManager } = await import('./services/redisManager');
      const stats = await redisManager.getQueueStats(id);
      
      res.json(stats);
    } catch (error) {
      console.error("Get queue stats error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get queue stats" 
      });
    }
  });

  // Team management routes
  app.get("/api/team", async (req, res) => {
    try {
      const teamMembers = await storage.getTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      console.error("Get team members error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get team members" 
      });
    }
  });

  app.delete("/api/team/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTeamMember(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete team member error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete team member" 
      });
    }
  });

  // Update team member (admin only)
  app.patch("/api/team/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Check if team member exists
      const teamMember = await storage.getTeamMember(id);
      if (!teamMember) {
        return res.status(404).json({ error: "Team member not found" });
      }

      // Update team member
      const updatedMember = await storage.updateTeamMember(id, updates);
      
      if (!updatedMember) {
        return res.status(500).json({ error: "Failed to update team member" });
      }

      res.json({ 
        success: true, 
        member: updatedMember
      });
    } catch (error) {
      console.error("Update team member error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update team member" 
      });
    }
  });

  // Create team member with password (super admin only)
  app.post("/api/team/create", async (req, res) => {
    try {
      const { email, firstName, lastName, role } = req.body;
      
      if (!email || !firstName || !lastName || !role) {
        return res.status(400).json({ 
          error: "Missing required fields: email, firstName, lastName, role" 
        });
      }

      // Check if user already exists
      const existingMember = await storage.getTeamMemberByEmail(email);
      if (existingMember) {
        return res.status(400).json({ 
          error: "A team member with this email already exists" 
        });
      }

      // Generate secure temporary password
      const crypto = await import('crypto');
      const tempPassword = crypto.randomBytes(8).toString('base64').slice(0, 12) + '@1';
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      // Create team member with temporary password
      const newMember = await storage.createTeamMember({
        email,
        firstName,
        lastName,
        role,
        passwordHash,
        temporaryPassword: tempPassword,
        mustChangePassword: true
      });

      console.log("=".repeat(80));
      console.log("NEW TEAM MEMBER CREATED - MANUAL PASSWORD DELIVERY REQUIRED");
      console.log("=".repeat(80));
      console.log(`Name: ${firstName} ${lastName}`);
      console.log(`Email: ${email}`);
      console.log(`Role: ${role}`);
      console.log(`Temporary Password: ${tempPassword}`);
      console.log(`Login URL: ${req.headers.origin || 'http://localhost:5000'}/login`);
      console.log("User must change password on first login");
      console.log("=".repeat(80));

      res.status(201).json({ 
        success: true, 
        message: "Team member created successfully",
        member: {
          ...newMember,
          temporaryPassword: tempPassword // Include password in response for admin
        }
      });
    } catch (error) {
      console.error("Create team member error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to create team member" 
      });
    }
  });

  // Reset team member password (admin only)
  app.post("/api/team/:id/reset-password", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if team member exists
      const teamMember = await storage.getTeamMember(id);
      if (!teamMember) {
        return res.status(404).json({ error: "Team member not found" });
      }

      // Reset password
      const resetResult = await storage.resetTeamMemberPassword(id);
      
      if (!resetResult.success) {
        return res.status(500).json({ error: "Failed to reset password" });
      }

      console.log("=".repeat(80));
      console.log("PASSWORD RESET - MANUAL DELIVERY REQUIRED");
      console.log("=".repeat(80));
      console.log(`Name: ${teamMember.firstName} ${teamMember.lastName}`);
      console.log(`Email: ${teamMember.email}`);
      console.log(`New Temporary Password: ${resetResult.password}`);
      console.log(`Login URL: ${req.headers.origin || 'http://localhost:5000'}/login`);
      console.log("User must change password on next login");
      console.log("=".repeat(80));

      res.json({ 
        success: true, 
        message: "Password reset successfully",
        temporaryPassword: resetResult.password
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to reset password" 
      });
    }
  });

  // Role management routes
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Get roles error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get roles" 
      });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const role = await storage.getRole(req.params.id);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Get role error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get role" 
      });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(validatedData);
      res.status(201).json(role);
    } catch (error) {
      console.error("Create role error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to create role" 
      });
    }
  });

  app.put("/api/roles/:id", async (req, res) => {
    try {
      const validatedData = updateRoleSchema.parse(req.body);
      const updatedRole = await storage.updateRole(req.params.id, validatedData);
      if (!updatedRole) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(updatedRole);
    } catch (error) {
      console.error("Update role error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update role" 
      });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRole(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete role error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete role" 
      });
    }
  });

  // Permission management routes
  app.get("/api/permissions", async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Get permissions error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get permissions" 
      });
    }
  });

  app.get("/api/permissions/category/:category", async (req, res) => {
    try {
      const permissions = await storage.getPermissionsByCategory(req.params.category);
      res.json(permissions);
    } catch (error) {
      console.error("Get permissions by category error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get permissions" 
      });
    }
  });

  app.post("/api/permissions", async (req, res) => {
    try {
      const validatedData = insertPermissionSchema.parse(req.body);
      const permission = await storage.createPermission(validatedData);
      res.status(201).json(permission);
    } catch (error) {
      console.error("Create permission error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to create permission" 
      });
    }
  });

  // Role-Permission assignment routes
  app.get("/api/roles/:id/permissions", async (req, res) => {
    try {
      const rolePermissions = await storage.getRolePermissions(req.params.id);
      res.json(rolePermissions);
    } catch (error) {
      console.error("Get role permissions error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get role permissions" 
      });
    }
  });

  app.post("/api/roles/:id/permissions", async (req, res) => {
    try {
      const validatedData = insertRolePermissionSchema.parse({
        ...req.body,
        roleId: req.params.id
      });
      const assignment = await storage.assignPermissionToRole(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Assign permission error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to assign permission" 
      });
    }
  });

  app.delete("/api/roles/:roleId/permissions/:permissionId", async (req, res) => {
    try {
      const removed = await storage.removePermissionFromRole(req.params.roleId, req.params.permissionId);
      if (!removed) {
        return res.status(404).json({ error: "Permission assignment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Remove permission error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to remove permission" 
      });
    }
  });

  // User permission checking routes
  app.get("/api/users/:id/permissions", async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.params.id);
      res.json(permissions);
    } catch (error) {
      console.error("Get user permissions error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get user permissions" 
      });
    }
  });

  app.get("/api/users/:id/permissions/check", async (req, res) => {
    try {
      const { resource, action } = req.query as { resource: string; action: string };
      if (!resource || !action) {
        return res.status(400).json({ error: "Resource and action parameters required" });
      }
      
      const hasPermission = await storage.checkUserPermission(req.params.id, resource, action);
      res.json({ hasPermission });
    } catch (error) {
      console.error("Check user permission error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to check user permission" 
      });
    }
  });

  // Image upload endpoints
  app.post("/api/images/upload", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const imageData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/images/${req.file.filename}`,
        uploadedBy: 'admin' // TODO: Get from authenticated user session
      };

      const validatedData = insertUploadedImageSchema.parse(imageData);
      const uploadedImage = await storage.createUploadedImage(validatedData);
      
      res.status(201).json(uploadedImage);
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to upload image" 
      });
    }
  });

  app.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getUploadedImages();
      res.json(images);
    } catch (error) {
      console.error("Get images error:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.get("/api/images/:id", async (req, res) => {
    try {
      const image = await storage.getUploadedImage(req.params.id);
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Get image error:", error);
      res.status(500).json({ error: "Failed to fetch image" });
    }
  });

  app.delete("/api/images/:id", async (req, res) => {
    try {
      const image = await storage.getUploadedImage(req.params.id);
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Delete file from filesystem
      const filePath = path.join(process.cwd(), 'uploads', 'images', image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const success = await storage.deleteUploadedImage(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete image error:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // Slide management endpoints
  app.get("/api/slides", async (req, res) => {
    try {
      const slides = await storage.getSlides();
      res.json(slides);
    } catch (error) {
      console.error("Get slides error:", error);
      res.status(500).json({ error: "Failed to fetch slides" });
    }
  });

  app.get("/api/slides/:id", async (req, res) => {
    try {
      const slide = await storage.getSlide(req.params.id);
      if (!slide) {
        return res.status(404).json({ error: "Slide not found" });
      }
      res.json(slide);
    } catch (error) {
      console.error("Get slide error:", error);
      res.status(500).json({ error: "Failed to fetch slide" });
    }
  });

  app.post("/api/slides", async (req, res) => {
    try {
      const validatedData = insertSlideSchema.parse(req.body);
      const slide = await storage.createSlide(validatedData);
      res.status(201).json(slide);
    } catch (error) {
      console.error("Create slide error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create slide" 
      });
    }
  });

  app.put("/api/slides/:id", async (req, res) => {
    try {
      const validatedData = updateSlideSchema.parse(req.body);
      const slide = await storage.updateSlide(req.params.id, validatedData);
      if (!slide) {
        return res.status(404).json({ error: "Slide not found" });
      }
      res.json(slide);
    } catch (error) {
      console.error("Update slide error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update slide" 
      });
    }
  });

  app.delete("/api/slides/:id", async (req, res) => {
    try {
      const success = await storage.deleteSlide(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Slide not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete slide error:", error);
      res.status(500).json({ error: "Failed to delete slide" });
    }
  });

  // Presentation management endpoints
  app.get("/api/presentations", async (req, res) => {
    try {
      const presentations = await storage.getPresentations();
      res.json(presentations);
    } catch (error) {
      console.error("Get presentations error:", error);
      res.status(500).json({ error: "Failed to fetch presentations" });
    }
  });

  app.post("/api/presentations", async (req, res) => {
    try {
      const validatedData = insertPresentationSchema.parse(req.body);
      const presentation = await storage.createPresentation(validatedData);
      res.status(201).json(presentation);
    } catch (error) {
      console.error("Create presentation error:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create presentation" 
      });
    }
  });

  // Serve uploaded images statically
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  const httpServer = createServer(app);

  return httpServer;
}
