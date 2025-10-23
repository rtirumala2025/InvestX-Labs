const { createClient } = require('@supabase/supabase-js');
const { promises: fs } = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Verify required environment variables
const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Read the SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20231021000000_initial_schema.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔧 [${i + 1}/${statements.length}] Executing statement...`);
      
      try {
        // Try using the exec RPC function first
        const { error } = await supabase.rpc('exec', { 
          sql: statement + (statement.endsWith(';') ? '' : ';') 
        });
        
        if (error) {
          // If exec fails, try with pg_cmd
          const { error: pgError } = await supabase.rpc('pg_cmd', { 
            cmd: statement + (statement.endsWith(';') ? '' : ';') 
          });
          
          if (pgError) throw pgError;
        }
        
        console.log('   ✅ Success');
      } catch (error) {
        console.error('   ❌ Error:', error.message);
        console.error('   Failed statement:', statement.substring(0, 150) + (statement.length > 150 ? '...' : ''));
        throw error;
      }
    }
    
    console.log('\n✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
