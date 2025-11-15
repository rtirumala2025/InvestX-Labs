#!/usr/bin/env node

/**
 * Apply the fix migration for schema issues
 * This script applies the migration that fixes:
 * 1. Missing is_simulation column in portfolios table
 * 2. Missing achievements table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '../.env');
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

async function applyFixMigration() {
  try {
    console.log('🔍 Reading fix migration file...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251113000000_fix_schema_issues.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('🚀 Applying fix migration...\n');
    console.log('This migration will:');
    console.log('  1. Add is_simulation column to portfolios table');
    console.log('  2. Create achievements table with frontend-compatible schema');
    console.log('  3. Set up RLS policies\n');

    // Note: Supabase doesn't have a direct way to execute raw SQL via the client
    // The best approach is to use the Supabase Dashboard SQL Editor or Supabase CLI
    // For now, we'll provide instructions
    
    console.log('⚠️  IMPORTANT: Supabase client cannot directly execute DDL statements.');
    console.log('Please apply this migration using one of these methods:\n');
    console.log('Method 1: Supabase Dashboard (Recommended)');
    console.log('  1. Go to your Supabase project dashboard');
    console.log('  2. Navigate to SQL Editor');
    console.log('  3. Copy and paste the contents of:');
    console.log(`     ${migrationPath}`);
    console.log('  4. Click "Run" to execute the migration\n');
    console.log('Method 2: Supabase CLI');
    console.log('  1. Install Supabase CLI: npm install -g supabase');
    console.log('  2. Link your project: supabase link --project-ref your-project-ref');
    console.log('  3. Run migration: supabase db push\n');
    console.log('Method 3: Direct SQL execution');
    console.log('  If you have direct database access, you can run the SQL file directly.\n');

    // Attempt to verify the migration was applied by checking for the tables
    console.log('🔍 Checking if migration was already applied...\n');
    
    // Check for portfolios table and is_simulation column
    try {
      const { data: portfolios, error: portfoliosError } = await supabase
        .from('portfolios')
        .select('id')
        .limit(1);
      
      if (!portfoliosError) {
        console.log('✅ Portfolios table exists');
        
        // Try to query is_simulation column
        const { error: columnError } = await supabase
          .from('portfolios')
          .select('is_simulation')
          .limit(1);
        
        if (!columnError) {
          console.log('✅ is_simulation column exists in portfolios table');
        } else {
          console.log('❌ is_simulation column does NOT exist in portfolios table');
          console.log('   Please apply the migration to add this column.\n');
        }
      } else {
        console.log('⚠️  Portfolios table does not exist yet');
        console.log('   The migration will create it.\n');
      }
    } catch (err) {
      console.log('⚠️  Could not verify portfolios table:', err.message);
    }

    // Check for achievements table
    try {
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('id')
        .limit(1);
      
      if (!achievementsError) {
        console.log('✅ Achievements table exists\n');
      } else {
        console.log('❌ Achievements table does NOT exist');
        console.log('   Please apply the migration to create this table.\n');
      }
    } catch (err) {
      console.log('⚠️  Could not verify achievements table:', err.message);
      console.log('   Please apply the migration to create this table.\n');
    }

    console.log('📄 Migration file location:');
    console.log(`   ${migrationPath}\n`);
    console.log('📋 Migration SQL preview (first 500 characters):');
    console.log('   ' + migrationSQL.substring(0, 500) + '...\n');

    console.log('✅ Migration file is ready to be applied.');
    console.log('   Please use one of the methods above to apply it to your database.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the migration check
applyFixMigration();

