import logger from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Implements an exponential backoff strategy for retrying failed API calls
 * @param {Function} fn - The async function to retry
 * @param {number} [maxRetries=3] - Maximum number of retry attempts
 * @param {number} [initialDelay=1000] - Initial delay in milliseconds
 * @param {Function} [shouldRetry] - Optional function to determine if a retry should be attempted
 * @param {Object} [options] - Additional options
 * @param {number} [options.maxDelay=30000] - Maximum delay between retries in ms
 * @param {Function} [options.onRetry] - Callback on each retry attempt
 * @returns {Promise<any>} - The result of the function call
 */
export async function exponentialBackoff(fn, maxRetries = 3, initialDelay = 1000, shouldRetry = null, options = {}) {
  const { maxDelay = 30000, onRetry } = options;
  let retries = 0;
  let lastError;
  let lastResponse;

  while (retries <= maxRetries) {
    try {
      const result = await fn(retries);
      
      // If the function returns { retry: true }, we'll retry
      if (result && result.retry === true) {
        lastResponse = result;
        throw new Error('Retry requested by function');
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // If we've reached max retries or shouldRetry returns false, stop retrying
      if (retries >= maxRetries || (shouldRetry && !shouldRetry(error))) {
        break;
      }

      // Calculate delay with exponential backoff, jitter, and max delay
      const baseDelay = Math.min(initialDelay * Math.pow(2, retries), maxDelay);
      const jitter = Math.random() * 1000;
      const delay = Math.min(baseDelay + jitter, maxDelay);
      
      // Log the retry attempt
      const retryInfo = {
        attempt: retries + 1,
        maxAttempts: maxRetries + 1,
        delay: Math.round(delay),
        error: error.message,
        name: error.name,
        ...(error.code && { code: error.code }),
        ...(error.status && { status: error.status })
      };
      
      logger.warn(`API call attempt ${retryInfo.attempt}/${retryInfo.maxAttempts} failed`, retryInfo);
      
      // Call the onRetry callback if provided
      if (typeof onRetry === 'function') {
        try {
          await onRetry({
            attempt: retries,
            maxRetries,
            delay,
            error,
            lastResponse
          });
        } catch (callbackError) {
          logger.error('Error in retry callback:', { error: callbackError });
        }
      }

      // Wait for the calculated delay, but don't wait on the final attempt
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      retries++;
    }
  }

  // If we have a lastResponse with error details, use that
  if (lastResponse && lastResponse.error) {
    throw lastResponse.error;
  }
  
  // Otherwise, throw the last error
  throw lastError;
}

/**
 * Validates stock symbols against common exchange formats
 * @param {string} symbol - The stock symbol to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.allowDashes=true] - Whether to allow dashes in symbols
 * @param {boolean} [options.allowDots=true] - Whether to allow dots in symbols
 * @param {number} [options.minLength=1] - Minimum symbol length
 * @param {number} [options.maxLength=10] - Maximum symbol length
 * @returns {{isValid: boolean, reason?: string}} - Validation result with optional reason
 */
export function isValidStockSymbol(symbol, options = {}) {
  const {
    allowDashes = true,
    allowDots = true,
    minLength = 1,
    maxLength = 10
  } = options;
  
  if (typeof symbol !== 'string') {
    return { isValid: false, reason: 'Symbol must be a string' };
  }
  
  if (symbol.length < minLength || symbol.length > maxLength) {
    return { 
      isValid: false, 
      reason: `Symbol must be between ${minLength} and ${maxLength} characters` 
    };
  }
  
  // Build the regex pattern based on options
  let pattern = '^[A-Z0-9';
  if (allowDashes) pattern += '-';
  if (allowDots) pattern += '\\.';
  pattern += ']+$';
  
  const regex = new RegExp(pattern);
  
  if (!regex.test(symbol)) {
    return { 
      isValid: false, 
      reason: `Symbol contains invalid characters. Only letters, numbers${allowDashes ? ', dashes' : ''}${allowDots ? ', and dots' : ''} are allowed.`
    };
  }
  
  // Additional validation for specific patterns
  if (symbol.startsWith('.') || symbol.endsWith('.')) {
    return { 
      isValid: false, 
      reason: 'Symbol cannot start or end with a dot' 
    };
  }
  
  if (symbol.includes('..')) {
    return { 
      isValid: false, 
      reason: 'Symbol cannot contain consecutive dots' 
    };
  }
  
  return { isValid: true };
}

/**
 * Formats financial numbers for display with enhanced options
 * @param {number|string} number - The number to format
 * @param {Object|string} [options] - Formatting options or type string for backward compatibility
 * @param {string} [options.type='number'] - Type of formatting (currency, percentage, number, compact, ordinal)
 * @param {number} [options.decimals=2] - Number of decimal places
 * @param {string} [options.currency='USD'] - Currency code for currency formatting
 * @param {string} [options.locale='en-US'] - Locale for number formatting
 * @param {boolean} [options.allowNegative=true] - Whether to allow negative numbers
 * @param {string} [options.zeroValue='0'] - What to return for zero or falsy values
 * @returns {string} - Formatted string or zeroValue if input is invalid
 */
export function formatFinancialNumber(number, options = {}) {
  // Handle backward compatibility with string type parameter
  const opts = typeof options === 'string' ? { type: options } : options;
  
  const {
    type = 'number',
    decimals = 2,
    currency = 'USD',
    locale = 'en-US',
    allowNegative = true,
    zeroValue = '0'
  } = opts;
  
  // Handle null/undefined/empty string
  if (number === null || number === undefined || number === '') {
    return zeroValue;
  }
  
  // Convert string numbers to actual numbers
  const num = typeof number === 'string' ? parseFloat(number) : number;
  
  // Handle invalid numbers
  if (isNaN(num)) {
    logger.warn('Invalid number provided to formatFinancialNumber', { input: number });
    return zeroValue;
  }
  
  // Handle negative numbers if not allowed
  if (!allowNegative && num < 0) {
    return zeroValue;
  }
  
  // Handle zero with custom zeroValue
  if (num === 0) {
    return zeroValue;
  }
  
  // Configure number formatting options
  const formatOptions = {
    minimumFractionDigits: type === 'currency' ? 2 : 0,
    maximumFractionDigits: decimals,
    useGrouping: true
  };
  
  try {
    switch (type.toLowerCase()) {
      case 'currency':
        return new Intl.NumberFormat(locale, {
          ...formatOptions,
          style: 'currency',
          currency: currency || 'USD',
          currencyDisplay: 'symbol'
        }).format(num);
        
      case 'percentage':
        return new Intl.NumberFormat(locale, {
          ...formatOptions,
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: decimals
        }).format(num / 100);
        
      case 'compact':
        return new Intl.NumberFormat(locale, {
          ...formatOptions,
          notation: 'compact',
          compactDisplay: 'short'
        }).format(num);
        
      case 'ordinal':
        return new Intl.NumberFormat(locale, {
          ...formatOptions,
          style: 'ordinal'
        }).format(num);
        
      case 'number':
      default:
        return new Intl.NumberFormat(locale, formatOptions).format(num);
    }
  } catch (error) {
    logger.error('Error formatting number:', { 
      number: num, 
      type, 
      error: error.message,
      stack: error.stack 
    });
    return num.toString();
  }
}

/**
 * Safely parses JSON strings, with enhanced error handling and reviver support
 * @param {string} jsonString - The JSON string to parse
 * @param {any} [defaultValue=null] - The default value to return if parsing fails
 * @param {Function} [reviver] - A function that transforms the results
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.suppressErrors=true] - Whether to suppress parsing errors
 * @returns {any} - The parsed JSON or the default value
 */
export function safeJsonParse(jsonString, defaultValue = null, reviver, options = {}) {
  const { suppressErrors = true } = options;
  
  if (jsonString === undefined || jsonString === null) {
    return defaultValue;
  }
  
  // If it's already an object, return it
  if (typeof jsonString === 'object' && jsonString !== null) {
    return jsonString;
  }
  
  // If it's not a string, try to stringify it first
  if (typeof jsonString !== 'string') {
    try {
      jsonString = JSON.stringify(jsonString);
    } catch (stringifyError) {
      if (!suppressErrors) {
        logger.error('Error stringifying value for JSON parse', { 
          value: jsonString,
          error: stringifyError.message 
        });
      }
      return defaultValue;
    }
  }
  
  // Trim whitespace
  jsonString = jsonString.trim();
  
  // Handle empty strings after trim
  if (!jsonString) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(jsonString, reviver);
  } catch (error) {
    if (!suppressErrors) {
      logger.error('Error parsing JSON string', { 
        jsonString: jsonString.length > 100 ? jsonString.substring(0, 100) + '...' : jsonString,
        error: error.message,
        stack: error.stack 
      });
    }
    
    // Attempt to recover from common JSON issues
    try {
      // Try to fix common JSON issues
      const fixedJson = jsonString
        // Replace single quotes with double quotes
        .replace(/'/g, '"')
        // Remove trailing commas
        .replace(/,\s*([}\]])/g, '$1')
        // Fix unescaped quotes in strings
        .replace(/([^\\])\"/g, '$1\\"')
        // Fix newlines in strings
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
      
      return JSON.parse(fixedJson, reviver);
    } catch (recoveryError) {
      if (!suppressErrors) {
        logger.warn('Failed to recover malformed JSON', {
          originalError: error.message,
          recoveryError: recoveryError.message
        });
      }
      return defaultValue;
    }
  }
}

