#!/usr/bin/env node

/**
 * Execute user_id migration
 * 
 * This script attempts to apply the migration using available methods:
 * 1. Direct SQL execution via Supabase REST API (if RPC function exists)
 * 2. Instructions for manual application
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from multiple possible locations
const envPaths = [
  join(__dirname, '../../.env'),
  join(__dirname, '../.env'),
  join(process.cwd(), '.env')
];

for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath });
    if (process.env.SUPABASE_URL) break;
  } catch (e) {
    // Continue to next path
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)');
  console.error('\n📋 To apply migration manually:');
  console.error('   1. Go to Supabase Dashboard → SQL Editor');
  console.error(`   2. Run: backend/supabase/migrations/20251113000004_fix_holdings_transactions.sql`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
});

/**
 * Check if column exists
 */
async function checkColumn(tableName, columnName) {
  try {
    const { error } = await supabase.from(tableName).select(columnName).limit(1);
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        return false;
      }
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return null; // Table doesn't exist
      }
    }
    return !error;
  } catch {
    return false;
  }
}

/**
 * Try to execute SQL via RPC
 */
async function tryExecuteSQL(sql) {
  // Try common RPC function names
  const rpcFunctions = ['exec_sql', 'exec', 'pg_cmd', 'execute_sql'];
  
  for (const funcName of rpcFunctions) {
    try {
      const { data, error } = await supabase.rpc(funcName, { 
        sql: sql,
        query: sql,
        cmd: sql 
      });
      
      if (!error) {
        return { success: true, method: funcName };
      }
    } catch (err) {
      // Try next function
      continue;
    }
  }
  
  return { success: false };
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Checking current database state...\n');

  const holdingsHasUserId = await checkColumn('holdings', 'user_id');
  const transactionsHasUserId = await checkColumn('transactions', 'user_id');

  console.log(`   ${holdingsHasUserId === true ? '✅' : holdingsHasUserId === null ? '⚠️' : '❌'} holdings.user_id: ${holdingsHasUserId === true ? 'EXISTS' : holdingsHasUserId === null ? 'TABLE NOT FOUND' : 'MISSING'}`);
  console.log(`   ${transactionsHasUserId === true ? '✅' : transactionsHasUserId === null ? '⚠️' : '❌'} transactions.user_id: ${transactionsHasUserId === true ? 'EXISTS' : transactionsHasUserId === null ? 'TABLE NOT FOUND' : 'MISSING'}`);

  if (holdingsHasUserId === true && transactionsHasUserId === true) {
    console.log('\n✅ All user_id columns already exist. Migration not needed.');
    return { applied: false, alreadyExists: true };
  }

  console.log('\n🔧 Attempting to apply migration...\n');

  const migrationPath = join(__dirname, '../supabase/migrations/20251113000004_fix_holdings_transactions.sql');
  const migrationSQL = await readFile(migrationPath, 'utf8');

  // Try to execute via RPC
  console.log('📤 Attempting automated application via Supabase RPC...');
  const rpcResult = await tryExecuteSQL(migrationSQL);
  
  if (rpcResult.success) {
    console.log(`✅ Migration applied via RPC function: ${rpcResult.method}`);
    
    // Verify
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for migration to complete
    
    const holdingsNow = await checkColumn('holdings', 'user_id');
    const transactionsNow = await checkColumn('transactions', 'user_id');
    
    if (holdingsNow === true && transactionsNow === true) {
      console.log('\n✅ Verification passed. All columns exist.');
      return { applied: true, verified: true };
    } else {
      console.log('\n⚠️  Migration may have been applied, but verification failed.');
      console.log('   Please verify manually in Supabase Dashboard.');
      return { applied: true, verified: false };
    }
  }

  // RPC execution not available - provide manual instructions
  console.log('⚠️  Automated application not available.');
  console.log('\n' + '='.repeat(80));
  console.log('MANUAL MIGRATION REQUIRED');
  console.log('='.repeat(80));
  console.log('\n📋 Please apply the migration using Supabase Dashboard:\n');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Navigate to: SQL Editor → New Query');
  console.log(`4. Copy contents of: ${migrationPath}`);
  console.log('5. Paste into SQL Editor');
  console.log('6. Click "Run" (or press Cmd/Ctrl + Enter)');
  console.log('7. Verify success message\n');
  
  console.log('📄 Migration file location:');
  console.log(`   ${migrationPath}\n`);

  return { applied: false, needsManual: true, migrationPath };
}

main()
  .then((result) => {
    if (result.applied && result.verified) {
      console.log('\n✅ Migration successfully applied and verified!');
      process.exit(0);
    } else if (result.alreadyExists) {
      console.log('\n✅ Database schema is already correct.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Manual migration required. See instructions above.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });

