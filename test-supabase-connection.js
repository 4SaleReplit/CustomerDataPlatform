import pg from 'pg';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { Pool } = pg;

async function testSupabaseConnection() {
  const password = '46a8p22qSRAYif';
  const hostname = 'db.mpgggmxcclcemaaskqlp.supabase.co';
  const connectionString = `postgresql://postgres:${password}@${hostname}:5432/postgres`;
  
  console.log('🔍 Testing Supabase connection...');
  console.log('Hostname:', hostname);
  console.log('Password:', password.substring(0, 3) + '***');
  
  // Test 1: Basic DNS resolution
  console.log('\n1️⃣ Testing DNS resolution...');
  try {
    const dns = require('dns').promises;
    const addresses = await dns.lookup(hostname);
    console.log('✅ DNS resolved to:', addresses.address);
  } catch (error) {
    console.error('❌ DNS resolution failed:', error.message);
    console.error('💡 This hostname might not exist or be accessible');
    return;
  }

  // Test 2: Connection with SSL required
  console.log('\n2️⃣ Testing connection with SSL required...');
  const pool1 = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 15000,
    max: 1
  });

  try {
    console.log('⏳ Attempting to connect with SSL...');
    const client = await pool1.connect();
    console.log('✅ Connected successfully with SSL!');
    
    const result = await client.query('SELECT current_user, current_database(), version() LIMIT 1');
    console.log('📊 Connection details:');
    console.log('User:', result.rows[0].current_user);
    console.log('Database:', result.rows[0].current_database);
    console.log('Version:', result.rows[0].version.substring(0, 50) + '...');
    
    client.release();
    await pool1.end();
    return;
    
  } catch (error) {
    console.error('❌ SSL connection failed:', error.message);
    await pool1.end();
  }

  // Test 3: Connection without SSL
  console.log('\n3️⃣ Testing connection without SSL...');
  const pool2 = new Pool({
    host: hostname,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: false,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 15000,
    max: 1
  });

  try {
    console.log('⏳ Attempting to connect without SSL...');
    const client = await pool2.connect();
    console.log('✅ Connected successfully without SSL!');
    
    const result = await client.query('SELECT current_user, current_database() LIMIT 1');
    console.log('📊 Connection details:');
    console.log('User:', result.rows[0].current_user);
    console.log('Database:', result.rows[0].current_database);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Non-SSL connection failed:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Hostname not found - check if the Supabase URL is correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - check port and firewall');
    } else if (error.message.includes('password')) {
      console.error('💡 Authentication failed - check username and password');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Connection timeout - check network connectivity');
    } else if (error.message.includes('SSL')) {
      console.error('💡 SSL required - Supabase requires SSL connections');
    }
  } finally {
    await pool2.end();
  }

  console.log('\n🔍 If all tests failed, please check:');
  console.log('1. Is the Supabase project active and accessible?');
  console.log('2. Are you using the correct connection string from Supabase dashboard?');
  console.log('3. Is your IP address whitelisted in Supabase (if IP restrictions are enabled)?');
  console.log('4. Is your network/firewall blocking external database connections?');
}

testSupabaseConnection().catch(console.error); 