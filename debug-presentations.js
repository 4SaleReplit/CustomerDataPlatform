import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function debugPresentationsTable() {
  // Supabase connection (Staging environment)
  const supabaseClient = new Client({
    connectionString: "postgresql://postgres.oolcnbxrnuefxfdpvsfn:dsadasSDASdsaDASDASasdsadas3434@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"
  });

  // Replit connection (Development environment)  
  const replitClient = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Connecting to both databases...');
    await supabaseClient.connect();
    await replitClient.connect();

    // Get schema from Replit
    console.log('\n=== Getting presentations schema from Replit ===');
    const schemaResult = await replitClient.query(`
      SELECT 
        column_name, 
        data_type,
        udt_name,
        is_nullable, 
        column_default,
        CASE 
          WHEN data_type = 'ARRAY' THEN 
            CASE 
              WHEN udt_name = '_text' THEN 'text[]'
              WHEN udt_name = '_varchar' THEN 'varchar[]'
              WHEN udt_name = '_int4' THEN 'integer[]'
              WHEN udt_name = '_uuid' THEN 'uuid[]'
              WHEN udt_name = '_jsonb' THEN 'jsonb[]'
              ELSE udt_name
            END
          ELSE data_type
        END as proper_data_type
      FROM information_schema.columns 
      WHERE table_name = 'presentations' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('Schema columns:');
    schemaResult.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.udt_name}) -> ${col.proper_data_type}`);
    });

    // Generate CREATE TABLE SQL
    const columns = schemaResult.rows.map(col => {
      let def = `"${col.column_name}" ${col.proper_data_type}`;
      if (col.is_nullable === 'NO') def += ' NOT NULL';
      
      if (col.column_default) {
        if (col.column_default === 'gen_random_uuid()') {
          def += ' DEFAULT gen_random_uuid()';
        } else if (col.column_default === 'now()') {
          def += ' DEFAULT now()';
        } else if (col.column_default.includes('::')) {
          // Handle typed defaults like 'draft'::text
          def += ` DEFAULT ${col.column_default}`;
        } else {
          def += ` DEFAULT '${col.column_default}'`;
        }
      }
      
      return def;
    }).join(', ');

    const createTableSQL = `CREATE TABLE "presentations" (${columns})`;
    console.log('\n=== Generated SQL ===');
    console.log(createTableSQL);

    // Try to create table on Supabase
    console.log('\n=== Testing table creation on Supabase ===');
    try {
      // Drop if exists first
      await supabaseClient.query('DROP TABLE IF EXISTS presentations CASCADE');
      console.log('Dropped existing presentations table');

      // Create new table
      await supabaseClient.query(createTableSQL);
      console.log('✅ Successfully created presentations table on Supabase!');

      // Verify table exists
      const verifyResult = await supabaseClient.query(`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'presentations' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('\n=== Verification - Supabase table structure ===');
      verifyResult.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.udt_name})`);
      });

    } catch (error) {
      console.error('❌ Failed to create presentations table:', error.message);
      console.error('Error details:', error);
    }

  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await supabaseClient.end();
    await replitClient.end();
  }
}

debugPresentationsTable();