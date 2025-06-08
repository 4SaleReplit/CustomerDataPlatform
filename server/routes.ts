import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { snowflakeService } from "./services/snowflake";
import { insertTeamSchema } from "@shared/schema";

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

  const httpServer = createServer(app);

  return httpServer;
}
