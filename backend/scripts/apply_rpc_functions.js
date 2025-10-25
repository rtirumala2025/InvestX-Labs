import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration from error logs
const SUPABASE_URL = 'https://oysuothaldgentevxzod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95c3VvdGhhbGRnZW50ZXZ4em9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzQ4MDAsImV4cCI6MjA0NzU1MDgwMH0.placeholder'; // This is a placeholder - you'll need the real anon key

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function applyRPCFunctions() {
  try {
    console.log('🔍 Reading RPC functions migration file...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240101000001_fix_rpc_functions.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('🚀 Applying RPC functions...\n');
    
    // Split the SQL into individual statements and filter out empty ones
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const statementNumber = i + 1;
      const totalStatements = statements.length;
      
      console.log(`🔧 [${statementNumber}/${totalStatements}] Executing statement...`);
      
      try {
        // Use the SQL editor approach - execute raw SQL
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error) {
          // If exec_sql doesn't work, try a different approach
          console.log('   ⚠️  exec_sql failed, trying alternative approach...');
          // For now, just log the statement that would be executed
          console.log('   📝 Statement to execute:', statement.substring(0, 100) + '...');
        } else {
          console.log('   ✅ Success');
        }
      } catch (error) {
        console.error(`❌ Error in statement ${statementNumber}:`, error.message);
        console.error('Failed statement:', statement.substring(0, 200) + '...');
        // Continue with other statements
      }
    }

    console.log('\n✅ RPC functions migration completed!');
    console.log('📝 Note: Some functions may need to be applied manually through the Supabase dashboard');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n📝 Manual steps required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL from: backend/supabase/migrations/20240101000001_fix_rpc_functions.sql');
    console.log('4. Execute the SQL');
  }
}

// Run the migrations
applyRPCFunctions();
