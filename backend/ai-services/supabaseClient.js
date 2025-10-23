import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import https from 'https';
import fetch from 'node-fetch';
import logger from '../utils/logger.js';

// Set global fetch for any dependencies
global.fetch = fetch;

// Create a custom HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // WARNING: Only for development!
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES256-GCM-SHA384'
  ].join(':')
});

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath, override: true });

// Debug log environment variables
console.log('Environment variables loaded:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Present' : '❌ Missing',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? '✅ Present' : '❌ Missing'
});

// Validate required environment variables
const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  const error = new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  logger.error('Supabase client initialization failed', { 
    error: error.message,
    missingVars,
    environment: process.env.NODE_ENV || 'development'
  });
  throw error;
}

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } = process.env;

// Simple fetch wrapper with timeout and custom HTTPS agent
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url, {
      ...options,
      agent: url.startsWith('https') ? httpsAgent : undefined,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Client-Info': 'supabase-js/2.39.0',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response;
  } catch (error) {
    logger.error('Fetch error:', {
      url,
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

// Initialize Supabase clients with minimal configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    fetch: fetchWithTimeout,
    headers: {
      'X-Client-Info': 'supabase-js/2.39.0'
    }
  }
});

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    fetch: fetchWithTimeout,
    headers: {
      'X-Client-Info': 'supabase-js/2.39.0'
    }
  }
});

logger.info('Supabase clients initialized successfully', {
  url: SUPABASE_URL,
  clientTypes: ['anon', 'admin'],
  environment: process.env.NODE_ENV || 'development'
});

export { supabase, adminSupabase };
