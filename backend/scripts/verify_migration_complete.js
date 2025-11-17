#!/usr/bin/env node

/**
 * Verify Migration Complete
 * 
 * This script verifies that the user_id migration has been applied successfully
 * and that the dashboard should now work correctly.
 */

import { createClient } from '@supabase/supabase-js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
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
    continue;
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL environment variable');
  console.error('   Please set SUPABASE_URL in your .env file');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ Missing Supabase key (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY, or SUPABASE_ANON_KEY)');
  console.error('   Note: Service role key is preferred for schema checks');
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
      throw error;
    }
    return true;
  } catch (err) {
    if (err.message && err.message.includes('column') && err.message.includes('does not exist')) {
      return false;
    }
    throw err;
  }
}

/**
 * Main verification
 */
async function main() {
  console.log('🔍 Verifying user_id migration status...\n');
  console.log(`Supabase URL: ${supabaseUrl.substring(0, 30)}...\n`);

  const results = {
    holdings: null,
    transactions: null,
    allPassed: false
  };

  try {
    // Check holdings table
    console.log('📊 Checking holdings table...');
    results.holdings = await checkColumn('holdings', 'user_id');
    if (results.holdings === true) {
      console.log('   ✅ holdings.user_id: EXISTS');
    } else if (results.holdings === null) {
      console.log('   ⚠️  holdings table does not exist');
    } else {
      console.log('   ❌ holdings.user_id: MISSING');
    }

    // Check transactions table
    console.log('\n📊 Checking transactions table...');
    results.transactions = await checkColumn('transactions', 'user_id');
    if (results.transactions === true) {
      console.log('   ✅ transactions.user_id: EXISTS');
    } else if (results.transactions === null) {
      console.log('   ⚠️  transactions table does not exist');
    } else {
      console.log('   ❌ transactions.user_id: MISSING');
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(80));

    if (results.holdings === true && results.transactions === true) {
      console.log('✅ SUCCESS: All user_id columns exist!');
      console.log('\n✅ Migration verification PASSED');
      console.log('✅ Dashboard should now load correctly');
      console.log('\nNext steps:');
      console.log('  1. Restart backend: cd backend && npm run start');
      console.log('  2. Restart frontend: cd frontend && npm start');
      console.log('  3. Test dashboard in browser');
      console.log('  4. Run smoke tests: cd backend && node scripts/smoke_minimal.js');
      results.allPassed = true;
    } else {
      console.log('❌ FAILED: Missing user_id columns');
      console.log('\n⚠️  Migration needs to be applied');
      console.log('\nTo apply migration:');
      console.log('  1. Go to Supabase Dashboard → SQL Editor');
      console.log('  2. Copy contents of: backend/supabase/migrations/20251113000004_fix_holdings_transactions.sql');
      console.log('  3. Paste and click "Run"');
      console.log('\nOr see: MIGRATION_APPLICATION_GUIDE.md');
      results.allPassed = false;
    }

    return results;

  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
    if (error.message.includes('JWT')) {
      console.error('\n⚠️  Authentication error. Please check:');
      console.error('  - SUPABASE_URL is correct');
      console.error('  - SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is correct');
    }
    throw error;
  }
}

main()
  .then((results) => {
    process.exit(results.allPassed ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

