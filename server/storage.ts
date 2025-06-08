import { users, team, type User, type InsertUser, type Team, type InsertTeam } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Team management
  getTeamMember(id: string): Promise<Team | undefined>;
  getTeamMemberByEmail(email: string): Promise<Team | undefined>;
  createTeamMember(member: InsertTeam): Promise<Team>;
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
}

export const storage = new DatabaseStorage();
