/**
 * General helper functions
 */

/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function to limit the rate of function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return prefix ? `${prefix}_${timestamp}_${randomStr}` : `${timestamp}_${randomStr}`;
};

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Get nested object property safely
 * @param {Object} obj - Object to get property from
 * @param {string} path - Dot-separated path to property
 * @param {*} defaultValue - Default value if property doesn't exist
 * @returns {*} Property value or default value
 */
export const getNestedProperty = (obj, path, defaultValue = undefined) => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || !result.hasOwnProperty(key)) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result;
};

/**
 * Set nested object property safely
 * @param {Object} obj - Object to set property on
 * @param {string} path - Dot-separated path to property
 * @param {*} value - Value to set
 * @returns {Object} Updated object
 */
export const setNestedProperty = (obj, path, value) => {
  const keys = path.split('.');
  const result = deepClone(obj);
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return result;
};

/**
 * Remove duplicates from an array
 * @param {Array} array - Array to remove duplicates from
 * @param {string} key - Optional key to compare objects by
 * @returns {Array} Array with duplicates removed
 */
export const removeDuplicates = (array, key = null) => {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const value = typeof item === 'object' ? item[key] : item;
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Group array items by a key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

/**
 * Sort array by a key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted array
 */
export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = typeof a === 'object' ? a[key] : a;
    const bVal = typeof b === 'object' ? b[key] : b;
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
};

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add if truncated
 * @returns {string} Truncated string
 */
export const truncate = (str, length, suffix = '...') => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + suffix;
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after sleep
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(delay);
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Check if code is running in browser
 * @returns {boolean} True if in browser
 */
export const isBrowser = () => {
  return typeof window !== 'undefined';
};

/**
 * Check if code is running in development mode
 * @returns {boolean} True if in development
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if code is running in production mode
 * @returns {boolean} True if in production
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {*} fallback - Fallback value
 * @returns {*} Environment variable value or fallback
 */
export const getEnvVar = (key, fallback = null) => {
  return process.env[key] || fallback;
};

/**
 * Create a promise that rejects after timeout
 * @param {number} ms - Timeout in milliseconds
 * @param {string} message - Error message
 * @returns {Promise} Promise that rejects after timeout
 */
export const timeout = (ms, message = 'Operation timed out') => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
};

/**
 * Race a promise against a timeout
 * @param {Promise} promise - Promise to race
 * @param {number} ms - Timeout in milliseconds
 * @param {string} message - Timeout error message
 * @returns {Promise} Promise that resolves with result or rejects with timeout
 */
export const withTimeout = (promise, ms, message = 'Operation timed out') => {
  return Promise.race([promise, timeout(ms, message)]);
};
