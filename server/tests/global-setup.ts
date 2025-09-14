// GLOBAL TEST SETUP - PREPARE THE BATTLEFIELD!!! 🔥⚔️🔥

export default async (): Promise<void> => {
  console.log('🔥 INITIALIZING TESTING APOCALYPSE!!! 💀');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = process.env.DB_NAME || 'worker_checkin';
  process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  
  // Disable console.log in tests unless explicitly needed
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.warn = jest.fn();
  }
  
  console.log('⚡ Global test setup completed!');
};