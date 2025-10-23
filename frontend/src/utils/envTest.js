console.log('Environment Variables Test:');
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Not Set');
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Not Set');

export const testEnv = {
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
  supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY
};
