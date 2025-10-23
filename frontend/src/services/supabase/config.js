import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase configuration (temporary for testing)
const SUPABASE_URL = 'https://oysuothaldgentevxzod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95c3VvdGhhbGRnZW50ZXZ4em9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5ODk2ODcsImV4cCI6MjA3NjU2NTY4N30.s-28PFHVIVYPpvDELiBNDFBmKhi2F-9dw803mr2NnKU';

console.log('Using hardcoded Supabase configuration');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  const errorMsg = 'Missing required Supabase environment variables. Please check your .env file.';
  console.error(errorMsg);
  console.error('REACT_APP_SUPABASE_URL:', SUPABASE_URL);
  console.error('REACT_APP_SUPABASE_ANON_KEY:', SUPABASE_KEY ? '*** (key exists but hidden)' : 'Not set');
  throw new Error(errorMsg);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
