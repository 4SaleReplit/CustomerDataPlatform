import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables for fallback database connection
dotenv.config();

// Dynamic database connection management
let currentPool: Pool | null = null;
let currentEnvironment = 'development'; // Default environment

// Use stable Neon database with optimized connection settings
const FALLBACK_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gIzCkd5m0qUn@ep-aged-dawn-a6h96cw4.us-west-2.aws.neon.tech/neondb?sslmode=require';

console.log('🔧 Using optimized database connection with enhanced pooling');

// Simplified direct connection approach
function createPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 60000,
    ssl: connectionString.includes('localhost') ? false : {
      rejectUnauthorized: false
    }
  });
}

// Function to switch database environment
export async function switchEnvironment(environment: string, connectionString: string): Promise<void> {
  console.log(`🔄 Switching to ${environment} environment...`);
  
  // Create new pool first
  const newPool = createPool(connectionString);
  
  // Test new connection before switching
  try {
    const client = await newPool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log(`✅ New ${environment} connection tested successfully`);
    console.log(`🕐 Database time: ${result.rows[0]?.now}`);
    
    // Close old pool after successful test
    if (currentPool) {
      try {
        await currentPool.end();
        console.log(`🔒 Closed previous database connection`);
      } catch (error) {
        console.log(`⚠️ Warning: Error closing previous pool:`, error);
      }
    }
    
    // Switch to new pool
    currentPool = newPool;
    currentEnvironment = environment;
    
    console.log(`✅ Successfully switched to ${environment} environment`);
    console.log(`🔗 Connection: ${connectionString.replace(/:[^:@]*@/, ':***@')}`);
  } catch (error) {
    // Clean up failed new pool
    try {
      await newPool.end();
    } catch (cleanupError) {
      console.log(`⚠️ Warning: Error cleaning up failed pool:`, cleanupError);
    }
    
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

// Handle pool errors gracefully with reconnection
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Pool will automatically attempt to reconnect
});

pool.on('connect', (client) => {
  console.log('🔗 New database connection established');
});

pool.on('acquire', (client) => {
  console.log('📊 Database connection acquired from pool');
});

pool.on('remove', (client) => {
  console.log('🔌 Database connection removed from pool');
});

// Simplified connection test with immediate feedback
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Database connection successful');
    console.log('🕐 Database time:', result.rows[0]?.now);
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`❌ Database connection failed:`, errorMessage);
    
    // Force recreation of pool on failure
    if (currentPool) {
      await currentPool.end();
      currentPool = createPool(FALLBACK_DATABASE_URL);
      console.log('🔄 Database pool recreated');
    }
    
    return false;
  }
}

// Test connection immediately
testDatabaseConnection();

export const db = drizzle(pool, { schema });