/**
 * Creates a standardized API response with enhanced features
 * @param {any} data - The response data
 * @param {Object} [options] - Response options
 * @param {string} [options.message=''] - Optional message
 * @param {boolean} [options.success=true] - Whether the operation was successful
 * @param {number} [options.statusCode=200] - HTTP status code
 * @param {string} [options.requestId] - Request ID for tracing
 * @param {Object} [options.metadata] - Additional metadata to include
 * @param {Object} [options.pagination] - Pagination information
 * @param {number} [options.pagination.page] - Current page number
 * @param {number} [options.pagination.pageSize] - Number of items per page
 * @param {number} [options.pagination.total] - Total number of items
 * @returns {Object} - Standardized response object
 */
export function createApiResponse(data = null, options = {}) {
  const {
    message = '',
    success = true,
    statusCode = 200,
    requestId,
    metadata,
    pagination
  } = typeof options === 'string' ? { message: options } : options;
  
  // Handle error objects
  let errorDetails;
  if (!success && data instanceof Error) {
    errorDetails = {
      name: data.name,
      message: data.message,
      ...(process.env.NODE_ENV === 'development' && { stack: data.stack })
    };
    
    // If it's a validation error, include validation details
    if (data.name === 'ValidationError' && data.errors) {
      errorDetails.errors = Object.values(data.errors).map(err => ({
        path: err.path,
        message: err.message,
        type: err.type
      }));
    }
  }
  
  const response = {
    success,
    status: statusCode,
    message: message || (success ? 'Operation completed successfully' : 'An error occurred'),
    timestamp: new Date().toISOString(),
    ...(data !== null && !(data instanceof Error) && { data }),
    ...(errorDetails && { error: errorDetails }),
    ...(requestId && { requestId }),
    ...(metadata && { metadata })
  };
  
  // Add pagination if provided
  if (pagination) {
    const { page, pageSize, total } = pagination;
    response.pagination = {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      total: Number(total) || 0,
      totalPages: Math.ceil(Number(total) / (Number(pageSize) || 10)) || 1
    };
  }
  
  return response;
}

