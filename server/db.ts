import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables for fallback database connection
dotenv.config();

// Dynamic database connection management
let currentPool: Pool | null = null;
let currentEnvironment = 'development'; // Default environment

// Fallback DATABASE_URL for initial connection
const FALLBACK_DATABASE_URL = process.env.DATABASE_URL;

if (!FALLBACK_DATABASE_URL) {
  console.error('DATABASE_URL not found in .env file. Please check your environment configuration.');
  throw new Error('DATABASE_URL is required for fallback database connection');
}

// Function to create a new pool with given connection string
function createPool(connectionString: string): Pool {
  return new Pool({ 
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: connectionString.includes('localhost') ? false : {
      rejectUnauthorized: false
    }
  });
}

// Function to switch database environment
export async function switchEnvironment(environment: string, connectionString: string): Promise<void> {
  console.log(`🔄 Switching to ${environment} environment...`);
  
  // Close current pool if exists
  if (currentPool) {
    await currentPool.end();
  }
  
  // Create new pool with environment-specific connection
  currentPool = createPool(connectionString);
  currentEnvironment = environment;
  
  // Test new connection
  try {
    const client = await currentPool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log(`✅ Successfully switched to ${environment} environment`);
    console.log(`🕐 Database time: ${result.rows[0]?.now}`);
    console.log(`🔗 Connection: ${connectionString.replace(/:[^:@]*@/, ':***@')}`);
  } catch (error) {
    console.error(`❌ Failed to connect to ${environment} environment:`, error);
    throw error;
  }
}

// Function to get current active environment
export function getCurrentEnvironment(): string {
  return currentEnvironment;
}

// Initialize with fallback connection (Development environment)
console.log('Initializing with Development environment (fallback)');
console.log('Database URL configured:', FALLBACK_DATABASE_URL.replace(/:[^:@]*@/, ':***@'));

currentPool = createPool(FALLBACK_DATABASE_URL);

// Get the pool (always returns current active pool)
export const pool = new Proxy({} as Pool, {
  get(target, prop) {
    if (!currentPool) {
      throw new Error('Database pool not initialized');
    }
    return currentPool[prop as keyof Pool];
  }
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to Supabase database:', err);
  } else {
    console.log('✅ Successfully connected to Supabase database');
    client?.query('SELECT NOW()', (err, result) => {
      release();
      if (err) {
        console.error('Error executing test query:', err);
      } else {
        console.log('🕐 Database time:', result?.rows[0]?.now);
      }
    });
  }
});

export const db = drizzle(pool, { schema });