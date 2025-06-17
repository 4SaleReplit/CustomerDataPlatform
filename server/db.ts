import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables for production database connection
dotenv.config();

// Configure Neon for serverless environments
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

// Use .env DATABASE_URL for production database connection
// All other integrations are managed through database-stored credentials
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.oolcnbxrnuefxfdpvsfn:dsadasSDASdsaDASDASasdsadas3434@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";

console.log('Using production database from .env file for application connection');

// Create pool with production database connection
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle({ client: pool, schema });