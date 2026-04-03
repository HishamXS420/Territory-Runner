const fs = require('fs');
const path = require('path');

/**
 * Initialize database schema
 * This script reads the database.sql file and executes all SQL commands
 */
async function initializeDatabase() {
  let pool;
  try {
    console.log('Starting database initialization...');

    const usingConnectionString = Boolean(process.env.DATABASE_URL);
    const requiredEnvVars = usingConnectionString
      ? []
      : ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    if (!usingConnectionString && process.env.DB_PORT) {
      const parsedPort = Number.parseInt(process.env.DB_PORT, 10);
      if (!Number.isFinite(parsedPort) || parsedPort <= 0 || parsedPort >= 65536) {
        throw new Error('DB_PORT must be a valid integer between 1 and 65535');
      }
    }

    pool = require('./config/database');

    // Read the SQL schema file
    const sqlFile = path.join(__dirname, 'config', 'database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute the SQL
    await pool.query(sql);

    console.log('✓ Database schema initialized successfully!');
    console.log('✓ All tables and indexes created.');

    // Close the connection
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error initializing database:', error.message);
    if (error.code) {
      console.error('✗ Error code:', error.code);
    }
    if (error.stack) {
      console.error(error.stack);
    }

    if (pool && typeof pool.end === 'function') {
      try {
        await pool.end();
      } catch (closeError) {
        console.error('✗ Error closing database connection:', closeError.message);
      }
    }

    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
