module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1'
  },
  
  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.css$': 'jest-transform-stub',
    '^.+\\.(png|jpg|jpeg|gif|svg)$': 'jest-transform-stub'
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/__tests__/**/*.js',
    '<rootDir>/src/**/*.test.js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/functions/'
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Global setup
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      REACT_APP_FIREBASE_API_KEY: 'test-api-key',
      REACT_APP_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
      REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
      REACT_APP_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
      REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      REACT_APP_FIREBASE_APP_ID: 'test-app-id',
      REACT_APP_OPENAI_API_KEY: 'test-openai-key'
    }
  }
};
