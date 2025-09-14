// SAVAGE TEST SETUP - THE FOUNDATION OF DESTRUCTION!!! 🔥🔥🔥

import { Pool } from 'pg';
import { config } from '../config';

// TEST DATABASE CONFIGURATION - ISOLATED DESTRUCTION ZONE!!! 💀
const testDbConfig = {
  ...config.database,
  database: `${config.database.database}_test`,
  max: 5, // Smaller pool for tests
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 5000,
};

export const testPool = new Pool(testDbConfig);

// SETUP TEST DATABASE - PREPARE THE BATTLEFIELD!!! ⚡
export const setupTestDatabase = async (): Promise<void> => {
  const adminPool = new Pool({
    ...testDbConfig,
    database: 'postgres', // Connect to default db to create test db
  });

  try {
    // Drop test database if exists
    await adminPool.query(`DROP DATABASE IF EXISTS "${testDbConfig.database}"`);
    
    // Create fresh test database
    await adminPool.query(`CREATE DATABASE "${testDbConfig.database}"`);
    
    console.log(`🔥 Test database "${testDbConfig.database}" created!`);
  } catch (error) {
    console.error('💀 Failed to setup test database:', error);
    throw error;
  } finally {
    await adminPool.end();
  }
};

// TEARDOWN TEST DATABASE - BURN IT ALL DOWN!!! 🔥
export const teardownTestDatabase = async (): Promise<void> => {
  await testPool.end();
  
  const adminPool = new Pool({
    ...testDbConfig,
    database: 'postgres',
  });

  try {
    // Force disconnect all connections
    await adminPool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${testDbConfig.database}' AND pid <> pg_backend_pid()
    `);
    
    // Drop test database
    await adminPool.query(`DROP DATABASE IF EXISTS "${testDbConfig.database}"`);
    
    console.log(`💀 Test database "${testDbConfig.database}" destroyed!`);
  } catch (error) {
    console.error('⚡ Failed to teardown test database:', error);
  } finally {
    await adminPool.end();
  }
};

// RUN MIGRATIONS ON TEST DATABASE - PREPARE FOR BATTLE!!! ⚔️
export const runTestMigrations = async (): Promise<void> => {
  const { runMigrations } = await import('../utils/migrations');
  await runMigrations(testPool);
  console.log('🚀 Test database migrations completed!');
};

// SEED TEST DATA - POPULATE THE ARENA!!! 🌱
export const seedTestData = async (): Promise<void> => {
  // Create test events
  await testPool.query(`
    INSERT INTO events (name, start_date, end_date, location, is_active) VALUES
    ('Test Event 1', '2024-01-01', '2024-01-02', 'Test Location 1', true),
    ('Test Event 2', '2024-02-01', '2024-02-02', 'Test Location 2', false),
    ('Test Event 3', '2024-03-01', '2024-03-02', 'Test Location 3', false)
  `);

  // Create test workers
  await testPool.query(`
    INSERT INTO workers (first_name, last_name, date_of_birth, email, phone, street_address, city, state, zip_code, country) VALUES
    ('John', 'Doe', '1990-01-01', 'john.doe@test.com', '555-0001', '123 Test St', 'Test City', 'TS', '12345', 'USA'),
    ('Jane', 'Smith', '1985-05-15', 'jane.smith@test.com', '555-0002', '456 Test Ave', 'Test Town', 'TS', '67890', 'USA'),
    ('Bob', 'Johnson', '1992-12-25', 'bob.johnson@test.com', '555-0003', '789 Test Blvd', 'Test Village', 'TS', '11111', 'USA')
  `);

  // Create test admin settings
  await testPool.query(`
    INSERT INTO admin_settings (key, value) VALUES
    ('termsAndConditions', '<h2>Test Terms</h2><p>These are test terms and conditions.</p>'),
    ('question1Options', '["Social Media", "Friend", "Website", "Other"]'),
    ('question3Options1', '["Networking", "Learning", "Job Search"]'),
    ('question3Options2', '["Beginner", "Intermediate", "Advanced"]')
  `);

  console.log('🌱 Test data seeded successfully!');
};

// CLEAN TEST DATA - RESET THE BATTLEFIELD!!! 🧹
export const cleanTestData = async (): Promise<void> => {
  await testPool.query('TRUNCATE TABLE checkins CASCADE');
  await testPool.query('TRUNCATE TABLE workers RESTART IDENTITY CASCADE');
  await testPool.query('TRUNCATE TABLE events RESTART IDENTITY CASCADE');
  await testPool.query('TRUNCATE TABLE admin_settings CASCADE');
  console.log('🧹 Test data cleaned!');
};

// GLOBAL TEST SETUP AND TEARDOWN
beforeAll(async () => {
  await setupTestDatabase();
  await runTestMigrations();
  await seedTestData();
});

afterAll(async () => {
  await teardownTestDatabase();
});

beforeEach(async () => {
  // Clean and reseed before each test
  await cleanTestData();
  await seedTestData();
});

// TEST UTILITIES - WEAPONS OF MASS TESTING!!! ⚔️
export const testUtils = {
  // Create test worker
  createTestWorker: async (overrides: Partial<any> = {}) => {
    const defaultWorker = {
      firstName: 'Test',
      lastName: 'Worker',
      dateOfBirth: '1990-01-01',
      email: `test.worker.${Date.now()}@test.com`,
      phone: `555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      streetAddress: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'USA',
      ...overrides
    };

    const result = await testPool.query(`
      INSERT INTO workers (first_name, last_name, date_of_birth, email, phone, street_address, city, state, zip_code, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      defaultWorker.firstName,
      defaultWorker.lastName,
      defaultWorker.dateOfBirth,
      defaultWorker.email,
      defaultWorker.phone,
      defaultWorker.streetAddress,
      defaultWorker.city,
      defaultWorker.state,
      defaultWorker.zipCode,
      defaultWorker.country
    ]);

    return result.rows[0];
  },

  // Create test event
  createTestEvent: async (overrides: Partial<any> = {}) => {
    const defaultEvent = {
      name: `Test Event ${Date.now()}`,
      startDate: '2024-01-01',
      endDate: '2024-01-02',
      location: 'Test Location',
      isActive: false,
      ...overrides
    };

    const result = await testPool.query(`
      INSERT INTO events (name, start_date, end_date, location, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      defaultEvent.name,
      defaultEvent.startDate,
      defaultEvent.endDate,
      defaultEvent.location,
      defaultEvent.isActive
    ]);

    return result.rows[0];
  },

  // Create test check-in
  createTestCheckIn: async (workerId: number, eventId: number, overrides: Partial<any> = {}) => {
    const defaultCheckIn = {
      question1Response: 'Social Media',
      question2Response: true,
      question3Response1: 'Networking',
      question3Response2: 'Intermediate',
      termsAccepted: true,
      ...overrides
    };

    const result = await testPool.query(`
      INSERT INTO checkins (worker_id, event_id, question1_response, question2_response, question3_response1, question3_response2, terms_accepted)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      workerId,
      eventId,
      defaultCheckIn.question1Response,
      defaultCheckIn.question2Response,
      defaultCheckIn.question3Response1,
      defaultCheckIn.question3Response2,
      defaultCheckIn.termsAccepted
    ]);

    return result.rows[0];
  }
};

export default testPool;