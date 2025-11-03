import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * Retrieves Supabase credentials from environment variables for security.
 * Environment variables must be prefixed with REACT_APP_ for Create React App.
 * 
 * Required environment variables:
 * - REACT_APP_SUPABASE_URL: Your Supabase project URL
 * - REACT_APP_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 */

// Load Supabase credentials from environment variables
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate that required environment variables are present
if (!SUPABASE_URL || !SUPABASE_KEY) {
  const errorMsg = 'Missing required Supabase environment variables. Please check your .env file.';
  console.error(errorMsg);
  console.error('REACT_APP_SUPABASE_URL:', SUPABASE_URL || 'Not set');
  console.error('REACT_APP_SUPABASE_ANON_KEY:', SUPABASE_KEY ? '*** (exists but hidden for security)' : 'Not set');
  
  if (process.env.NODE_ENV === 'development') {
    throw new Error(errorMsg);
  }
}

console.log('✅ Supabase client initialized with environment variables');

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
