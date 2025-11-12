import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import fetch from 'node-fetch';
import path from 'path';
import logger from '../utils/logger.js';

dotenv.config({
  path: process.env.SUPABASE_ENV_PATH || path.resolve(process.cwd(), '.env'),
  override: true
});

// Expose fetch globally for supabase-js when running in Node
if (typeof globalThis.fetch !== 'function') {
  globalThis.fetch = fetch;
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3'
});

const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} = process.env;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

if (SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
  process.env.SUPABASE_SERVICE_KEY = SUPABASE_SERVICE_ROLE_KEY;
}

const logConfigStatus = () => {
  logger.info('Supabase configuration status', {
    hasUrl: Boolean(SUPABASE_URL),
    hasAnonKey: Boolean(SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY)
  });
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...options,
      agent: url.startsWith('https') ? httpsAgent : undefined,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Client-Info': 'supabase-js/2.76.1',
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const error = new Error(`Supabase fetch failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const createSupabaseClient = (key, label) => {
  if (!SUPABASE_URL || !key) {
    logger.warn(`Supabase ${label} client unavailable`, {
      hasUrl: Boolean(SUPABASE_URL),
      hasKey: Boolean(key)
    });
    return null;
  }

  return createClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      fetch: fetchWithTimeout,
      headers: {
        'X-Client-Info': 'supabase-js/2.76.1'
      }
    }
  });
};

const supabase = createSupabaseClient(SUPABASE_ANON_KEY, 'anon');
const adminSupabase = createSupabaseClient(SUPABASE_SERVICE_ROLE_KEY, 'service');

if (supabase && adminSupabase) {
  logger.info('Supabase clients initialized successfully');
} else {
  logConfigStatus();
}

const ensureServiceRoleKey = () => {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error('SUPABASE_SERVICE_ROLE_KEY is required for privileged operations');
    error.code = 'SUPABASE_SERVICE_ROLE_KEY_MISSING';
    logger.warn(error.message);
    throw error;
  }
  return SUPABASE_SERVICE_ROLE_KEY;
};

const handleSupabaseError = (error, context = {}) => {
  const normalized = {
    message: error.message || 'Supabase operation failed',
    code: error.code || error.status || 'SUPABASE_ERROR',
    details: error.details,
    hint: error.hint,
    status: error.status
  };

  logger.error('Supabase error', {
    ...context,
    ...normalized
  });

  return normalized;
};

export {
  supabase,
  adminSupabase,
  ensureServiceRoleKey,
  handleSupabaseError
};
