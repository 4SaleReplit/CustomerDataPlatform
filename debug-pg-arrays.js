import { Pool } from 'pg';

async function debugPgArrays() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Testing PostgreSQL array parsing...');
    
    const result = await pool.query('SELECT id, title, slide_ids FROM presentations WHERE slide_ids IS NOT NULL LIMIT 3');
    
    console.log('\n=== RAW DATA FROM PG DRIVER ===');
    result.rows.forEach((row, index) => {
      console.log(`\nRow ${index + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Title: ${row.title}`);
      console.log(`  slide_ids type: ${typeof row.slide_ids}`);
      console.log(`  slide_ids isArray: ${Array.isArray(row.slide_ids)}`);
      console.log(`  slide_ids value: ${JSON.stringify(row.slide_ids)}`);
      console.log(`  slide_ids raw: ${row.slide_ids}`);
    });

    // Test the actual migration logic
    console.log('\n=== TESTING MIGRATION LOGIC ===');
    result.rows.forEach((row, index) => {
      const val = row.slide_ids;
      console.log(`\nTesting row ${index + 1} slide_ids:`, JSON.stringify(val));
      
      // Test current logic
      if (Array.isArray(val)) {
        console.log('  ✓ Detected as array:', val);
      } else if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
        const elements = val.slice(1, -1).split(',').filter(s => s.trim());
        const cleanArray = elements.map(item => item.trim());
        console.log('  ✓ Converted PostgreSQL format:', cleanArray);
      } else if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
        try {
          const parsed = JSON.parse(val);
          console.log('  ✓ Converted JSON format:', parsed);
        } catch (e) {
          console.log('  ✗ Failed to parse JSON:', e.message);
        }
      } else {
        console.log('  ✗ Unknown format, would cause error');
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugPgArrays();