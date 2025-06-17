import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables for production database connection
dotenv.config();

// Use .env DATABASE_URL for production database connection
// All other integrations are managed through database-stored credentials
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env file. Please check your environment configuration.');
  throw new Error('DATABASE_URL is required for production database connection');
}

console.log('Using production database from .env file for application connection');
console.log('Database URL configured:', DATABASE_URL.replace(/:[^:@]*@/, ':***@')); // Mask password

// Create pool with production database connection (Supabase compatible)
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
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