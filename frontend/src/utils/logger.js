// Simple logger utility
const logLevels = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

const log = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  switch(level) {
    case logLevels.ERROR:
      console.error(logMessage, ...args);
      break;
    case logLevels.WARN:
      console.warn(logMessage, ...args);
      break;
    case logLevels.INFO:
      console.info(logMessage, ...args);
      break;
    case logLevels.DEBUG:
    default:
      console.debug(logMessage, ...args);
  }
};

export const logError = (message, error) => {
  log(logLevels.ERROR, message, error || '');
};

export const logInfo = (message, data) => {
  log(logLevels.INFO, message, data || '');
};

export const logWarn = (message, data) => {
  log(logLevels.WARN, message, data || '');
};

export const logDebug = (message, data) => {
  if (process.env.NODE_ENV === 'development') {
    log(logLevels.DEBUG, message, data || '');
  }
};

const logger = {
  logError,
  logInfo,
  logWarn,
  logDebug,
  levels: logLevels
};

export default logger;
