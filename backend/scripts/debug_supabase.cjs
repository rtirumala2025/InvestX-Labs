const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

(async () => {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', url ? '✅ Present' : '❌ Missing');
    console.log('Key:', key ? `✅ Present (${key.substring(0, 10)}...)` : '❌ Missing');
    
    if (!url || !key) {
      console.error('❌ Missing required environment variables');
      return;
    }

    console.log('\n🔧 Creating Supabase client...');
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: require('node-fetch') }
    });

    console.log('\n🔍 Testing connection with a simple query...');
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      console.error('❌ Connection failed:', error);
    } else {
      console.log('✅ Connection successful!');
      console.log('PostgreSQL Version:', data);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
})();
