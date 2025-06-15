#!/usr/bin/env node

// Database Connection Test Script
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure Neon for serverless
const neonConfig = require('@neondatabase/serverless').neonConfig;
neonConfig.webSocketConstructor = ws;

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set your database URL:');
    console.log('export DATABASE_URL="postgresql://username:password@hostname:5432/database"');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connection successful!');
    console.log(`📅 Current time: ${result.rows[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${result.rows[0].postgres_version.split(' ')[0]}`);
    
    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Found ${tablesResult.rows.length} tables in database:`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`  • ${row.table_name}`);
      });
    } else {
      console.log('  No tables found - ready for schema migration');
    }
    
    // Test if we can create a simple table (and clean it up)
    try {
      await pool.query('CREATE TABLE test_connection (id SERIAL PRIMARY KEY, test_time TIMESTAMP DEFAULT NOW())');
      await pool.query('INSERT INTO test_connection DEFAULT VALUES');
      const testResult = await pool.query('SELECT * FROM test_connection');
      await pool.query('DROP TABLE test_connection');
      console.log('✅ Database write permissions confirmed');
    } catch (err) {
      console.log('⚠️  Limited database permissions (read-only or restricted)');
      console.log(`   Error: ${err.message}`);
    }

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   • Check username and password in DATABASE_URL');
      console.log('   • Verify the user exists in PostgreSQL');
    } else if (error.message.includes('does not exist')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   • Check database name in DATABASE_URL');
      console.log('   • Verify the database exists');
    } else if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   • Check hostname and port in DATABASE_URL');
      console.log('   • Verify network connectivity');
      console.log('   • Check firewall settings');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection();