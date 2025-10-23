import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from './auth';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'X-Request-Id': () => uuidv4(),
  },
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  async (config) => {
    // Add auth token if available
    const session = getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    // Add request timestamp for caching
    config.metadata = { 
      ...config.metadata, 
      startTime: new Date(),
      requestId: config.headers['X-Request-Id']
    };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    // Log successful API call
    console.debug(`API ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`, {
      url: response.config.url,
      status: response.status,
      duration,
      requestId: response.config.metadata.requestId,
    });
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const response = error.response;
    
    // Log error
    console.error(`API Error: ${error.message}`, {
      url: originalRequest?.url,
      status: response?.status,
      requestId: originalRequest?.headers['X-Request-Id'],
      error: error.message,
    });

    // Handle 401 Unauthorized
    if (response?.status === 401) {
      // Handle token refresh logic here if needed
      // const session = getSession();
      // if (session?.refreshToken) {
      //   try {
      //     const newToken = await refreshToken(session.refreshToken);
      //     originalRequest.headers.Authorization = `Bearer ${newToken}`;
      //     return apiClient(originalRequest);
      // } catch (refreshError) {
      //   clearSession();
      //   window.location.href = '/login';
      //   return Promise.reject(refreshError);
      // }
    }

    return Promise.reject(error);
  }
);

// Cache configuration
const cacheConfig = {
  defaultTtl: 5 * 60 * 1000, // 5 minutes default cache time
  maxSize: 100, // Max number of items in cache
};

// Simple in-memory cache
const cache = new Map();

/**
 * Make an API request with caching and retry logic
 * @param {Object} config - Axios request config
 * @param {Object} options - Additional options
 * @param {number} options.retries - Number of retry attempts (default: 2)
 * @param {boolean} options.useCache - Whether to use cache (default: false)
 * @param {number} options.cacheTtl - Cache TTL in milliseconds (default: 5 minutes)
 * @returns {Promise} - Axios response
 */
const request = async (config, { 
  retries = 2, 
  useCache = false, 
  cacheTtl = cacheConfig.defaultTtl 
} = {}) => {
  const cacheKey = config.url + JSON.stringify(config.params || {});
  const now = Date.now();
  
  // Check cache if enabled
  if (useCache && cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (now - timestamp < cacheTtl) {
      console.debug(`Cache hit for ${cacheKey}`);
      return { data, fromCache: true };
    }
    // Remove expired cache entry
    cache.delete(cacheKey);
  }
  
  // Make the request with retry logic
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await apiClient({
        ...config,
        // Add cache control headers
        headers: {
          ...config.headers,
          'Cache-Control': useCache ? `max-age=${Math.floor(cacheTtl / 1000)}` : 'no-cache',
        },
      });
      
      // Cache the response if successful and caching is enabled
      if (useCache && response.data) {
        // Enforce max cache size
        if (cache.size >= cacheConfig.maxSize) {
          const oldestKey = cache.keys().next().value;
          cache.delete(oldestKey);
        }
        
        cache.set(cacheKey, {
          data: response.data,
          timestamp: now,
        });
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't retry for these status codes
      const nonRetryableStatuses = [400, 401, 403, 404, 422];
      if (error.response && nonRetryableStatuses.includes(error.response.status)) {
        break;
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      if (i < retries) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Helper methods for common HTTP methods
const get = (url, params = {}, options = {}) => 
  request({ method: 'get', url, params }, options);

const post = (url, data = {}, options = {}) => 
  request({ method: 'post', url, data }, options);

const put = (url, data = {}, options = {}) => 
  request({ method: 'put', url, data }, options);

const del = (url, options = {}) => 
  request({ method: 'delete', url }, options);

export { get, post, put, del };
export default apiClient;
