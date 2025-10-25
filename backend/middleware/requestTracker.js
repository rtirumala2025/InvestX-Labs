import responseTime from 'response-time';
import logger from '../utils/logger.js';
import { generateRequestId } from '../ai-services/utils.js';

/**
 * Middleware to track request metrics and add request context to logs
 */
export const requestTracker = () => {
  return [
    // Add request ID and start time to request object
    (req, res, next) => {
      req.id = generateRequestId();
      req._startTime = process.hrtime();
      
      // Log request start
      logger.info('Request started', { 
        req, 
        message: `Request: ${req.method} ${req.path}` 
      });
      
      next();
    },
    
    // Response time tracking
    responseTime((req, res, time) => {
      res.responseTime = time;
      
      // Log request completion with metrics
      const logData = {
        req,
        res: {
          statusCode: res.statusCode,
          responseTime: time,
          contentLength: res.get('content-length')
        },
        message: `Request completed: ${req.method} ${req.path}`
      };
      
      // Log at appropriate level based on status code
      if (res.statusCode >= 500) {
        logger.error('Request error', logData);
      } else if (res.statusCode >= 400) {
        logger.warn('Request warning', logData);
      } else {
        logger.info('Request completed', logData);
      }
    })
  ];
};

/**
 * Middleware to log unhandled errors
 */
export const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err,
    req,
    message: `Unhandled error: ${err.message}`
  });
  
  next(err);
};

/**
 * Middleware to log API metrics
 */
export const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const responseTime = duration[0] * 1000 + duration[1] / 1e6; // in ms
    
    const metrics = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
      requestId: req.id,
      userAgent: req.get('user-agent'),
      ip: req.ip
    };
    
    logger.info('API metrics', { metrics });
  });
  
  next();
};
