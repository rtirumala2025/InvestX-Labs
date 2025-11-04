const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Test connection by listing tables
    console.log('🔍 Listing tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) throw tablesError;
    
    console.log('✅ Connected to Supabase successfully!');
    console.log('📊 Available tables:', tables.map(t => t.tablename).join(', '));
    
    // Test CRUD operations on user_profiles table if it exists
    if (tables.some(t => t.tablename === 'user_profiles')) {
      console.log('\n🔍 Testing CRUD operations...');
      
      // Test insert
      const testUser = {
        id: 'test-user-' + Date.now(),
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertedUser, error: insertError } = await supabase
        .from('user_profiles')
        .insert(testUser)
        .select()
        .single();
        
      if (insertError) throw insertError;
      console.log('✅ Test user created successfully');
      
      // Test read
      const { data: readUser, error: readError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testUser.id)
        .single();
        
      if (readError || !readUser) throw new Error('Failed to read test user');
      console.log('✅ Test user read successfully');
      
      // Test delete
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUser.id);
        
      if (deleteError) throw deleteError;
      console.log('✅ Test user deleted successfully');
      
      console.log('\n✅ CRUD operations test passed!');
    } else {
      console.log('ℹ️ user_profiles table not found, skipping CRUD test');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
