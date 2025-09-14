#!/usr/bin/env tsx
// SAVAGE MIGRATION SCRIPT - DATABASE EVOLUTION!!! 🗃️🔥🗃️

import { Pool } from 'pg';
import { config } from '../config';
import { runMigrations, rollbackMigration, getMigrationStatus } from '../utils/migrations';

const pool = new Pool(config.database);

async function main() {
  const command = process.argv[2] || 'up';
  
  try {
    console.log('🔥 MIGRATION SYSTEM ACTIVATED!!! 💀');
    
    switch (command) {
      case 'up':
        console.log('⚡ Running migrations...');
        await runMigrations(pool);
        console.log('✅ Migrations completed successfully!');
        break;
        
      case 'rollback':
        console.log('🔄 Rolling back last migration...');
        await rollbackMigration(pool);
        console.log('✅ Rollback completed successfully!');
        break;
        
      case 'status':
        console.log('📊 Checking migration status...');
        const status = await getMigrationStatus(pool);
        console.log('Migration Status:', status);
        break;
        
      default:
        console.log('❌ Unknown command. Use: up, rollback, or status');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('💀 Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();