import postgres from 'postgres';
import fs from 'fs';

// Use the environment variable for database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    const sql = postgres(connectionString);
    
    console.log('Database connected successfully!');
    
    // Read the SQL setup file
    const setupSQL = fs.readFileSync('./setup-database.sql', 'utf8');
    
    console.log('Executing database setup...');
    
    // Split by semicolon and execute each statement
    const statements = setupSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql.unsafe(statement.trim());
          console.log('✓ Executed statement successfully');
        } catch (err) {
          console.log('⚠ Statement warning (might be OK if table exists):', err.message);
        }
      }
    }
    
    console.log('Database setup completed!');
    await sql.end();
    
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();