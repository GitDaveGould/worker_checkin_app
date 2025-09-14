// Test script to verify RDS connection
const { Pool } = require('pg');

const pool = new Pool({
  host: 'YOUR_RDS_ENDPOINT_HERE', // Replace with your RDS endpoint
  port: 5432,
  database: 'worker_checkin_prod',
  user: 'postgres',
  password: 'WorkerApp2024!', // Replace with your password
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
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();