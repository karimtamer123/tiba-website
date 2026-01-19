const mysql = require('mysql2/promise');

// Validate required environment variables
if (!process.env.DB_PASSWORD) {
  throw new Error(
    'DB_PASSWORD is required but not found in environment variables. ' +
    'Please check your .env file in the backend/ directory and ensure DB_PASSWORD is set.'
  );
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'tiba_website',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✓ Connected to MySQL database successfully');
    console.log(`  Database: ${dbConfig.database} on ${dbConfig.host}`);
    connection.release();
  })
  .catch(err => {
    console.error('\n✗ Database connection failed:');
    if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.message.includes('Access denied')) {
      console.error('  Authentication failed. Please check:');
      console.error('  - DB_USER is correct');
      console.error('  - DB_PASSWORD is correct');
      console.error('  - MySQL user has proper permissions');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('  Connection refused. Please check:');
      console.error('  - MySQL server is running');
      console.error('  - DB_HOST is correct');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('  Database does not exist. Please check:');
      console.error('  - DB_NAME is correct');
      console.error('  - Database has been created');
    } else {
      console.error(`  Error: ${err.message}`);
      console.error(`  Code: ${err.code || 'N/A'}`);
    }
    console.error('');
  });

module.exports = pool;

