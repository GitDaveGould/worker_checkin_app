// Test script to verify RDS connection using default postgres database
const { Pool } = require('pg');

const pool = new Pool({
  host: 'worker-checkin-db.ch6u2aeeujkg.us-east-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres', // Try default database first
  user: 'postgres',
  password: 'WorkerApp2024!',
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current time from database:', result.rows[0].now);
    
    // Check what databases exist
    const dbResult = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
    console.log('Available databases:', dbResult.rows.map(row => row.datname));
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();