import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCohortSchema, insertPromotionSchema } from "@shared/schema";
import { z } from "zod";

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    // Simple auth check - in production this would verify JWT
    const user = req.session?.user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    req.user = user;
    next();
  };

  // Login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt:', { email, password: password ? '***' : 'missing' });
      
      // Handle demo credentials
      if (email === "admin@example.com" && password === "password") {
        const user = { 
          id: 1, 
          username: "admin", 
          email: "admin@example.com", 
          role: "super_admin" 
        };
        
        req.session.user = user;
        console.log('Demo user session created:', req.session.user);

        return res.json({ user });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.is_active) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In production, verify password hash
      if (password !== "password") {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUser(user.id, { last_login: new Date() });

      req.session.user = { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      };

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error: error.message });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", (req, res) => {
    const user = req.session?.user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user });
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", requireAuth, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics", error: error.message });
    }
  });

  // CDP Users routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const filter = req.query.filter as string;

      const result = await storage.getCdpUsers(page, limit, search, filter);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getCdpUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user", error: error.message });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const user = await storage.updateCdpUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user", error: error.message });
    }
  });

  // Cohorts routes
  app.get("/api/cohorts", requireAuth, async (req, res) => {
    try {
      const cohorts = await storage.getCohorts();
      res.json(cohorts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cohorts", error: error.message });
    }
  });

  app.get("/api/cohorts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cohort = await storage.getCohort(id);
      
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }

      res.json(cohort);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cohort", error: error.message });
    }
  });

  app.post("/api/cohorts", requireAuth, async (req, res) => {
    try {
      const data = insertCohortSchema.parse(req.body);
      const cohort = await storage.createCohort({
        ...data,
        created_by: req.user.id
      });
      res.status(201).json(cohort);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create cohort", error: error.message });
    }
  });

  app.patch("/api/cohorts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const cohort = await storage.updateCohort(id, updates);
      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }

      res.json(cohort);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cohort", error: error.message });
    }
  });

  app.delete("/api/cohorts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCohort(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Cohort not found" });
      }

      res.json({ message: "Cohort deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cohort", error: error.message });
    }
  });

  app.post("/api/cohorts/:id/sync", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { target } = req.body;

      // Update last synced timestamp
      const cohort = await storage.updateCohort(id, { 
        last_synced: new Date() 
      });

      if (!cohort) {
        return res.status(404).json({ message: "Cohort not found" });
      }

      res.json({ message: `Cohort synced to ${target} successfully`, cohort });
    } catch (error) {
      res.status(500).json({ message: "Failed to sync cohort", error: error.message });
    }
  });

  // Promotions routes
  app.get("/api/promotions", requireAuth, async (req, res) => {
    try {
      const promotions = await storage.getPromotions();
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotions", error: error.message });
    }
  });

  app.get("/api/promotions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const promotion = await storage.getPromotion(id);
      
      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }

      res.json(promotion);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotion", error: error.message });
    }
  });

  app.post("/api/promotions", requireAuth, async (req, res) => {
    try {
      const data = insertPromotionSchema.parse(req.body);
      const promotion = await storage.createPromotion({
        ...data,
        created_by: req.user.id
      });
      res.status(201).json(promotion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create promotion", error: error.message });
    }
  });

  app.patch("/api/promotions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const promotion = await storage.updatePromotion(id, updates);
      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }

      res.json(promotion);
    } catch (error) {
      res.status(500).json({ message: "Failed to update promotion", error: error.message });
    }
  });

  app.delete("/api/promotions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePromotion(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Promotion not found" });
      }

      res.json({ message: "Promotion deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete promotion", error: error.message });
    }
  });

  // Integrations routes
  app.get("/api/integrations", requireAuth, async (req, res) => {
    try {
      const integrations = await storage.getIntegrations();
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch integrations", error: error.message });
    }
  });

  app.patch("/api/integrations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const integration = await storage.updateIntegration(id, updates);
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      res.json(integration);
    } catch (error) {
      res.status(500).json({ message: "Failed to update integration", error: error.message });
    }
  });

  // Platform users management (admin)
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platform users", error: error.message });
    }
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    try {
      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user", error: error.message });
    }
  });

  app.patch("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const id = parseInt(req.params.id);
      const updates = req.body;

      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
