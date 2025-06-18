import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function debugMigrationTypes() {
  const replitClient = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await replitClient.connect();
    console.log('Connected to Replit database');

    // Get campaign_jobs data to debug type issues
    const dataResult = await replitClient.query('SELECT * FROM campaign_jobs LIMIT 3');
    console.log('\n=== Sample campaign_jobs data ===');
    dataResult.rows.forEach((row, index) => {
      console.log(`Row ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value} (${typeof value}) ${value instanceof Date ? '[Date]' : ''}`);
      });
    });

    // Get schema info for campaign_jobs
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
      WHERE table_name = 'campaign_jobs' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('\n=== Schema for campaign_jobs ===');
    schemaResult.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (${col.udt_name}) -> ${col.proper_data_type}`);
    });

    // Test presentations table specifically
    const presentationsData = await replitClient.query('SELECT * FROM presentations LIMIT 1');
    if (presentationsData.rows.length > 0) {
      console.log('\n=== Sample presentations data ===');
      const row = presentationsData.rows[0];
      Object.entries(row).forEach(([key, value]) => {
        console.log(`  ${key}: ${value} (${typeof value}) ${Array.isArray(value) ? '[Array]' : ''}`);
      });
    }

    // Get presentations schema
    const presentationsSchema = await replitClient.query(`
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

    console.log('\n=== Schema for presentations ===');
    presentationsSchema.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (${col.udt_name}) -> ${col.proper_data_type}`);
    });

    console.log('\n=== Testing SQL generation ===');
    
    // Simulate the migration logic
    const columnTypes = {};
    schemaResult.rows.forEach(col => {
      columnTypes[col.column_name] = {
        dataType: col.data_type,
        udtName: col.udt_name,
        properDataType: col.proper_data_type
      };
    });

    // Test data conversion
    const testRow = dataResult.rows[0];
    console.log('Original row:', testRow);
    
    const testValues = Object.keys(testRow).map(colName => {
      const val = testRow[colName];
      const colType = columnTypes[colName];
      
      if (val === null) return 'NULL';
      
      // Handle JSONB columns specifically
      if (colType && (colType.dataType === 'jsonb' || colType.properDataType === 'jsonb')) {
        return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
      }
      
      // Handle PostgreSQL arrays (but not JSONB arrays)
      if (Array.isArray(val) && colType && colType.dataType === 'ARRAY') {
        if (val.length === 0) return 'ARRAY[]';
        const arrayElements = val.map(item => `'${String(item).replace(/'/g, "''")}'`).join(',');
        return `ARRAY[${arrayElements}]`;
      }
      
      // Handle timestamp columns
      if (colType && (colType.dataType === 'timestamp with time zone' || colType.dataType === 'timestamp without time zone')) {
        return val instanceof Date ? `'${val.toISOString()}'` : `'${String(val)}'`;
      }
      
      // Handle date columns
      if (colType && colType.dataType === 'date') {
        return val instanceof Date ? `'${val.toISOString().split('T')[0]}'` : `'${String(val)}'`;
      }
      
      // Handle other JSON objects as JSONB (but only if not a date/timestamp)
      if (typeof val === 'object' && !(val instanceof Date)) {
        return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
      }
      
      return `'${String(val).replace(/'/g, "''")}'`;
    });

    console.log('Converted values:', testValues);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await replitClient.end();
  }
}

debugMigrationTypes();