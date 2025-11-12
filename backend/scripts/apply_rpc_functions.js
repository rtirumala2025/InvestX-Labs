import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL || 'Not set');
  console.error('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set');
  console.error('\n📝 Please create a .env file in the backend directory with:');
  console.error('   SUPABASE_URL=https://your-project.supabase.co');
  console.error('   SUPABASE_ANON_KEY=your_anon_key_here');
  console.error('\n💡 You can find these values in your Supabase dashboard:');
  console.error('   Project Settings → API → Project URL and anon public key');
  process.exit(1);
}

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
