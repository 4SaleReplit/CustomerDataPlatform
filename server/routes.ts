import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { snowflakeService } from "./services/snowflake";
import { insertTeamSchema, insertDashboardTileInstanceSchema, insertCohortSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const cohort = await storage.createCohort(validatedData);
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

  const httpServer = createServer(app);

  return httpServer;
}
