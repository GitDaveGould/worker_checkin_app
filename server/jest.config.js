// SAVAGE JEST CONFIGURATION - TESTING DOMINATION!!! 🧪🔥🧪

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.test.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // TypeScript support
  preset: 'ts-jest',
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'routes/**/*.ts',
    'models/**/*.ts',
    'utils/**/*.ts',
    'middleware/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // Coverage thresholds - DEMAND EXCELLENCE!!! 💪
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test timeout
  testTimeout: 30000, // 30 seconds for integration tests
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Force exit after tests
  forceExit: true,
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',
  
  // Test reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ],
  
  // Performance monitoring
  maxWorkers: '50%', // Use half of available CPU cores
  
  // Error handling
  bail: false, // Don't stop on first failure
  
  // Mock configuration
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};