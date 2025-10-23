require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

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

/**
 * Creates a custom fetch function with retry logic and request/response logging
 * @param {string} clientType - Type of client ('anon' or 'admin')
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay between retries in ms
 * @returns {Function} Custom fetch function
 */
const createCustomFetch = (clientType = 'anon', maxRetries = 3, baseDelay = 1000) => {
  return async (url, options = {}) => {
    const startTime = Date.now();
    const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
    const method = options.method || 'GET';
    let lastError;

    const logRequest = (attempt, error = null) => {
      const logData = {
        clientType,
        requestId,
        url: url.toString(),
        method,
        attempt,
        maxRetries,
        duration: `${Date.now() - startTime}ms`,
        ...(error && { 
          error: error.message,
          code: error.code || error.name,
          status: error.status,
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
            'X-Client-Info': `supabase-js/2.39.0 (${clientType})`,
            'X-Client-Type': clientType
          }
        });

        const responseTime = Date.now() - startTime;
        const responseData = {
          clientType,
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
        lastError = error;
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
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('Unknown error occurred during Supabase request');
  };
};

// Default client options
const defaultClientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.39.0',
      'X-Initialized-At': new Date().toISOString()
    }
  },
  db: {
    schema: 'public'
  }
};

// Create regular client with anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  ...defaultClientOptions,
  global: {
    ...defaultClientOptions.global,
    fetch: createCustomFetch('anon')
  }
});

// Create admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  ...defaultClientOptions,
  auth: {
    ...defaultClientOptions.auth,
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    ...defaultClientOptions.global,
    fetch: createCustomFetch('admin'),
    headers: {
      ...defaultClientOptions.global.headers,
      'X-Client-Info': 'supabase-js/2.39.0 (admin)'
    }
  }
});

// Log successful initialization
logger.info('Supabase clients initialized', {
  url: SUPABASE_URL,
  clientTypes: ['anon', 'admin'],
  environment: process.env.NODE_ENV || 'development'
});

// Export both clients
export { supabase, supabaseAdmin };