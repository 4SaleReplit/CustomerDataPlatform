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
  uploadedImages,
  slides,
  presentations,
  migrationHistory,
  scheduledReports,
  mailingLists,
  reportExecutions,
  templates,
  emailTemplates,
  sentEmails,
  monitoredEndpoints,
  endpointMonitoringHistory,
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
  type InsertRolePermission,
  type UploadedImage,
  type InsertUploadedImage,
  type Slide,
  type InsertSlide,
  type UpdateSlide,
  type Presentation,
  type InsertPresentation,
  type MonitoredEndpoint,
  type InsertMonitoredEndpoint,
  type UpdateMonitoredEndpoint,
  type EndpointMonitoringHistory,
  type InsertEndpointMonitoringHistory,
  type MigrationHistory,
  type InsertMigrationHistory,
  type UpdateMigrationHistory,
  type ScheduledReport,
  type InsertScheduledReport,
  type MailingList,
  type InsertMailingList,
  type ReportExecution,
  type InsertReportExecution,
  type Template,
  type InsertTemplate,
  type EmailTemplate,
  type InsertEmailTemplate,
  type SentEmail,
  type InsertSentEmail
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
  updateTileLastRefresh(tileId: string, lastRefreshAt: Date): Promise<void>;
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
  
  // Migration History management
  getMigrationHistory(): Promise<MigrationHistory[]>;
  getMigrationHistoryById(id: string): Promise<MigrationHistory | undefined>;
  getMigrationHistoryBySessionId(sessionId: string): Promise<MigrationHistory | undefined>;
  createMigrationHistory(migration: InsertMigrationHistory): Promise<MigrationHistory>;
  updateMigrationHistory(id: string, updates: UpdateMigrationHistory): Promise<MigrationHistory | undefined>;
  deleteMigrationHistory(id: string): Promise<boolean>;
  
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
  
  // Image management
  getUploadedImages(): Promise<UploadedImage[]>;
  getUploadedImage(id: string): Promise<UploadedImage | undefined>;
  createUploadedImage(image: InsertUploadedImage): Promise<UploadedImage>;
  deleteUploadedImage(id: string): Promise<boolean>;
  
  // Slide management
  getSlides(): Promise<Slide[]>;
  getSlide(id: string): Promise<Slide | undefined>;
  createSlide(slide: InsertSlide): Promise<Slide>;
  updateSlide(id: string, updates: UpdateSlide): Promise<Slide | undefined>;
  deleteSlide(id: string): Promise<boolean>;
  
  // Presentation management
  getPresentations(): Promise<Presentation[]>;
  getPresentation(id: string): Promise<Presentation | undefined>;
  getPresentationById(id: string): Promise<Presentation | undefined>;
  createPresentation(presentation: InsertPresentation): Promise<Presentation>;
  updatePresentation(id: string, updates: Partial<InsertPresentation>): Promise<Presentation | undefined>;
  deletePresentation(id: string): Promise<boolean>;
  
  // Scheduled Reports management
  getScheduledReports(): Promise<ScheduledReport[]>;
  getScheduledReport(id: string): Promise<ScheduledReport | undefined>;
  getScheduledReportById(id: string): Promise<ScheduledReport | undefined>;
  createScheduledReport(report: InsertScheduledReport): Promise<ScheduledReport>;
  updateScheduledReport(id: string, updates: Partial<InsertScheduledReport>): Promise<ScheduledReport | undefined>;
  deleteScheduledReport(id: string): Promise<boolean>;
  
  // Mailing Lists management
  getMailingLists(): Promise<MailingList[]>;
  getMailingListById(id: string): Promise<MailingList | undefined>;
  createMailingList(mailingList: InsertMailingList): Promise<MailingList>;
  updateMailingList(id: string, updates: Partial<InsertMailingList>): Promise<MailingList | undefined>;
  deleteMailingList(id: string): Promise<boolean>;
  
  // Report Executions management
  getReportExecutions(scheduledReportId: string): Promise<ReportExecution[]>;
  getReportExecution(id: string): Promise<ReportExecution | undefined>;
  createReportExecution(execution: InsertReportExecution): Promise<ReportExecution>;
  updateReportExecution(id: string, updates: Partial<InsertReportExecution>): Promise<ReportExecution | undefined>;
  deleteReportExecution(id: string): Promise<boolean>;
  
  // Template management
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, updates: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: string): Promise<boolean>;
  
  // Email Templates management
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<boolean>;
  
  // Sent Emails management
  getSentEmails(): Promise<SentEmail[]>;
  getSentEmail(id: string): Promise<SentEmail | undefined>;
  createSentEmail(sentEmail: InsertSentEmail): Promise<SentEmail>;
  getSentEmailsByRecipient(email: string): Promise<SentEmail[]>;
  getSentEmailsByType(emailType: string): Promise<SentEmail[]>;

  // Endpoint monitoring management
  getMonitoredEndpoints(): Promise<MonitoredEndpoint[]>;
  getMonitoredEndpoint(id: string): Promise<MonitoredEndpoint | undefined>;
  createMonitoredEndpoint(endpoint: InsertMonitoredEndpoint): Promise<MonitoredEndpoint>;
  updateMonitoredEndpoint(id: string, updates: UpdateMonitoredEndpoint): Promise<MonitoredEndpoint | undefined>;
  deleteMonitoredEndpoint(id: string): Promise<boolean>;
  getEndpointMonitoringHistory(endpointId: string): Promise<EndpointMonitoringHistory[]>;
  createEndpointMonitoringHistory(history: InsertEndpointMonitoringHistory): Promise<EndpointMonitoringHistory>;
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

  async updateTileLastRefresh(tileId: string, lastRefreshAt: Date): Promise<void> {
    await db
      .update(dashboardTileInstances)
      .set({ lastRefreshAt, updatedAt: new Date() })
      .where(eq(dashboardTileInstances.tileId, tileId));
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

  async getIntegrationById(id: string): Promise<Integration | undefined> {
    return this.getIntegration(id);
  }

  async getIntegrationsByType(type: string): Promise<Integration[]> {
    return await db.select().from(integrations).where(eq(integrations.type, type));
  }

  async getActiveIntegrationByType(type: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations)
      .where(and(eq(integrations.type, type), eq(integrations.status, 'connected')));
    return integration || undefined;
  }

  async getIntegrationByType(type: string): Promise<Integration | undefined> {
    // Return the first connected integration of this type for backward compatibility
    return this.getActiveIntegrationByType(type);
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    try {
      console.log("Storage: Creating integration with:", JSON.stringify(insertIntegration, null, 2));
      
      // Ensure credentials is a proper JSON object
      if (insertIntegration.credentials && typeof insertIntegration.credentials === 'object') {
        console.log("Storage: Credentials type:", typeof insertIntegration.credentials);
        console.log("Storage: Credentials content:", insertIntegration.credentials);
      }

      const [integration] = await db
        .insert(integrations)
        .values(insertIntegration)
        .returning();
      
      console.log("Storage: Integration created successfully with ID:", integration.id);
      return integration;
    } catch (error) {
      console.error("Storage: Database insertion error:", error);
      throw error;
    }
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

  // Image management methods
  async getUploadedImages(): Promise<UploadedImage[]> {
    return await db.select().from(uploadedImages).orderBy(desc(uploadedImages.createdAt));
  }

  async getUploadedImage(id: string): Promise<UploadedImage | undefined> {
    const [image] = await db.select().from(uploadedImages).where(eq(uploadedImages.id, id));
    return image || undefined;
  }

  async createUploadedImage(insertImage: InsertUploadedImage): Promise<UploadedImage> {
    const [image] = await db.insert(uploadedImages).values(insertImage).returning();
    return image;
  }

  async deleteUploadedImage(id: string): Promise<boolean> {
    const result = await db.delete(uploadedImages).where(eq(uploadedImages.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Slide management methods
  async getSlides(): Promise<Slide[]> {
    return await db.select().from(slides).orderBy(slides.order, desc(slides.createdAt));
  }

  async getSlide(id: string): Promise<Slide | undefined> {
    const [slide] = await db.select().from(slides).where(eq(slides.id, id));
    return slide || undefined;
  }

  async createSlide(insertSlide: InsertSlide): Promise<Slide> {
    const [slide] = await db.insert(slides).values(insertSlide).returning();
    return slide;
  }

  async updateSlide(id: string, updates: UpdateSlide): Promise<Slide | undefined> {
    const [slide] = await db
      .update(slides)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(slides.id, id))
      .returning();
    return slide || undefined;
  }

  async deleteSlide(id: string): Promise<boolean> {
    const result = await db.delete(slides).where(eq(slides.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Presentation management methods
  async getPresentations(): Promise<Presentation[]> {
    return await db.select().from(presentations).orderBy(desc(presentations.createdAt));
  }

  async getPresentation(id: string): Promise<Presentation | undefined> {
    const [presentation] = await db.select().from(presentations).where(eq(presentations.id, id));
    return presentation || undefined;
  }

  async createPresentation(insertPresentation: InsertPresentation): Promise<Presentation> {
    const [presentation] = await db.insert(presentations).values(insertPresentation).returning();
    return presentation;
  }

  async updatePresentation(id: string, updates: Partial<InsertPresentation>): Promise<Presentation | undefined> {
    const [presentation] = await db
      .update(presentations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(presentations.id, id))
      .returning();
    return presentation || undefined;
  }

  async deletePresentation(id: string): Promise<boolean> {
    const result = await db.delete(presentations).where(eq(presentations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Migration History methods
  async getMigrationHistory(): Promise<MigrationHistory[]> {
    return await db.select().from(migrationHistory).orderBy(desc(migrationHistory.createdAt));
  }

  async getMigrationHistoryById(id: string): Promise<MigrationHistory | undefined> {
    const [migration] = await db.select().from(migrationHistory).where(eq(migrationHistory.id, id));
    return migration || undefined;
  }

  async getMigrationHistoryBySessionId(sessionId: string): Promise<MigrationHistory | undefined> {
    const [migration] = await db.select().from(migrationHistory).where(eq(migrationHistory.sessionId, sessionId));
    return migration || undefined;
  }

  async createMigrationHistory(migration: InsertMigrationHistory): Promise<MigrationHistory> {
    const [newMigration] = await db.insert(migrationHistory).values(migration).returning();
    return newMigration;
  }

  async updateMigrationHistory(id: string, updates: UpdateMigrationHistory): Promise<MigrationHistory | undefined> {
    const [migration] = await db
      .update(migrationHistory)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(migrationHistory.id, id))
      .returning();
    return migration || undefined;
  }

  async deleteMigrationHistory(id: string): Promise<boolean> {
    const result = await db.delete(migrationHistory).where(eq(migrationHistory.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Presentation management methods
  async getPresentationById(id: string): Promise<Presentation | undefined> {
    const [presentation] = await db.select().from(presentations).where(eq(presentations.id, id));
    return presentation || undefined;
  }

  // Scheduled Reports management methods
  async getScheduledReports(): Promise<ScheduledReport[]> {
    return await db.select().from(scheduledReports).orderBy(desc(scheduledReports.createdAt));
  }

  async getScheduledReport(id: string): Promise<ScheduledReport | undefined> {
    const [report] = await db.select().from(scheduledReports).where(eq(scheduledReports.id, id));
    return report || undefined;
  }

  async getScheduledReportById(id: string): Promise<ScheduledReport | undefined> {
    const [report] = await db.select().from(scheduledReports).where(eq(scheduledReports.id, id));
    return report || undefined;
  }

  async createScheduledReport(report: InsertScheduledReport): Promise<ScheduledReport> {
    const [newReport] = await db.insert(scheduledReports).values(report).returning();
    return newReport;
  }

  async updateScheduledReport(id: string, updates: Partial<InsertScheduledReport>): Promise<ScheduledReport | undefined> {
    const [report] = await db
      .update(scheduledReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scheduledReports.id, id))
      .returning();
    return report || undefined;
  }

  async deleteScheduledReport(id: string): Promise<boolean> {
    const result = await db.delete(scheduledReports).where(eq(scheduledReports.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Mailing Lists management methods
  async getMailingLists(): Promise<MailingList[]> {
    return await db.select().from(mailingLists).orderBy(desc(mailingLists.createdAt));
  }

  async getMailingListById(id: string): Promise<MailingList | undefined> {
    const [mailingList] = await db.select().from(mailingLists).where(eq(mailingLists.id, id));
    return mailingList || undefined;
  }

  async createMailingList(mailingList: InsertMailingList): Promise<MailingList> {
    const [newList] = await db.insert(mailingLists).values(mailingList).returning();
    return newList;
  }

  async updateMailingList(id: string, updates: Partial<InsertMailingList>): Promise<MailingList | undefined> {
    const [mailingList] = await db
      .update(mailingLists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mailingLists.id, id))
      .returning();
    return mailingList || undefined;
  }

  async deleteMailingList(id: string): Promise<boolean> {
    const result = await db.delete(mailingLists).where(eq(mailingLists.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Report Executions management methods
  async getReportExecutions(scheduledReportId: string): Promise<ReportExecution[]> {
    return await db
      .select()
      .from(reportExecutions)
      .where(eq(reportExecutions.scheduledReportId, scheduledReportId))
      .orderBy(desc(reportExecutions.createdAt));
  }

  async getReportExecution(id: string): Promise<ReportExecution | undefined> {
    const [execution] = await db.select().from(reportExecutions).where(eq(reportExecutions.id, id));
    return execution || undefined;
  }

  async createReportExecution(execution: InsertReportExecution): Promise<ReportExecution> {
    const [newExecution] = await db.insert(reportExecutions).values(execution).returning();
    return newExecution;
  }

  async updateReportExecution(id: string, updates: Partial<InsertReportExecution>): Promise<ReportExecution | undefined> {
    const [execution] = await db
      .update(reportExecutions)
      .set(updates)
      .where(eq(reportExecutions.id, id))
      .returning();
    return execution || undefined;
  }

  async deleteReportExecution(id: string): Promise<boolean> {
    const result = await db.delete(reportExecutions).where(eq(reportExecutions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Template management methods
  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(desc(templates.createdAt));
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [template] = await db
      .update(templates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Email Templates management methods
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template || undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteEmailTemplate(id: string): Promise<boolean> {
    const result = await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Endpoint monitoring management methods
  async getMonitoredEndpoints(): Promise<MonitoredEndpoint[]> {
    return await db.select().from(monitoredEndpoints).orderBy(desc(monitoredEndpoints.createdAt));
  }

  async getMonitoredEndpoint(id: string): Promise<MonitoredEndpoint | undefined> {
    const [endpoint] = await db.select().from(monitoredEndpoints).where(eq(monitoredEndpoints.id, id));
    return endpoint || undefined;
  }

  async createMonitoredEndpoint(endpoint: InsertMonitoredEndpoint): Promise<MonitoredEndpoint> {
    const [newEndpoint] = await db.insert(monitoredEndpoints).values(endpoint).returning();
    return newEndpoint;
  }

  async updateMonitoredEndpoint(id: string, updates: UpdateMonitoredEndpoint): Promise<MonitoredEndpoint | undefined> {
    const [endpoint] = await db
      .update(monitoredEndpoints)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(monitoredEndpoints.id, id))
      .returning();
    return endpoint || undefined;
  }

  async deleteMonitoredEndpoint(id: string): Promise<boolean> {
    const result = await db.delete(monitoredEndpoints).where(eq(monitoredEndpoints.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getEndpointMonitoringHistory(endpointId: string): Promise<EndpointMonitoringHistory[]> {
    return await db
      .select()
      .from(endpointMonitoringHistory)
      .where(eq(endpointMonitoringHistory.endpointId, endpointId))
      .orderBy(desc(endpointMonitoringHistory.checkedAt))
      .limit(100);
  }

  async createEndpointMonitoringHistory(history: InsertEndpointMonitoringHistory): Promise<EndpointMonitoringHistory> {
    const [newHistory] = await db.insert(endpointMonitoringHistory).values(history).returning();
    return newHistory;
  }

  // Sent Emails management methods
  async getSentEmails(): Promise<SentEmail[]> {
    const result = await db.select().from(sentEmails).orderBy(desc(sentEmails.createdAt));
    return result;
  }

  async getSentEmail(id: string): Promise<SentEmail | undefined> {
    const [result] = await db.select().from(sentEmails).where(eq(sentEmails.id, id));
    return result || undefined;
  }

  async createSentEmail(sentEmailData: InsertSentEmail): Promise<SentEmail> {
    const [result] = await db.insert(sentEmails).values(sentEmailData).returning();
    return result;
  }

  async updateSentEmail(id: string, updates: Partial<SentEmail>): Promise<SentEmail | undefined> {
    const [result] = await db.update(sentEmails)
      .set(updates)
      .where(eq(sentEmails.id, id))
      .returning();
    return result || undefined;
  }

  async getSentEmailsByType(emailType: string): Promise<SentEmail[]> {
    const result = await db.select().from(sentEmails)
      .where(eq(sentEmails.emailType, emailType))
      .orderBy(desc(sentEmails.createdAt));
    return result;
  }

  async getSentEmailsByRecipient(email: string): Promise<SentEmail[]> {
    // For JSONB field search, we need to use SQL-like patterns
    const result = await db.select().from(sentEmails)
      .orderBy(desc(sentEmails.createdAt));
    // Filter in memory for now - could be optimized with raw SQL if needed
    return result.filter(sentEmail => {
      const recipients = Array.isArray(sentEmail.recipients) ? 
        sentEmail.recipients : 
        JSON.parse(sentEmail.recipients as string);
      return recipients.includes(email);
    });
  }
}

export const storage = new DatabaseStorage();
