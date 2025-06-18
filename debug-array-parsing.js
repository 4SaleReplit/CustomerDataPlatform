import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function debugArrayParsing() {
  const replitClient = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await replitClient.connect();
    console.log('Connected to Replit database');

    // Get actual array data to understand the format
    const result = await replitClient.query('SELECT id, title, slide_ids FROM presentations LIMIT 3');
    
    console.log('\n=== Raw presentation data from database ===');
    result.rows.forEach((row, index) => {
      console.log(`Row ${index + 1}:`);
      console.log(`  id: ${row.id}`);
      console.log(`  title: ${row.title}`);
      console.log(`  slide_ids: ${row.slide_ids} (type: ${typeof row.slide_ids})`);
      console.log(`  slide_ids isArray: ${Array.isArray(row.slide_ids)}`);
      
      if (typeof row.slide_ids === 'string') {
        console.log(`  slide_ids as string: "${row.slide_ids}"`);
        // Test PostgreSQL array parsing
        if (row.slide_ids.startsWith('{') && row.slide_ids.endsWith('}')) {
          const parsed = row.slide_ids.slice(1, -1).split(',');
          console.log(`  parsed as array: [${parsed.map(s => `"${s}"`).join(', ')}]`);
        }
      }
      console.log('');
    });

    // Test the conversion logic
    console.log('=== Testing conversion logic ===');
    const testData = result.rows[0];
    console.log('Original slide_ids:', testData.slide_ids);
    
    // Simulate the migration conversion
    let convertedValue;
    if (typeof testData.slide_ids === 'string' && testData.slide_ids.startsWith('{') && testData.slide_ids.endsWith('}')) {
      // Parse PostgreSQL array format {uuid1,uuid2,uuid3}
      const elements = testData.slide_ids.slice(1, -1).split(',').filter(s => s.trim());
      if (elements.length === 0) {
        convertedValue = 'ARRAY[]';
      } else {
        const arrayElements = elements.map(item => `'${item.trim()}'`).join(',');
        convertedValue = `ARRAY[${arrayElements}]::uuid[]`;
      }
    } else if (Array.isArray(testData.slide_ids)) {
      // Handle actual arrays
      if (testData.slide_ids.length === 0) {
        convertedValue = 'ARRAY[]';
      } else {
        const arrayElements = testData.slide_ids.map(item => `'${String(item)}'`).join(',');
        convertedValue = `ARRAY[${arrayElements}]::uuid[]`;
      }
    } else {
      convertedValue = 'NULL';
    }
    
    console.log('Converted to SQL:', convertedValue);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await replitClient.end();
  }
}

debugArrayParsing();