import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import https from 'https';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

// Custom fetch with retry and timeout
const customFetch = async (url, options = {}) => {
  const maxRetries = 3;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

// Create Supabase client with enhanced configuration
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: customFetch,
      // Add custom agent with specific TLS options if needed
      // fetch: (url, options = {}) => {
      //   const httpsAgent = new https.Agent({
      //     rejectUnauthorized: false, // Only for testing!
      //     minVersion: 'TLSv1.2',
      //   });
      //   return fetch(url, { ...options, agent: httpsAgent });
      // },
    },
  });
};

// Create a test connection function
export const testConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    const supabase = createSupabaseClient();
    
    // Test connection with a simple query
    const { data, error } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('schemaname', 'public')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Connection successful!');
    console.log(`📊 Found ${data?.length || 0} tables in public schema`);
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
};

// Export the default client for backward compatibility
const supabase = createSupabaseClient();
export default supabase;
