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

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const createSupabaseStub = () => {
  const error = new Error('Supabase client is not configured. Running in offline/read-only mode.');
  error.code = 'SUPABASE_OFFLINE';

  const reject = async () => {
    throw error;
  };

  const queryBuilder = () => ({
    select: reject,
    insert: reject,
    update: reject,
    delete: reject,
    upsert: reject,
    eq: () => queryBuilder(),
    single: reject,
    maybeSingle: async () => ({ data: null, error }),
    limit: () => queryBuilder(),
    order: () => queryBuilder()
  });

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error }),
      getUser: async () => ({ data: { user: null }, error }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: reject,
      signUp: reject,
      signOut: reject,
      updateUser: reject,
      resetPasswordForEmail: reject,
      resend: reject,
      signInWithOAuth: reject
    },
    from: queryBuilder,
    rpc: reject,
    channel: () => ({
      on: () => ({
        subscribe: () => ({
          unsubscribe: () => {}
        })
      })
    }),
    removeChannel: () => {}
  };
};

let supabaseClient;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase environment variables missing; using offline stub.');
  supabaseClient = createSupabaseStub();
} else {
  console.log('✅ Supabase client initialized with environment variables');
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

export const supabase = supabaseClient;