/**
 * Validates user input for investment parameters with comprehensive validation
 * @param {Object} params - The parameters to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.requireAll=true] - Whether all fields are required
 * @param {Array<string>} [options.requiredFields] - Specific fields that are required
 * @returns {Object} - Validation result with detailed error information
 */
export function validateInvestmentParams(params, options = {}) {
  const {
    requireAll = true,
    requiredFields = ['symbol', 'amount', 'riskTolerance']
  } = options;
  
  const errors = [];
  const validated = {};
  
  // Check if params is an object
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return {
      isValid: false,
      errors: [{ field: 'params', message: 'Parameters must be an object' }],
      validated: {}
    };
  }
  
  // Check for required fields
  if (requireAll || requiredFields.length > 0) {
    const fieldsToCheck = requireAll ? Object.keys(params) : requiredFields;
    
    for (const field of fieldsToCheck) {
      if (requiredFields.includes(field) && (params[field] === undefined || params[field] === '')) {
        errors.push({
          field,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
        });
      }
    }
  }
  
  // Validate symbol if provided
  if ('symbol' in params) {
    const symbol = String(params.symbol || '').trim();
    const symbolValidation = isValidStockSymbol(symbol);
    
    if (!symbolValidation.isValid) {
      errors.push({
        field: 'symbol',
        message: symbolValidation.reason || 'Invalid stock symbol'
      });
    } else {
      validated.symbol = symbol.toUpperCase();
    }
  }
  
  // Validate amount if provided
  if ('amount' in params) {
    const amount = parseFloat(params.amount);
    
    if (isNaN(amount) || amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Amount must be a positive number'
      });
    } else if (amount > 1000000) { // Example limit
      errors.push({
        field: 'amount',
        message: 'Amount exceeds maximum allowed limit'
      });
    } else {
      validated.amount = amount;
    }
  }
  
  // Validate risk tolerance if provided
  if ('riskTolerance' in params) {
    const validRiskLevels = ['conservative', 'moderate', 'aggressive'];
    const riskTolerance = String(params.riskTolerance || '').toLowerCase();
    
    if (!validRiskLevels.includes(riskTolerance)) {
      errors.push({
        field: 'riskTolerance',
        message: `Must be one of: ${validRiskLevels.join(', ')}`,
        allowedValues: validRiskLevels
      });
    } else {
      validated.riskTolerance = riskTolerance;
    }
  }
  
  // Validate investment strategy if provided
  if ('strategy' in params && params.strategy) {
    const validStrategies = ['growth', 'income', 'balanced', 'value', 'index'];
    const strategy = String(params.strategy).toLowerCase();
    
    if (!validStrategies.includes(strategy)) {
      errors.push({
        field: 'strategy',
        message: `Invalid investment strategy. Must be one of: ${validStrategies.join(', ')}`,
        allowedValues: validStrategies
      });
    } else {
      validated.strategy = strategy;
    }
  }
  
  // Validate time horizon if provided
  if ('timeHorizon' in params && params.timeHorizon !== undefined) {
    const timeHorizon = parseInt(params.timeHorizon, 10);
    
    if (isNaN(timeHorizon) || timeHorizon < 1 || timeHorizon > 50) {
      errors.push({
        field: 'timeHorizon',
        message: 'Time horizon must be between 1 and 50 years'
      });
    } else {
      validated.timeHorizon = timeHorizon;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    validated: Object.keys(validated).length > 0 ? validated : undefined
  };
}

