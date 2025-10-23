import { createClient } from '@supabase/supabase-js';
import 'cross-fetch/polyfill';
import logger from '../utils/logger.js';

// Validate required environment variables
const requiredVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
};

const missingVars = Object.entries(requiredVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  const error = new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  logger.error('Supabase client initialization failed', { 
    error: error.message,
    missingVars,
    environment: process.env.NODE_ENV || 'development'
  });
  throw error;
}

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } = requiredVars;
const isDevelopment = process.env.NODE_ENV === 'development';

// Create a custom fetch with retry logic and logging
const createCustomFetch = (maxRetries = 3, baseDelay = 1000) => {
  return async (url, options = {}) => {
    const startTime = Date.now();
    const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
    const method = options.method || 'GET';
    
    const logRequest = (attempt, error = null) => {
      const logData = {
        requestId,
        url: url.toString(),
        method,
        attempt,
        maxRetries,
        duration: `${Date.now() - startTime}ms`,
        ...(error && { 
          error: error.message,
          code: error.code,
          stack: isDevelopment ? error.stack : undefined
        })
      };
      
      if (error) {
        logger.error('Supabase request failed', logData);
      } else if (isDevelopment) {
        logger.debug('Supabase request', logData);
      }
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'X-Request-ID': requestId,
            'X-Client-Info': 'supabase-js/2.39.0'
          }
        });

        const responseTime = Date.now() - startTime;
        const responseData = {
          requestId,
          url: url.toString(),
          method,
          status: response.status,
          statusText: response.statusText,
          responseTime: `${responseTime}ms`,
          attempt
        };

        if (response.ok) {
          if (isDevelopment) {
            logger.debug('Supabase response', responseData);
          }
          return response;
        }

        // For non-2xx responses, throw an error to trigger retry
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.response = response;
        throw error;
      } catch (error) {
        logRequest(attempt, error);
        
        // Don't retry on client errors (4xx) except 408, 429, and 5xx
        if (error.status && error.status >= 400 && error.status < 500 && 
            error.status !== 408 && error.status !== 429) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5),
            10000 // Max 10 seconds
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Request failed after all retries');
  };
};

// Create regular client for browser usage
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      fetch: createCustomFetch()
    }
  }
);

// Create admin client for server-side operations
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      headers: {
        'X-Client-Info': 'supabase-js/2.39.0 admin'
      }
    },
    global: {
      fetch: createCustomFetch()
    }
  }
);

logger.info('Supabase clients initialized', {
  url: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
  hasServiceKey: !!SUPABASE_SERVICE_KEY,
  environment: process.env.NODE_ENV || 'development'
});
