#!/usr/bin/env node

/**
 * Apply user_id fix migration
 * 
 * This script attempts to apply the migration that adds user_id columns
 * to holdings and transactions tables using the best available method.
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
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
    return !error;
  } catch {
    return false;
  }
}

/**
 * Try to apply via Supabase CLI
 */
function trySupabaseCLI(migrationPath) {
  try {
    console.log('🔧 Attempting to apply via Supabase CLI...\n');
    execSync('which supabase', { stdio: 'ignore' });
    
    // Check if linked
    try {
      execSync('supabase status', { stdio: 'ignore' });
    } catch {
      console.log('⚠️  Supabase project not linked. Linking required.');
      console.log('   Run: supabase link --project-ref YOUR_PROJECT_REF\n');
      return false;
    }

    // Try to push migration
    console.log('📤 Pushing migration via Supabase CLI...');
    execSync(`supabase db push`, { stdio: 'inherit', cwd: join(__dirname, '..') });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Checking current database state...\n');

  const holdingsHasUserId = await checkColumn('holdings', 'user_id');
  const transactionsHasUserId = await checkColumn('transactions', 'user_id');

  console.log(`   ${holdingsHasUserId ? '✅' : '❌'} holdings.user_id: ${holdingsHasUserId ? 'EXISTS' : 'MISSING'}`);
  console.log(`   ${transactionsHasUserId ? '✅' : '❌'} transactions.user_id: ${transactionsHasUserId ? 'EXISTS' : 'MISSING'}`);

  if (holdingsHasUserId && transactionsHasUserId) {
    console.log('\n✅ All columns exist. No migration needed.');
    return;
  }

  console.log('\n🔧 Applying migration...\n');

  const migrationPath = join(__dirname, '../supabase/migrations/20251113000004_fix_holdings_transactions.sql');

  // Try Supabase CLI first
  if (trySupabaseCLI(migrationPath)) {
    console.log('\n✅ Migration applied via Supabase CLI');
    
    // Verify
    const holdingsNow = await checkColumn('holdings', 'user_id');
    const transactionsNow = await checkColumn('transactions', 'user_id');
    
    if (holdingsNow && transactionsNow) {
      console.log('✅ Verification passed. All columns exist.');
      return;
    }
  }

  // Manual application required
  console.log('\n' + '='.repeat(80));
  console.log('MANUAL MIGRATION REQUIRED');
  console.log('='.repeat(80));
  console.log('\n📋 Please apply the migration using one of these methods:\n');
  
  console.log('METHOD 1: Supabase Dashboard (Easiest)');
  console.log('  1. Go to: https://supabase.com/dashboard');
  console.log('  2. Select your project');
  console.log('  3. Navigate to: SQL Editor → New Query');
  console.log(`  4. Copy contents of: ${migrationPath}`);
  console.log('  5. Paste and click "Run"\n');

  console.log('METHOD 2: Supabase CLI');
  console.log('  1. Install: npm install -g supabase');
  console.log('  2. Link: supabase link --project-ref YOUR_PROJECT_REF');
  console.log('  3. Push: supabase db push\n');

  const migrationSQL = await readFile(migrationPath, 'utf8');
  console.log('📄 Migration SQL (first 500 chars):');
  console.log('─'.repeat(80));
  console.log(migrationSQL.substring(0, 500) + '...');
  console.log('─'.repeat(80));
}

main().catch(console.error);