/**
 * Generates a unique request ID
 * @param {string} [prefix='req'] - Prefix for the request ID
 * @returns {string} - Unique request ID
 */
export function generateRequestId(prefix = 'req') {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Sanitizes user input to prevent XSS and other injection attacks
 * @param {string|Object|Array} input - The input to sanitize
 * @returns {any} - Sanitized input
 */
export function sanitizeInput(input) {
  if (input === null || input === undefined) {
    return input;
  }
  
  // Handle strings
  if (typeof input === 'string') {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // Handle arrays
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  // Handle objects
  if (typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  // Return as-is for numbers, booleans, etc.
  return input;
}

/**
 * Calculates the expected return on investment (ROI)
 * @param {number} principal - Initial investment amount
 * @param {number} rate - Expected annual return rate (as a decimal, e.g., 0.07 for 7%)
 * @param {number} years - Investment time horizon in years
 * @param {Object} [options] - Additional options
 * @param {number} [options.compoundFrequency=1] - Number of times interest is compounded per year
 * @param {number} [options.monthlyContribution=0] - Additional monthly contribution
 * @returns {Object} - Object containing total value, interest earned, and year-by-year breakdown
 */
export function calculateROI(principal, rate, years, options = {}) {
  const {
    compoundFrequency = 1,
    monthlyContribution = 0
  } = options;
  
  // Validate inputs
  if (principal < 0 || rate < 0 || years < 0 || compoundFrequency < 1) {
    throw new Error('Invalid input parameters');
  }
  
  const periods = years * compoundFrequency;
  const periodicRate = rate / compoundFrequency;
  const periodicContribution = monthlyContribution * (12 / compoundFrequency);
  
  let total = principal;
  const breakdown = [];
  
  // Calculate compound interest with regular contributions
  for (let i = 1; i <= periods; i++) {
    const interestEarned = total * periodicRate;
    total += interestEarned + periodicContribution;
    
    // Only add to breakdown once per year for readability
    if (i % compoundFrequency === 0) {
      breakdown.push({
        year: i / compoundFrequency,
        principal: principal + (periodicContribution * i),
        interest: total - principal - (periodicContribution * i),
        total: total
      });
    }
  }
  
  return {
    principal,
    finalAmount: total,
    interestEarned: total - principal - (monthlyContribution * 12 * years),
    totalContributions: principal + (monthlyContribution * 12 * years),
    breakdown
  };
}

/**
 * Formats a duration in milliseconds to a human-readable string
 * @param {number} ms - Duration in milliseconds
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.includeMs=false] - Whether to include milliseconds
 * @param {number} [options.precision=2] - Number of decimal places for seconds
 * @returns {string} - Formatted duration string
 */
export function formatDuration(ms, options = {}) {
  const { includeMs = false, precision = 2 } = options;
  
  if (ms < 0) return '0ms';
  
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  const parts = [];
  
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  if (includeMs || (ms < 1000 && ms > 0)) {
    const remainingMs = ms % 1000;
    if (remainingMs > 0) {
      parts.push(`${remainingMs}ms`);
    }
  } else if (seconds > 0 || parts.length === 0) {
    const secs = seconds + (ms % 1000) / 1000;
    parts.push(secs.toFixed(precision).replace(/\.?0+$/, '') + 's');
  }
  
  return parts.join(' ') || '0ms';
}

/**
 * Debounces a function to limit how often it can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} [options] - Options
 * @param {boolean} [options.leading=false] - Whether to invoke on the leading edge
 * @param {number} [options.maxWait] - The maximum time func is allowed to be delayed before it's invoked
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait, options = {}) {
  const { leading = false, maxWait } = options;
  
  let timeoutId;
  let lastCallTime;
  let lastInvokeTime = 0;
  let result;
  
  // Determine the maximum wait time
  const maxing = 'maxWait' in options;
  const maxWaitTime = maxing ? Math.max(Number(maxWait) || 0, wait) : null;
  
  // Check if we should invoke the function now
  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    
    // Either this is the first call, or it's been a while since the last call
    return (
      lastCallTime === undefined || 
      timeSinceLastCall >= wait ||
      (maxing && timeSinceLastInvoke >= maxWaitTime)
    );
  }
  
  // Invoke the function with the current arguments
  function invokeFunc(time, args) {
    const thisArg = this;
    const callArgs = args;
    
    lastInvokeTime = time;
    result = func.apply(thisArg, callArgs);
    return result;
  }
  
  // Start the timer for the trailing edge
  function startTimer(pendingFunc, waitTime) {
    return setTimeout(pendingFunc, waitTime);
  }
  
  // The function to call when the timer expires
  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;
    const remainingWait = maxing
      ? Math.min(timeWaiting, maxWaitTime - timeSinceLastInvoke)
      : timeWaiting;
    
    timeoutId = startTimer(timerExpired, remainingWait);
  }
  
  // The function to call at the leading edge
  function leadingEdge(time) {
    // Reset any `maxWait` timer
    lastInvokeTime = time;
    
    // Start the timer for the trailing edge
    timeoutId = startTimer(timerExpired, wait);
    
    // Invoke the leading function
    return leading ? invokeFunc(time, arguments) : result;
  }
  
  // The function to call at the trailing edge
  function trailingEdge(time) {
    timeoutId = undefined;
    
    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once
    if (lastCallTime && leading) {
      return invokeFunc(time, arguments);
    }
    
    return result;
  }
  
  // Cancel the current timer
  function cancelTimer() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
  
  // The debounced function
  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastCallTime = time;
    
    if (isInvoking) {
      if (timeoutId === undefined && leading) {
        return leadingEdge(lastCallTime);
      }
      
      if (maxing) {
        // Handle invocations in a tight loop
        timeoutId = startTimer(timerExpired, wait);
        return invokeFunc(lastCallTime, args);
      }
    }
    
    if (timeoutId === undefined) {
      timeoutId = startTimer(timerExpired, wait);
    }
    
    return result;
  }
  
  // Add cancel method
  debounced.cancel = function() {
    cancelTimer();
    lastCallTime = 0;
    lastInvokeTime = 0;
    timeoutId = undefined;
  };
  
  // Add flush method
  debounced.flush = function() {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  };
  
  // Add pending method
  debounced.pending = function() {
    return timeoutId !== undefined;
  };
  
  return debounced;
}

/**
 * Throttles a function to limit how often it can be called
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time in milliseconds to throttle invocations to
 * @param {Object} [options] - Options
 * @param {boolean} [options.leading=true] - Whether to invoke on the leading edge
 * @param {boolean} [options.trailing=true] - Whether to invoke on the trailing edge
 * @returns {Function} - The throttled function
 */
export function throttle(func, limit, options = {}) {
  const { leading = true, trailing = true } = options;
  let lastFunc;
  let lastRan;
  let timeout;

  return function(...args) {
    const context = this;
    
    if (!lastRan && leading) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        if (trailing && args.length > 0) {
          func.apply(context, args);
        }
        lastRan = Date.now();
        timeout = null;
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Creates a cache with TTL (time to live) support
 * @param {Object} [options] - Cache options
 * @param {number} [options.ttl=60000] - Default TTL in milliseconds
 * @param {number} [options.maxSize=1000] - Maximum number of items in the cache
 * @returns {Object} - Cache instance with get, set, delete, and clear methods
 */
export function createCache(options = {}) {
  const { ttl = 60 * 1000, maxSize = 1000 } = options;
  const cache = new Map();
  const timers = new Map();
  
  // Clean up expired items
  function cleanup() {
    const now = Date.now();
    for (const [key, { expiresAt }] of cache.entries()) {
      if (expiresAt && now > expiresAt) {
        cache.delete(key);
        if (timers.has(key)) {
          clearTimeout(timers.get(key));
          timers.delete(key);
        }
      }
    }
  }
  
  // Schedule the next cleanup
  let cleanupTimer;
  function scheduleCleanup() {
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
    }
    cleanupTimer = setTimeout(cleanup, Math.min(ttl, 5 * 60 * 1000)); // Clean up at least every 5 minutes
  }
  
  // Start the cleanup interval
  scheduleCleanup();
  
  return {
    /**
     * Get a value from the cache
     * @param {string} key - The cache key
     * @returns {any|undefined} - The cached value or undefined if not found or expired
     */
    get(key) {
      const item = cache.get(key);
      if (!item) return undefined;
      
      // Check if the item has expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.delete(key);
        return undefined;
      }
      
      return item.value;
    },
    
    /**
     * Set a value in the cache
     * @param {string} key - The cache key
     * @param {any} value - The value to cache
     * @param {Object} [options] - Cache options
     * @param {number} [options.ttl] - TTL in milliseconds (overrides default)
     * @returns {any} - The cached value
     */
    set(key, value, options = {}) {
      // Clean up if we're at max size
      if (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        this.delete(oldestKey);
      }
      
      const itemTtl = options.ttl !== undefined ? options.ttl : ttl;
      const expiresAt = itemTtl ? Date.now() + itemTtl : null;
      
      cache.set(key, { value, expiresAt });
      
      // Set up expiration timer
      if (expiresAt) {
        if (timers.has(key)) {
          clearTimeout(timers.get(key));
        }
        
        const timer = setTimeout(() => {
          cache.delete(key);
          timers.delete(key);
        }, itemTtl);
        
        timers.set(key, timer);
      }
      
      return value;
    },
    
    /**
     * Delete a value from the cache
     * @param {string} key - The cache key
     * @returns {boolean} - True if the key existed and was deleted
     */
    delete(key) {
      if (timers.has(key)) {
        clearTimeout(timers.get(key));
        timers.delete(key);
      }
      return cache.delete(key);
    },
    
    /**
     * Clear all items from the cache
     */
    clear() {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      
      cache.clear();
      timers.clear();
    },
    
    /**
     * Get the number of items in the cache
     * @returns {number} - The number of items in the cache
     */
    size() {
      return cache.size;
    },
    
    /**
     * Clean up resources used by the cache
     */
    destroy() {
      this.clear();
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
      }
    }
  };
}
