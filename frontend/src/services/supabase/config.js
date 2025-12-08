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

// Debug logging to help diagnose environment variable issues
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 [Supabase Config] ========== ENVIRONMENT CHECK ==========');
  console.log('🔍 [Supabase Config] Environment check:', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_KEY,
    urlLength: SUPABASE_URL?.length || 0,
    keyLength: SUPABASE_KEY?.length || 0,
    urlPreview: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'missing',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  });
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ [Supabase Config] CRITICAL: Environment variables missing!');
    console.error('❌ [Supabase Config] Make sure .env file exists in frontend/ directory');
    console.error('❌ [Supabase Config] Variables must be: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    console.error('❌ [Supabase Config] RESTART THE DEV SERVER after adding/changing .env file!');
  } else {
    console.log('✅ [Supabase Config] Environment variables found!');
  }
  console.log('🔍 [Supabase Config] ============================================');
}

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
  console.error('❌ [Supabase Config] ========== CRITICAL ERROR ==========');
  console.error('❌ [Supabase Config] Supabase environment variables missing!');
  console.error('❌ [Supabase Config] Using offline stub - OAuth will NOT work!');
  console.error('❌ [Supabase Config]');
  console.error('❌ [Supabase Config] TO FIX:');
  console.error('❌ [Supabase Config] 1. Check frontend/.env file exists');
  console.error('❌ [Supabase Config] 2. Verify REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set');
  console.error('❌ [Supabase Config] 3. RESTART the dev server (npm start)');
  console.error('❌ [Supabase Config] ============================================');
  supabaseClient = createSupabaseStub();
} else {
  console.log('✅ [Supabase Config] Supabase client initialized with environment variables');
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
