#!/usr/bin/env tsx

import { Pool } from 'pg';
import { config } from '../config';

async function setupDatabase() {
  console.log('Database Setup Tool');
  console.log('==================');
  
  // First, try to connect to PostgreSQL server (without specific database)
  const adminPool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: 'postgres' // Connect to default postgres database
  });

  try {
    console.log('Testing PostgreSQL connection...');
    await adminPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection successful');

    // Check if our database exists
    const dbCheckResult = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database.database]
    );

    if (dbCheckResult.rows.length === 0) {
      console.log(`Creating database: ${config.database.database}`);
      await adminPool.query(`CREATE DATABASE ${config.database.database}`);
      console.log('✅ Database created successfully');
    } else {
      console.log(`✅ Database ${config.database.database} already exists`);
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('\n📋 Setup Instructions:');
    console.log('1. Install PostgreSQL: https://www.postgresql.org/download/');
    console.log('2. Start PostgreSQL service');
    console.log('3. Update .env file with correct database credentials');
    console.log('4. Run this script again');
    process.exit(1);
  } finally {
    await adminPool.end();
  }

  console.log('\n🎉 Database setup completed!');
  console.log('You can now run: npm run migrate:up');
}

setupDatabase().catch(error => {
  console.error('❌ Setup error:', error);
  process.exit(1);
});