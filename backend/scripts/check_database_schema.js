#!/usr/bin/env node

/**
 * Check database schema for user_id columns
 * This script verifies if user_id columns exist in holdings and transactions tables
 */

import { createClient } from '@supabase/supabase-js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Check for environment variables (try both locations)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)');
  console.error(`\nPlease check your .env file at: ${envPath}`);
  console.error('\nNote: This script requires Supabase service role key to check schema.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

/**
 * Check if a column exists by trying to query it
 */
async function checkColumnExists(tableName, columnName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    if (error) {
      // Check if it's a column error or table error
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        return false;
      }
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.warn(`   ⚠️  Table ${tableName} does not exist`);
        return null; // Table doesn't exist
      }
      throw error;
    }
    return true;
  } catch (err) {
    if (err.message.includes('column') && err.message.includes('does not exist')) {
      return false;
    }
    throw err;
  }
}

async function main() {
  console.log('🔍 Checking database schema for user_id columns...\n');
  console.log(`Supabase URL: ${supabaseUrl.substring(0, 30)}...\n`);

  let holdingsHasUserId = null;
  let transactionsHasUserId = null;

  // Check holdings table
  console.log('📊 Checking holdings table...');
  try {
    holdingsHasUserId = await checkColumnExists('holdings', 'user_id');
    if (holdingsHasUserId === null) {
      console.log('   ⚠️  Table does not exist');
    } else {
      console.log(`   ${holdingsHasUserId ? '✅' : '❌'} user_id column: ${holdingsHasUserId ? 'EXISTS' : 'MISSING'}`);
    }
  } catch (err) {
    console.error(`   ❌ Error checking holdings table: ${err.message}`);
  }

  // Check transactions table
  console.log('\n📊 Checking transactions table...');
  try {
    transactionsHasUserId = await checkColumnExists('transactions', 'user_id');
    if (transactionsHasUserId === null) {
      console.log('   ⚠️  Table does not exist');
    } else {
      console.log(`   ${transactionsHasUserId ? '✅' : '❌'} user_id column: ${transactionsHasUserId ? 'EXISTS' : 'MISSING'}`);
    }
  } catch (err) {
    console.error(`   ❌ Error checking transactions table: ${err.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  if (holdingsHasUserId === true && transactionsHasUserId === true) {
    console.log('✅ All user_id columns exist. Database schema is correct.');
    console.log('\n✅ No migration needed.');
    return { needsMigration: false, holdingsHasUserId: true, transactionsHasUserId: true };
  } else {
    console.log('❌ Missing user_id columns detected.');
    console.log('\n📋 Migration required. Please apply:');
    console.log('   backend/supabase/migrations/20251113000004_fix_holdings_transactions.sql');
    console.log('\nSee instructions in: backend/scripts/apply_user_id_migration.js');
    return { 
      needsMigration: true, 
      holdingsHasUserId: holdingsHasUserId === true,
      transactionsHasUserId: transactionsHasUserId === true
    };
  }
}

main()
  .then((result) => {
    process.exit(result.needsMigration ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

