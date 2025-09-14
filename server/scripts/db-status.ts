#!/usr/bin/env tsx

import { testConnection } from '../config/database';
import { executeQuery } from '../utils/database';

async function checkDatabaseStatus() {
  console.log('Database Status Check');
  console.log('====================');

  // Test basic connection
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('❌ Database connection failed');
    console.log('\n📋 Troubleshooting:');
    console.log('1. Check if PostgreSQL is running');
    console.log('2. Verify credentials in .env file');
    console.log('3. Run: npm run db:setup');
    return;
  }

  try {
    // Check if migrations table exists
    const migrationTableExists = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    if (migrationTableExists.rows[0].exists) {
      console.log('✅ Migrations table exists');
      
      // Get migration status
      const migrations = await executeQuery('SELECT filename, executed_at FROM migrations ORDER BY id');
      console.log(`📊 Executed migrations: ${migrations.rows.length}`);
      migrations.rows.forEach(row => {
        console.log(`   - ${row.filename} (${new Date(row.executed_at).toLocaleString()})`);
      });
    } else {
      console.log('⚠️  Migrations table does not exist');
      console.log('   Run: npm run migrate:up');
    }

    // Check main tables
    const tables = ['workers', 'events', 'checkins', 'admin_settings'];
    console.log('\n📋 Table Status:');
    
    for (const table of tables) {
      try {
        const result = await executeQuery(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ✅ ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`   ❌ ${table}: Table does not exist`);
      }
    }

  } catch (error) {
    console.error('❌ Status check failed:', error);
  }
}

checkDatabaseStatus().catch(error => {
  console.error('❌ Status check error:', error);
  process.exit(1);
});