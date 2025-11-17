import { supabase } from '../supabase/config';

// Cache configuration
const cacheConfig = {
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  enabled: process.env.NODE_ENV === 'production',
};

// Simple in-memory cache
const cache = new Map();

/**
 * Make an API request with caching and retry logic
 * @param {Object} config - Request config
 * @param {string} config.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} config.url - API endpoint
 * @param {Object} [config.data] - Request body (for POST/PUT)
 * @param {Object} [config.params] - Query parameters (for GET)
 * @param {Object} [options] - Additional options
 * @param {number} [options.retries=2] - Number of retry attempts
 * @param {boolean} [options.useCache=false] - Whether to use cache
 * @param {number} [options.cacheTtl] - Cache TTL in milliseconds
 * @returns {Promise<Object>} - Response data
 */
async function request(config, { 
  retries = 2, 
  useCache = false, 
  cacheTtl = cacheConfig.defaultTtl 
} = {}) {
  const { method = 'GET', url, data, params = {} } = config;
  const cacheKey = JSON.stringify({ method, url, params, data });

  // Return cached response if available and valid
  if (useCache && cacheConfig.enabled) {
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < cacheTtl)) {
      return { ...cached.response, cached: true };
    }
  }

  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      let response;
      
      // Handle different HTTP methods
      switch (method.toLowerCase()) {
        case 'get':
          response = await supabase.rpc(url, params);
          break;
          
        case 'post':
        case 'put':
        case 'delete':
          response = await supabase.rpc(url, { data: { ...data, ...params } });
          break;
          
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      // Check for errors
      const { data: result, error } = response;
      
      if (error) {
        throw error;
      }

      // Cache the successful response
      if (useCache && cacheConfig.enabled) {
        cache.set(cacheKey, {
          response: { data: result },
          timestamp: Date.now(),
        });
      }
      
      return { data: result };
      
    } catch (error) {
      lastError = error;
      
      // Don't retry for 4xx errors (except 408, 429, 500-599)
      if (error.status && error.status >= 400 && error.status < 500 && 
          error.status !== 408 && error.status !== 429) {
        break;
      }
      
      // Add delay before retry (exponential backoff)
      if (i < retries) {
        const delay = Math.min(1000 * Math.pow(2, i), 30000); // Max 30s delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Make a GET request
 * @param {string} url - API endpoint
 * @param {Object} [params] - Query parameters
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} - Response data
 */
const get = (url, params = {}, options = {}) => 
  request({ method: 'GET', url, params }, options);

/**
 * Make a POST request
 * @param {string} url - API endpoint
 * @param {Object} [data] - Request body
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} - Response data
 */
const post = (url, data = {}, options = {}) =>
  request({ method: 'POST', url, data }, options);

/**
 * Make a PUT request
 * @param {string} url - API endpoint
 * @param {Object} [data] - Request body
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} - Response data
 */
const put = (url, data = {}, options = {}) =>
  request({ method: 'PUT', url, data }, options);

/**
 * Make a DELETE request
 * @param {string} url - API endpoint
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>} - Response data
 */
const del = (url, options = {}) =>
  request({ method: 'DELETE', url }, options);

/**
 * Wrapper for API calls with retry logic
 * @param {Function} fn - The function to retry
 * @param {Object} options - Retry options
 * @param {number} [options.retries=2] - Number of retry attempts
 * @param {number} [options.delay=1000] - Base delay between retries in ms
 * @returns {Promise} - Promise that resolves with the function result or rejects after all retries
 */
async function withRetry(fn, { retries = 2, delay = 1000 } = {}) {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry for 4xx errors (except 408, 429, 500-599)
      if (error.status && error.status >= 400 && error.status < 500 && 
          error.status !== 408 && error.status !== 429) {
        break;
      }
      
      if (i < retries) {
        // Exponential backoff with jitter
        const backoff = delay * Math.pow(2, i);
        const jitter = Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, backoff + jitter));
      }
    }
  }
  
  throw lastError;
}

/**
 * Handle API errors consistently
 * @param {Error} error - The error object
 * @param {Object} context - Additional context for error handling
 * @returns {Object} - Normalized error object
 */
function handleApiError(error, context = {}) {
  console.error('API Error:', {
    message: error.message,
    code: error.code,
    status: error.status,
    ...context,
  });
  
  // Return a normalized error object
  return {
    message: error.message || 'An unknown error occurred',
    code: error.code || 'UNKNOWN_ERROR',
    status: error.status,
    originalError: error,
    ...context,
  };
}

// Export all the HTTP methods and utilities
export {
  get,
  post,
  put,
  del as delete,
  withRetry,
  handleApiError,
  request
};

// For backward compatibility
export default {
  get,
  post,
  put,
  delete: del,
  withRetry,
  handleApiError,
  request
};
