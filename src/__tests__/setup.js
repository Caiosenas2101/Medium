// Jest setup file
require('dotenv').config({ path: '.env.test' });

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock database connection for tests
jest.mock('../database', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
  },
  testConnection: jest.fn().mockResolvedValue(true),
}));

// Mock logger for tests
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock morgan for tests
jest.mock('../config/morgan', () => ({
  getMorganConfig: jest.fn(() => (req, res, next) => next()),
  customLogger: jest.fn((req, res, next) => next()),
  errorLogger: jest.fn((err, req, res, next) => next(err)),
  performanceLogger: jest.fn((req, res, next) => next()),
  rateLimitLogger: jest.fn((req, res, next) => next()),
}));

// Mock security config for tests
jest.mock('../config/security', () => ({
  helmetConfig: jest.fn((req, res, next) => next()),
  corsConfig: jest.fn((req, res, next) => next()),
  rateLimitConfig: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  authRateLimitConfig: {
    windowMs: 15 * 60 * 1000,
    max: 5,
  },
  securityHeaders: jest.fn((req, res, next) => next()),
  ipWhitelist: jest.fn((req, res, next) => next()),
}));

// Mock middleware config for tests
jest.mock('../config/middlewares', () => ({
  requestInfo: jest.fn(() => (req, res, next) => {
    req.timestamp = new Date().toISOString();
    req.requestId = 'test-request-id';
    next();
  }),
  securityHeaders: jest.fn(() => (req, res, next) => next()),
  requestLogger: jest.fn(() => (req, res, next) => next()),
  performanceLogger: jest.fn(() => (req, res, next) => next()),
  rateLimitLogger: jest.fn(() => (req, res, next) => next()),
  jsonValidator: jest.fn(() => (req, res, next) => next()),
  compression: jest.fn(() => (req, res, next) => next()),
  customCors: jest.fn(() => (req, res, next) => next()),
  apiInfo: jest.fn(() => (req, res, next) => next()),
  errorLogger: jest.fn(() => (err, req, res, next) => next(err)),
  healthCheck: jest.fn(() => (req, res, next) => next()),
}));

// Mock route config for tests
jest.mock('../config/routes', () => ({
  setupRoutes: jest.fn(),
  setupTestRoutes: jest.fn(),
  setupMonitoringRoutes: jest.fn(),
}));

// Mock error handling config for tests
jest.mock('../config/errorHandling', () => ({
  setupErrorHandling: jest.fn(),
  setupDevelopmentErrorHandling: jest.fn(),
  setupProductionErrorHandling: jest.fn(),
}));

// Mock database config for tests
jest.mock('../config/database', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
  getStatus: jest.fn().mockResolvedValue({ status: 'connected' }),
  runMigrations: jest.fn().mockResolvedValue(true),
  runSeeders: jest.fn().mockResolvedValue(true),
  reset: jest.fn().mockResolvedValue(true),
  configurePool: jest.fn().mockReturnValue({}),
  healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '3001';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'medium_api_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = '';

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test setup
beforeAll(async () => {
  // Setup global test environment
  process.env.NODE_ENV = 'test';
});

// Global test teardown
afterAll(async () => {
  // Cleanup global test environment
  jest.restoreAllMocks();
});