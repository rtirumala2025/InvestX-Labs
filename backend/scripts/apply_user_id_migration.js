#!/usr/bin/env node

/**
 * Apply user_id migration to holdings and transactions tables
 * 
 * This script applies the migration that adds user_id columns to:
 * 1. holdings table
 * 2. transactions table
 * 
 * It uses Supabase's REST API to execute SQL via a helper function
 * or provides instructions for manual application.
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Verify required environment variables
const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredVars.filter(varName => 
  !process.env[varName] && !(varName === 'SUPABASE_SERVICE_ROLE_KEY' && process.env.SUPABASE_SERVICE_KEY)
);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error(`Please check your .env file at: ${envPath}`);
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

/**
 * Check if a column exists by trying to query it
 */
async function checkColumnExists(tableName, columnName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    return !error;
  } catch (err) {
    return false;
  }
}

/**
 * Apply migration using Supabase SQL execution
 * Since we can't execute DDL directly, we'll create a helper function first
 */
async function applyMigration() {
  console.log('🔍 Checking current database state...\n');

  // Check holdings table
  const holdingsHasUserId = await checkColumnExists('holdings', 'user_id');
  console.log(`   ${holdingsHasUserId ? '✅' : '❌'} holdings.user_id: ${holdingsHasUserId ? 'EXISTS' : 'MISSING'}`);

  // Check transactions table
  const transactionsHasUserId = await checkColumnExists('transactions', 'user_id');
  console.log(`   ${transactionsHasUserId ? '✅' : '❌'} transactions.user_id: ${transactionsHasUserId ? 'EXISTS' : 'MISSING'}`);

  if (holdingsHasUserId && transactionsHasUserId) {
    console.log('\n✅ All user_id columns already exist. No migration needed.');
    return { success: true, applied: false };
  }

  console.log('\n🔧 Applying migration...\n');

  // Read migration file
  const migrationPath = join(__dirname, '../supabase/migrations/20251113000004_fix_holdings_transactions.sql');
  let migrationSQL;
  
  try {
    migrationSQL = await readFile(migrationPath, 'utf8');
    console.log(`📝 Read migration file: ${migrationPath}\n`);
  } catch (err) {
    console.error(`❌ Could not read migration file: ${err.message}`);
    return { success: false, error: err.message };
  }

  // Since Supabase JS client can't execute DDL directly, we need to use a workaround
  // We'll create a helper function in Supabase that can execute the SQL
  // Or provide instructions for manual application

  console.log('⚠️  Supabase JS client cannot execute DDL statements directly.');
  console.log('📋 Please apply the migration using one of these methods:\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('METHOD 1: Supabase Dashboard (Easiest)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to: SQL Editor');
  console.log('3. Click "New Query"');
  console.log('4. Copy and paste the entire contents of:');
  console.log(`   ${migrationPath}`);
  console.log('5. Click "Run" (or press Cmd/Ctrl + Enter)');
  console.log('6. Verify the migration completed successfully\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('METHOD 2: Supabase CLI (Recommended for automation)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Install Supabase CLI: npm install -g supabase');
  console.log('2. Link your project:');
  console.log('   supabase link --project-ref YOUR_PROJECT_REF');
  console.log('3. Apply migration:');
  console.log('   supabase db push');
  console.log('   OR');
  console.log('   supabase migration up\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('METHOD 3: Direct psql connection (Advanced)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Get your database connection string from Supabase Dashboard');
  console.log('2. Run:');
  console.log(`   psql "YOUR_CONNECTION_STRING" -f ${migrationPath}\n`);

  // Try to apply using a workaround: create a function that executes the SQL
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ATTEMPTING AUTOMATED APPLICATION...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Try to execute the migration SQL in parts
  // We'll break it down into individual ALTER TABLE statements
  try {
    // Extract ALTER TABLE statements from the migration
    const alterStatements = migrationSQL.match(/ALTER TABLE[^;]+;/g) || [];
    
    if (alterStatements.length > 0) {
      console.log(`📝 Found ${alterStatements.length} ALTER TABLE statements\n`);
      
      // Note: We still can't execute these directly via JS client
      // But we can provide a more targeted approach
      console.log('⚠️  Direct execution not possible via JS client.');
      console.log('   Please use Method 1 (Dashboard) or Method 2 (CLI) above.\n');
    }
  } catch (err) {
    console.log('⚠️  Could not parse migration SQL automatically.\n');
  }

  // Show a preview of what needs to be applied
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('MIGRATION PREVIEW (First 1000 characters):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(migrationSQL.substring(0, 1000));
  console.log('\n... (truncated, see full file for complete SQL)\n');

  return { 
    success: false, 
    needsManualApplication: true,
    migrationPath,
    holdingsHasUserId,
    transactionsHasUserId
  };
}

/**
 * Verify migration was applied
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration application...\n');

  const holdingsHasUserId = await checkColumnExists('holdings', 'user_id');
  const transactionsHasUserId = await checkColumnExists('transactions', 'user_id');

  console.log(`   ${holdingsHasUserId ? '✅' : '❌'} holdings.user_id: ${holdingsHasUserId ? 'EXISTS' : 'MISSING'}`);
  console.log(`   ${transactionsHasUserId ? '✅' : '❌'} transactions.user_id: ${transactionsHasUserId ? 'EXISTS' : 'MISSING'}`);

  if (holdingsHasUserId && transactionsHasUserId) {
    console.log('\n✅ Migration verification PASSED. All columns exist.');
    return true;
  } else {
    console.log('\n❌ Migration verification FAILED. Some columns are still missing.');
    return false;
  }
}

// Main execution
async function main() {
  const result = await applyMigration();
  
  if (result.success && !result.applied) {
    // Already applied, verify
    await verifyMigration();
    process.exit(0);
  } else if (result.needsManualApplication) {
    console.log('\n⏳ Waiting for manual migration application...');
    console.log('   After applying the migration manually, run this script again to verify.\n');
    process.exit(1);
  } else {
    // Try to verify anyway
    const verified = await verifyMigration();
    process.exit(verified ? 0 : 1);
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

