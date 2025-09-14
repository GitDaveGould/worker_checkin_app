import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

export interface Migration {
  id: number;
  filename: string;
  executed_at: Date;
}

// Create migrations tracking table
export const createMigrationsTable = async (): Promise<void> => {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    await pool.query(query);
    console.log('Migrations table created or already exists');
  } catch (error) {
    console.error('Error creating migrations table:', error);
    throw error;
  }
};

// Get list of executed migrations
export const getExecutedMigrations = async (): Promise<string[]> => {
  try {
    const result = await pool.query(
      'SELECT filename FROM migrations ORDER BY id ASC'
    );
    return result.rows.map(row => row.filename);
  } catch (error) {
    console.error('Error fetching executed migrations:', error);
    throw error;
  }
};

// Execute a single migration file
export const executeMigration = async (filename: string): Promise<void> => {
  const migrationPath = path.join(__dirname, '../migrations', filename);
  
  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [filename]
      );
      await client.query('COMMIT');
      console.log(`Migration ${filename} executed successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error executing migration ${filename}:`, error);
    throw error;
  }
};

// Run all pending migrations
export const runMigrations = async (): Promise<void> => {
  try {
    // Ensure migrations table exists
    await createMigrationsTable();
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    
    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }
    
    console.log(`Running ${pendingMigrations.length} pending migrations...`);
    
    // Execute pending migrations
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

// Rollback last migration (for development)
export const rollbackLastMigration = async (): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    const lastMigration = result.rows[0].filename;
    console.log(`Rolling back migration: ${lastMigration}`);
    
    // Note: This is a simple implementation
    // In production, you'd want proper rollback scripts
    await pool.query(
      'DELETE FROM migrations WHERE filename = $1',
      [lastMigration]
    );
    
    console.log(`Migration ${lastMigration} rolled back`);
  } catch (error) {
    console.error('Error rolling back migration:', error);
    throw error;
  }
};