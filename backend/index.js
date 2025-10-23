import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import { requestTracker, errorLogger, metricsMiddleware } from './middleware/requestTracker.js';
import aiRoutes from './routes/aiRoute.js';
import mcpRoutes from './routes/mcpRoute.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === 'production';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: isProduction ? process.env.ALLOWED_ORIGINS?.split(',') || [] : '*',
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.'
    });
  }
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Request tracking and logging
app.use(requestTracker());
app.use(metricsMiddleware);

// API Routes
app.use('/api', aiRoutes);
app.use('/api', mcpRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
    requestId: req.id
  });
});

// Error handling
app.use(errorLogger);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(!isProduction && { stack: err.stack }),
    requestId: req.id
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { 
    error: reason,
    stack: reason.stack,
    message: 'Unhandled Promise Rejection'
  });
  
  // In production, you might want to gracefully shut down
  if (isProduction) {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { 
    error,
    stack: error.stack,
    message: 'Uncaught Exception'
  });
  
  // In production, you might want to gracefully shut down
  if (isProduction) {
    process.exit(1);
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Handle process termination
const shutdown = () => {
  logger.info('Shutting down server...');
  
  server.close(() => {
    logger.info('Server has been shut down');
    process.exit(0);
  });

  // Force close server after 10 seconds
  setTimeout(() => {
    logger.error('Forcing server shutdown');
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
