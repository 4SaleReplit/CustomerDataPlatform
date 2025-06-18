import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function checkConfigs() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await pool.query('SELECT * FROM environment_configurations');
    console.log('All configurations in database:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkConfigs();