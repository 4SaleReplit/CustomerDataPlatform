import { 
  users, 
  team, 
  dashboardTileInstances,
  cohorts,
  segments,
  integrations,
  roles,
  permissions,
  rolePermissions,
  type User, 
  type InsertUser, 
  type Team, 
  type InsertTeam,
  type DashboardTileInstance,
  type InsertDashboardTileInstance,
  type Cohort,
  type InsertCohort,
  type UpdateCohort,
  type Segment,
  type InsertSegment,
  campaigns,
  type Campaign,
  type InsertCampaign,
  campaignJobs,
  type CampaignJob,
  type Integration,
  type InsertIntegration,
  type Role,
  type InsertRole,
  type UpdateRole,
  type Permission,
  type InsertPermission,
  type RolePermission,
  type InsertRolePermission
} from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Team management
  getTeamMembers(): Promise<Team[]>;
  getTeamMember(id: string): Promise<Team | undefined>;
  getTeamMemberByEmail(email: string): Promise<Team | undefined>;
  createTeamMember(member: InsertTeam): Promise<Team>;
  deleteTeamMember(id: string): Promise<boolean>;
  updateTeamMember(id: string, updates: Partial<InsertTeam>): Promise<Team | undefined>;
  updateTeamMemberPassword(id: string, passwordHash: string): Promise<boolean>;
  resetTeamMemberPassword(id: string): Promise<{ password: string; success: boolean }>;
  
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
  
  // Segment management
  getSegments(): Promise<Segment[]>;
  getSegment(id: string): Promise<Segment | undefined>;
  createSegment(segment: InsertSegment): Promise<Segment>;
  updateSegment(id: string, updates: Partial<InsertSegment>): Promise<Segment | undefined>;
  deleteSegment(id: string): Promise<boolean>;
  
  // Campaign management
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<boolean>;
  getCampaignJobs(campaignId: string): Promise<CampaignJob[]>;
  
  // Integration management
  getIntegrations(): Promise<Integration[]>;
  getIntegration(id: string): Promise<Integration | undefined>;
  getIntegrationByType(type: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, updates: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: string): Promise<boolean>;
  updateIntegrationLastUsed(id: string): Promise<void>;
  
  // Role management
  getRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, updates: UpdateRole): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;
  
  // Permission management
  getPermissions(): Promise<Permission[]>;
  getPermission(id: string): Promise<Permission | undefined>;
  getPermissionsByCategory(category: string): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  deletePermission(id: string): Promise<boolean>;
  
  // Role-Permission management
  getRolePermissions(roleId: string): Promise<RolePermission[]>;
  assignPermissionToRole(rolePermission: InsertRolePermission): Promise<RolePermission>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean>;
  getUserPermissions(userId: string): Promise<Permission[]>;
  checkUserPermission(userId: string, resource: string, action: string): Promise<boolean>;
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

  async getTeamMembers(): Promise<Team[]> {
    return await db.select().from(team).orderBy(team.createdAt);
  }

  async createTeamMember(insertTeam: InsertTeam): Promise<Team> {
    const [teamMember] = await db
      .insert(team)
      .values(insertTeam)
      .returning();
    return teamMember;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const result = await db
      .delete(team)
      .where(eq(team.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateTeamMember(id: string, updates: Partial<InsertTeam>): Promise<Team | undefined> {
    const [updatedMember] = await db
      .update(team)
      .set({ 
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(team.id, id))
      .returning();
    return updatedMember || undefined;
  }

  async updateTeamMemberPassword(id: string, passwordHash: string): Promise<boolean> {
    const result = await db
      .update(team)
      .set({ 
        passwordHash, 
        mustChangePassword: false,
        temporaryPassword: null,
        updatedAt: new Date()
      })
      .where(eq(team.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async resetTeamMemberPassword(id: string): Promise<{ password: string; success: boolean }> {
    // Generate secure temporary password
    const crypto = await import('crypto');
    const tempPassword = crypto.randomBytes(8).toString('base64').slice(0, 12) + '@1';
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const result = await db
      .update(team)
      .set({ 
        passwordHash,
        temporaryPassword: tempPassword,
        mustChangePassword: true,
        updatedAt: new Date()
      })
      .where(eq(team.id, id));

    const success = result.rowCount !== null && result.rowCount > 0;
    return { password: tempPassword, success };
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

  // Segment storage methods
  async getSegments(): Promise<Segment[]> {
    return await db.select().from(segments);
  }

  async getSegment(id: string): Promise<Segment | undefined> {
    const [segment] = await db.select().from(segments).where(eq(segments.id, id));
    return segment || undefined;
  }

  async createSegment(insertSegment: InsertSegment): Promise<Segment> {
    const now = new Date();
    const [segment] = await db
      .insert(segments)
      .values({
        ...insertSegment,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return segment;
  }

  async updateSegment(id: string, updates: Partial<InsertSegment>): Promise<Segment | undefined> {
    const [updatedSegment] = await db
      .update(segments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(segments.id, id))
      .returning();
    return updatedSegment || undefined;
  }

  async deleteSegment(id: string): Promise<boolean> {
    const result = await db
      .delete(segments)
      .where(eq(segments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Campaign management methods
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns);
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign || undefined;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(eq(campaigns.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getCampaignJobs(campaignId: string): Promise<CampaignJob[]> {
    return await db.select().from(campaignJobs).where(eq(campaignJobs.campaignId, campaignId));
  }

  // Integration management methods
  async getIntegrations(): Promise<Integration[]> {
    const allIntegrations = await db.select().from(integrations);
    return allIntegrations;
  }

  async getIntegration(id: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    return integration || undefined;
  }

  async getIntegrationByType(type: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations).where(eq(integrations.type, type));
    return integration || undefined;
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const [integration] = await db
      .insert(integrations)
      .values(insertIntegration)
      .returning();
    return integration;
  }

  async updateIntegration(id: string, updates: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const [integration] = await db
      .update(integrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return integration || undefined;
  }

  async deleteIntegration(id: string): Promise<boolean> {
    const result = await db.delete(integrations).where(eq(integrations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateIntegrationLastUsed(id: string): Promise<void> {
    await db
      .update(integrations)
      .set({ lastUsedAt: new Date(), updatedAt: new Date() })
      .where(eq(integrations.id, id));
  }

  // Role management methods
  async getRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(desc(roles.hierarchyLevel), roles.name);
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role || undefined;
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db
      .insert(roles)
      .values(insertRole)
      .returning();
    return role;
  }

  async updateRole(id: string, updates: UpdateRole): Promise<Role | undefined> {
    const [updatedRole] = await db
      .update(roles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updatedRole || undefined;
  }

  async deleteRole(id: string): Promise<boolean> {
    // Check if role is system role first
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    if (role?.isSystemRole) {
      throw new Error("Cannot delete system roles");
    }
    
    const result = await db
      .delete(roles)
      .where(and(eq(roles.id, id), eq(roles.isSystemRole, false)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Permission management methods
  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.category, permissions.name);
  }

  async getPermission(id: string): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission || undefined;
  }

  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    return await db.select().from(permissions).where(eq(permissions.category, category));
  }

  async createPermission(insertPermission: InsertPermission): Promise<Permission> {
    const [permission] = await db
      .insert(permissions)
      .values(insertPermission)
      .returning();
    return permission;
  }

  async deletePermission(id: string): Promise<boolean> {
    const result = await db
      .delete(permissions)
      .where(eq(permissions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Role-Permission management methods
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  }

  async assignPermissionToRole(rolePermission: InsertRolePermission): Promise<RolePermission> {
    const [assignment] = await db
      .insert(rolePermissions)
      .values(rolePermission)
      .returning();
    return assignment;
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
    const result = await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    // Get user's role first
    const [teamMember] = await db.select().from(team).where(eq(team.id, userId));
    if (!teamMember) return [];

    // Get role by name (assuming role field contains role name)
    const [userRole] = await db.select().from(roles).where(eq(roles.name, teamMember.role));
    if (!userRole) return [];

    // Get all permissions for this role
    const rolePermissionList = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, userRole.id));

    return rolePermissionList.map(rp => rp.permission);
  }

  async checkUserPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.some(p => p.resource === resource && p.action === action);
  }
}

export const storage = new DatabaseStorage();
