// Script to create our application database
const { Pool } = require('pg');

const pool = new Pool({
  host: 'worker-checkin-db.ch6u2aeeujkg.us-east-2.rds.amazonaws.com',
  port: 5432,
  database: 'postgres', // Connect to default database first
  user: 'postgres',
  password: 'WorkerApp2024!',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createDatabase() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Create our application database
    await client.query('CREATE DATABASE worker_checkin_db;');
    console.log('✅ Database "worker_checkin_db" created successfully!');
    
    client.release();
    process.exit(0);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Database "worker_checkin_db" already exists!');
      process.exit(0);
    } else {
      console.error('❌ Failed to create database:', error.message);
      process.exit(1);
    }
  }
}

createDatabase();