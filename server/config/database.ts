import { Pool } from 'pg';
import { config } from './index';

// SAVAGE DATABASE POOL CONFIGURATION!!! 🔥🔥🔥
const poolConfig = {
  ...config.database,
  max: 25, // INCREASED Maximum number of clients in the pool
  min: 5,  // Minimum number of clients to keep alive
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // INCREASED timeout for better reliability
  maxUses: 7500, // Close connection after 7500 uses to prevent memory leaks
  
  // PERFORMANCE OPTIMIZATIONS!!! ⚡⚡⚡
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // QUERY TIMEOUT
  query_timeout: 30000, // 30 second query timeout
  
 // SSL Configuration - RDS requires SSL
  ssl: process.env.DB_HOST?.includes('rds.amazonaws.com') ? {
    rejectUnauthorized: false
  } : false,
};

export const pool = new Pool(poolConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database pool...');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
