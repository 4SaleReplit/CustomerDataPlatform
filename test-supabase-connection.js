// Clean up test file
import { Pool } from 'pg';

async function testSupabaseConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✓ Connected to Supabase PostgreSQL');

    // Get database info
    const versionResult = await client.query('SELECT version()');
    console.log('Database version:', versionResult.rows[0].version);

    // Get database name and size
    const dbInfoResult = await client.query(`
      SELECT 
        current_database() as database_name,
        pg_size_pretty(pg_database_size(current_database())) as database_size
    `);
    console.log('Database info:', dbInfoResult.rows[0]);

    // Get schema information
    const schemaResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    console.log('Available schemas:', schemaResult.rows.map(r => r.schema_name));

    // Get table count
    const tableResult = await client.query(`
      SELECT 
        schemaname,
        COUNT(*) as table_count
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      GROUP BY schemaname
      ORDER BY schemaname
    `);
    console.log('Tables by schema:', tableResult.rows);

    // Get view count
    const viewResult = await client.query(`
      SELECT 
        schemaname,
        COUNT(*) as view_count
      FROM pg_views 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      GROUP BY schemaname
      ORDER BY schemaname
    `);
    console.log('Views by schema:', viewResult.rows);

    client.release();
    console.log('✓ Connection test completed successfully');

    return {
      success: true,
      database: dbInfoResult.rows[0].database_name,
      size: dbInfoResult.rows[0].database_size,
      version: versionResult.rows[0].version,
      schemas: schemaResult.rows.map(r => r.schema_name),
      tables: tableResult.rows,
      views: viewResult.rows
    };

  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await pool.end();
  }
}

testSupabaseConnection()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 Supabase connection successful!');
      console.log('You can safely use this database URL for your platform.');
    } else {
      console.log('\n❌ Connection failed. Please check your credentials.');
    }
  })
  .catch(error => {
    console.error('Test script error:', error);
  });