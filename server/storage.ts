import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, asc, count, sql, and, or, like, ilike } from "drizzle-orm";
import { 
  users, 
  cdpUsers, 
  cohorts, 
  promotions, 
  integrations,
  type User, 
  type InsertUser, 
  type CdpUser,
  type Cohort,
  type InsertCohort,
  type Promotion,
  type InsertPromotion,
  type Integration,
  type InsertIntegration
} from "@shared/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}
const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  // Platform users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // CDP Users (marketplace users)
  getCdpUsers(page: number, limit: number, search?: string, filter?: string): Promise<{ users: CdpUser[], total: number }>;
  getCdpUser(id: number): Promise<CdpUser | undefined>;
  updateCdpUser(id: number, user: Partial<CdpUser>): Promise<CdpUser | undefined>;
  getDashboardMetrics(): Promise<any>;

  // Cohorts
  getCohorts(): Promise<Cohort[]>;
  getCohort(id: string): Promise<Cohort | undefined>;
  createCohort(cohort: InsertCohort): Promise<Cohort>;
  updateCohort(id: string, cohort: Partial<InsertCohort>): Promise<Cohort | undefined>;
  deleteCohort(id: string): Promise<boolean>;

  // Promotions
  getPromotions(): Promise<Promotion[]>;
  getPromotion(id: string): Promise<Promotion | undefined>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: string, promotion: Partial<InsertPromotion>): Promise<Promotion | undefined>;
  deletePromotion(id: string): Promise<boolean>;

  // Integrations
  getIntegrations(): Promise<Integration[]>;
  updateIntegration(id: number, integration: Partial<InsertIntegration>): Promise<Integration | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Platform users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.created_at));
  }

  // CDP Users
  async getCdpUsers(page: number, limit: number, search?: string, filter?: string): Promise<{ users: CdpUser[], total: number }> {
    const offset = (page - 1) * limit;
    let query = db.select().from(cdpUsers);
    let countQuery = db.select({ count: count() }).from(cdpUsers);

    if (search) {
      const searchCondition = or(
        sql`CAST(${cdpUsers.user_id} AS TEXT) LIKE ${`%${search}%`}`,
        sql`CAST(${cdpUsers.phone} AS TEXT) LIKE ${`%${search}%`}`
      );
      query = query.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }

    if (filter && filter !== 'all') {
      let filterCondition;
      switch (filter) {
        case 'active':
          filterCondition = and(
            eq(cdpUsers.is_block, 0),
            sql`${cdpUsers.days_since_last_transaction} <= 30`
          );
          break;
        case 'churned':
          filterCondition = sql`${cdpUsers.days_since_last_transaction} > 30`;
          break;
        case 'high_value':
          filterCondition = sql`${cdpUsers.total_credits_spent} > 10000`;
          break;
      }
      if (filterCondition) {
        query = query.where(filterCondition);
        countQuery = countQuery.where(filterCondition);
      }
    }

    const [usersResult, totalResult] = await Promise.all([
      query.offset(offset).limit(limit).orderBy(desc(cdpUsers.user_id)),
      countQuery
    ]);

    return {
      users: usersResult,
      total: totalResult[0].count as number
    };
  }

  async getCdpUser(id: number): Promise<CdpUser | undefined> {
    const result = await db.select().from(cdpUsers).where(eq(cdpUsers.user_id, id)).limit(1);
    return result[0];
  }

  async updateCdpUser(id: number, user: Partial<CdpUser>): Promise<CdpUser | undefined> {
    const result = await db.update(cdpUsers).set(user).where(eq(cdpUsers.user_id, id)).returning();
    return result[0];
  }

  async getDashboardMetrics(): Promise<any> {
    // Calculate metrics from the CDP users data
    const totalUsers = await db.select({ count: count() }).from(cdpUsers);
    
    const activeUsers = await db.select({ count: count() }).from(cdpUsers)
      .where(and(
        eq(cdpUsers.is_block, 0),
        sql`${cdpUsers.days_since_last_transaction} <= 1`
      ));

    const weeklyActiveUsers = await db.select({ count: count() }).from(cdpUsers)
      .where(and(
        eq(cdpUsers.is_block, 0),
        sql`${cdpUsers.days_since_last_transaction} <= 7`
      ));

    const monthlyActiveUsers = await db.select({ count: count() }).from(cdpUsers)
      .where(and(
        eq(cdpUsers.is_block, 0),
        sql`${cdpUsers.days_since_last_transaction} <= 30`
      ));

    const churnedUsers = await db.select({ count: count() }).from(cdpUsers)
      .where(sql`${cdpUsers.days_since_last_transaction} > 30`);

    const newUsers = await db.select({ count: count() }).from(cdpUsers)
      .where(sql`${cdpUsers.user_account_creation_date} >= CURRENT_DATE - INTERVAL '7 days'`);

    return {
      dau: activeUsers[0].count,
      wau: weeklyActiveUsers[0].count,
      mau: monthlyActiveUsers[0].count,
      churn: churnedUsers[0].count,
      newUsers: newUsers[0].count,
      totalUsers: totalUsers[0].count,
      stickinessRatio: Math.round((activeUsers[0].count as number / monthlyActiveUsers[0].count as number) * 100),
      averageSessionDuration: "8m 42s", // This would come from analytics data
      conversionRate: "15.7%", // This would come from analytics data
      totalProfiles: totalUsers[0].count,
      matchRate: "98.7%", // This would come from data quality metrics
      eventsPerHour: "45.2K" // This would come from real-time analytics
    };
  }

  // Cohorts
  async getCohorts(): Promise<Cohort[]> {
    return await db.select().from(cohorts).orderBy(desc(cohorts.created_at));
  }

  async getCohort(id: number): Promise<Cohort | undefined> {
    const result = await db.select().from(cohorts).where(eq(cohorts.id, id)).limit(1);
    return result[0];
  }

  async createCohort(cohort: InsertCohort): Promise<Cohort> {
    const result = await db.insert(cohorts).values(cohort).returning();
    return result[0];
  }

  async updateCohort(id: number, cohort: Partial<InsertCohort>): Promise<Cohort | undefined> {
    const result = await db.update(cohorts).set({
      ...cohort,
      updated_at: new Date()
    }).where(eq(cohorts.id, id)).returning();
    return result[0];
  }

  async deleteCohort(id: number): Promise<boolean> {
    const result = await db.delete(cohorts).where(eq(cohorts.id, id));
    return result.length > 0;
  }

  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    return await db.select().from(promotions).orderBy(desc(promotions.created_at));
  }

  async getPromotion(id: number): Promise<Promotion | undefined> {
    const result = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
    return result[0];
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const result = await db.insert(promotions).values(promotion).returning();
    return result[0];
  }

  async updatePromotion(id: number, promotion: Partial<InsertPromotion>): Promise<Promotion | undefined> {
    const result = await db.update(promotions).set(promotion).where(eq(promotions.id, id)).returning();
    return result[0];
  }

  async deletePromotion(id: number): Promise<boolean> {
    const result = await db.delete(promotions).where(eq(promotions.id, id));
    return result.length > 0;
  }

  // Integrations
  async getIntegrations(): Promise<Integration[]> {
    return await db.select().from(integrations).orderBy(asc(integrations.name));
  }

  async updateIntegration(id: number, integration: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const result = await db.update(integrations).set({
      ...integration,
      updated_at: new Date()
    }).where(eq(integrations.id, id)).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
