const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const DailyRotateFile = require('winston-daily-rotate-file');

// Create logger instance with default configuration
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;

// Ensure logs directory exists
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true, mode: 0o755 });
}

// Get Git info for better traceability
const getGitInfo = () => {
  try {
    return {
      commit: execSync('git rev-parse --short HEAD 2>/dev/null || echo "unknown"').toString().trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"').toString().trim()
    };
  } catch (error) {
    return { 
      commit: 'unknown', 
      branch: 'unknown',
      error: error.message 
    };
  }
};

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
  }`;
});

// Create the logger instance
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { 
    service: 'supabase-tester',
    ...getGitInfo()
  },
  transports: [
    // Console transport
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      ),
    }),
    // Daily rotate file transport for all logs
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '14d',
      level: 'info',
    }),
    // Error file transport
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '30d',
      level: 'error',
    })
  ]
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

module.exports = logger;
