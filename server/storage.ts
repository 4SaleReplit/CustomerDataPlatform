import { 
  users, 
  team, 
  dashboardTileInstances,
  cohorts,
  type User, 
  type InsertUser, 
  type Team, 
  type InsertTeam,
  type DashboardTileInstance,
  type InsertDashboardTileInstance,
  type Cohort,
  type InsertCohort,
  type UpdateCohort
} from "@shared/schema";
import { db } from "./db";
import { eq, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Team management
  getTeamMember(id: string): Promise<Team | undefined>;
  getTeamMemberByEmail(email: string): Promise<Team | undefined>;
  createTeamMember(member: InsertTeam): Promise<Team>;
  
  // Dashboard tile management
  getDashboardTiles(dashboardId?: string): Promise<DashboardTileInstance[]>;
  createDashboardTile(tile: InsertDashboardTileInstance): Promise<DashboardTileInstance>;
  updateDashboardTile(tileId: string, updates: Partial<InsertDashboardTileInstance>): Promise<DashboardTileInstance | undefined>;
  deleteDashboardTile(tileId: string): Promise<boolean>;
  saveDashboardLayout(tiles: InsertDashboardTileInstance[]): Promise<DashboardTileInstance[]>;
  
  // Cohort management
  getCohorts(): Promise<Cohort[]>;
  getCohort(id: string): Promise<Cohort | undefined>;
  createCohort(cohort: InsertCohort): Promise<Cohort>;
  updateCohort(id: string, updates: UpdateCohort): Promise<Cohort | undefined>;
  deleteCohort(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getTeamMember(id: string): Promise<Team | undefined> {
    const [member] = await db.select().from(team).where(eq(team.id, id));
    return member || undefined;
  }

  async getTeamMemberByEmail(email: string): Promise<Team | undefined> {
    const [member] = await db.select().from(team).where(eq(team.email, email));
    return member || undefined;
  }

  async createTeamMember(insertTeam: InsertTeam): Promise<Team> {
    const [member] = await db
      .insert(team)
      .values(insertTeam)
      .returning();
    return member;
  }

  async getDashboardTiles(dashboardId?: string): Promise<DashboardTileInstance[]> {
    if (dashboardId) {
      return await db.select().from(dashboardTileInstances).where(eq(dashboardTileInstances.dashboardId, dashboardId));
    }
    return await db.select().from(dashboardTileInstances);
  }

  async createDashboardTile(tile: InsertDashboardTileInstance): Promise<DashboardTileInstance> {
    const [newTile] = await db
      .insert(dashboardTileInstances)
      .values(tile)
      .returning();
    return newTile;
  }

  async updateDashboardTile(tileId: string, updates: Partial<InsertDashboardTileInstance>): Promise<DashboardTileInstance | undefined> {
    const [updatedTile] = await db
      .update(dashboardTileInstances)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dashboardTileInstances.tileId, tileId))
      .returning();
    return updatedTile;
  }

  async deleteDashboardTile(tileId: string): Promise<boolean> {
    const result = await db
      .delete(dashboardTileInstances)
      .where(eq(dashboardTileInstances.tileId, tileId));
    return (result.rowCount || 0) > 0;
  }

  async saveDashboardLayout(tiles: InsertDashboardTileInstance[]): Promise<DashboardTileInstance[]> {
    const savedTiles: DashboardTileInstance[] = [];
    const incomingTileIds = tiles.map(t => t.tileId);
    
    // Get all existing tiles
    const existingTiles = await db
      .select()
      .from(dashboardTileInstances);
    
    // Delete tiles that are no longer in the layout
    const tilesToDelete = existingTiles
      .filter(existing => !incomingTileIds.includes(existing.tileId))
      .map(tile => tile.tileId);
    
    // Delete tiles that are no longer in the layout one by one
    for (const tileId of tilesToDelete) {
      await db
        .delete(dashboardTileInstances)
        .where(eq(dashboardTileInstances.tileId, tileId));
    }
    
    // Process incoming tiles (update existing or create new)
    for (const tile of tiles) {
      const existing = existingTiles.find(e => e.tileId === tile.tileId);
      
      if (existing) {
        // Update existing tile
        const [updated] = await db
          .update(dashboardTileInstances)
          .set({ ...tile, updatedAt: new Date() })
          .where(eq(dashboardTileInstances.tileId, tile.tileId))
          .returning();
        savedTiles.push(updated);
      } else {
        // Create new tile
        const [created] = await db
          .insert(dashboardTileInstances)
          .values(tile)
          .returning();
        savedTiles.push(created);
      }
    }
    
    return savedTiles;
  }

  // Cohort management methods
  async getCohorts(): Promise<Cohort[]> {
    return await db.select().from(cohorts);
  }

  async getCohort(id: string): Promise<Cohort | undefined> {
    const [cohort] = await db.select().from(cohorts).where(eq(cohorts.id, id));
    return cohort || undefined;
  }

  async createCohort(insertCohort: InsertCohort): Promise<Cohort> {
    const now = new Date();
    const [cohort] = await db
      .insert(cohorts)
      .values({
        ...insertCohort,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return cohort;
  }

  async updateCohort(id: string, updates: UpdateCohort): Promise<Cohort | undefined> {
    const [updatedCohort] = await db
      .update(cohorts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cohorts.id, id))
      .returning();
    return updatedCohort || undefined;
  }

  async deleteCohort(id: string): Promise<boolean> {
    const result = await db
      .delete(cohorts)
      .where(eq(cohorts.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
