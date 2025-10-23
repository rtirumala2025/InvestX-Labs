import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import DailyRotateFile from 'winston-daily-rotate-file';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';

// Get system and application info
const hostname = os.hostname();
const pid = process.pid;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json, errors } = format;

// Add request context to logs
const requestContext = winston.format((info) => {
  const req = info.req || {};
  const res = info.res || {};
  
  return {
    ...info,
    timestamp: new Date().toISOString(),
    service: 'investx-backend',
    environment: process.env.NODE_ENV || 'development',
    hostname,
    pid,
    request: req.id ? {
      id: req.id,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      responseTime: res.responseTime
    } : undefined,
    error: info.error instanceof Error ? {
      message: info.error.message,
      stack: info.error.stack,
      ...info.error
    } : info.error
  };
});

// Custom format for console output in development
const consoleFormat = printf(({ level, message, ...meta }) => {
  const timestamp = new Date().toISOString();
  const context = meta.request
    ? `[${meta.request.method} ${meta.request.path}]`
    : '';
  
  let log = `${timestamp} ${level.toUpperCase()}: ${message} ${context}`;
  
  if (meta.error) {
    log += `\n${meta.error.stack || meta.error.message}`;
  }
  
  if (process.env.NODE_ENV !== 'production' && meta.stack) {
    log += `\n${meta.stack}`;
  }
  
  return log;
});

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    requestContext(),
    process.env.NODE_ENV === 'production' ? json() : consoleFormat
  ),
  defaultMeta: { 
    service: 'investx-backend',
    ...getGitInfo()
  },
  transports: [
    // Console transport
    new transports.Console({
      format: combine(
        colorize(),
        consoleFormat
      ),
    }),
    // Daily rotate file transport for errors
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '30d',
      level: 'error',
    }),
  ],
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

export default logger;
