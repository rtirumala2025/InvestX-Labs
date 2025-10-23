import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Verify required environment variables
const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error(`Please check your .env file at: ${envPath}`);
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

async function applyMigrations() {
  try {
    console.log('🔍 Reading migration file...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20231021000000_initial_schema.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('🚀 Applying database migrations...\n');
    
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
        const { error } = await supabase.rpc('pg_cmd', { cmd: statement + ';' });
        if (error) throw error;
        console.log(`   ✅ Success`);
      } catch (error) {
        console.error(`❌ Error in statement ${statementNumber}:`, error.message);
        console.error('Failed statement:', statement.substring(0, 200) + '...');
        throw error;
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying tables were created...');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .in('schemaname', ['public']);
    
    if (tablesError) throw tablesError;
    
    const expectedTables = ['user_profiles', 'chat_sessions', 'chat_messages', 'analytics_events'];
    const createdTables = tables.map(t => t.tablename);
    const missingTables = expectedTables.filter(t => !createdTables.includes(t));
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    console.log('\n✅ All migrations applied successfully!');
    console.log('📊 Created tables:', createdTables.join(', '));
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the migrations
applyMigrations();
