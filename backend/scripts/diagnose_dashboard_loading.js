/**
 * Dashboard Loading Diagnostic Script
 * 
 * This script diagnoses why the dashboard is stuck loading by:
 * 1. Verifying database schema
 * 2. Checking RLS policies
 * 3. Testing realtime subscriptions
 * 4. Testing frontend fetch queries
 * 
 * Usage:
 *   node backend/scripts/diagnose_dashboard_loading.js [USER_ID]
 * 
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_ANON_KEY environment variable (for client-side queries)
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable (for admin queries)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL environment variable');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  console.error('   At least one key is required for testing');
  process.exit(1);
}

const userId = process.argv[2];

// Create clients
const anonClient = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const adminClient = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;
const testClient = adminClient || anonClient;

console.log('🔍 Dashboard Loading Diagnostic Tool');
console.log('=====================================\n');

// Expected columns
const EXPECTED_HOLDINGS_COLUMNS = [
  'id', 'user_id', 'portfolio_id', 'symbol', 'company_name', 
  'shares', 'purchase_price', 'purchase_date', 'current_price', 
  'sector', 'asset_type', 'created_at', 'updated_at'
];

const EXPECTED_TRANSACTIONS_COLUMNS = [
  'id', 'user_id', 'portfolio_id', 'transaction_date', 'transaction_type',
  'symbol', 'shares', 'price', 'total_amount', 'fees', 'notes', 
  'metadata', 'created_at', 'updated_at'
];

const results = {
  schema: { holdings: {}, transactions: {} },
  rls: { holdings: {}, transactions: {} },
  realtime: { holdings: {}, transactions: {} },
  queries: { holdings: {}, transactions: {} },
  frontend: {}
};

async function checkTableExists(tableName) {
  try {
    const { data, error } = await testClient
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      return { exists: false, error: 'Table does not exist' };
    }
    return { exists: true, error: null };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function checkColumns(tableName, expectedColumns) {
  // We can't directly query information_schema via Supabase client
  // So we'll test by trying to select each column
  const found = [];
  const missing = [];
  
  for (const col of expectedColumns) {
    try {
      const { error } = await testClient
        .from(tableName)
        .select(col)
        .limit(0);
      
      if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        missing.push(col);
      } else {
        found.push(col);
      }
    } catch (err) {
      if (err.message.includes('column') && err.message.includes('does not exist')) {
        missing.push(col);
      } else {
        found.push(col);
      }
    }
  }
  
  return { found, missing };
}

async function checkRLS(tableName) {
  // RLS can't be checked directly via Supabase client
  // We'll test by attempting a query with anon key
  if (!anonClient) {
    return { enabled: null, error: 'No anon key available for RLS test' };
  }
  
  try {
    const { data, error } = await anonClient
      .from(tableName)
      .select('id')
      .limit(1);
    
    // If we get a permission error, RLS is likely enabled
    if (error && (error.code === '42501' || error.message.includes('permission'))) {
      return { enabled: true, error: null, message: 'RLS appears enabled (permission denied without auth)' };
    }
    
    // If we get data without auth, RLS might not be enabled
    if (data !== null && !error) {
      return { enabled: false, error: null, message: 'RLS might not be enabled (query succeeded without auth)' };
    }
    
    return { enabled: null, error: null, message: 'Unable to determine RLS status' };
  } catch (err) {
    return { enabled: null, error: err.message };
  }
}

async function testRealtimeSubscription(tableName) {
  return new Promise((resolve) => {
    if (!testClient) {
      resolve({ success: false, error: 'No client available' });
      return;
    }
    
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ success: false, error: 'Timeout waiting for subscription', subscribed: false });
      }
    }, 5000);
    
    const channel = testClient
      .channel(`diagnostic-${tableName}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: tableName
      }, (payload) => {
        // Subscription is working
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({ success: true, error: null, subscribed: true });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({ success: true, error: null, subscribed: true });
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({ success: false, error: `Subscription ${status}`, subscribed: false });
          }
        }
      });
    
    // Clean up after test
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        testClient.removeChannel(channel);
        resolve({ success: false, error: 'Subscription did not connect', subscribed: false });
      }
    }, 3000);
  });
}

async function testFrontendQuery(tableName, userId) {
  if (!userId) {
    return { success: false, error: 'No user_id provided for test' };
  }
  
  if (!anonClient) {
    return { success: false, error: 'No anon client available (needed for RLS test)' };
  }
  
  try {
    const { data, error } = await anonClient
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .limit(10);
    
    if (error) {
      return { success: false, error: error.message, code: error.code, data: null };
    }
    
    return { success: true, error: null, data: data || [], count: data?.length || 0 };
  } catch (err) {
    return { success: false, error: err.message, data: null };
  }
}

async function main() {
  console.log('📊 STEP 1: Database Schema Verification\n');
  
  // Check holdings table
  console.log('Checking holdings table...');
  const holdingsExists = await checkTableExists('holdings');
  results.schema.holdings.exists = holdingsExists.exists;
  
  if (holdingsExists.exists) {
    console.log('  ✅ holdings table exists');
    const holdingsColumns = await checkColumns('holdings', EXPECTED_HOLDINGS_COLUMNS);
    results.schema.holdings.columns = holdingsColumns;
    console.log(`  ✅ Found ${holdingsColumns.found.length} columns`);
    if (holdingsColumns.missing.length > 0) {
      console.log(`  ❌ Missing columns: ${holdingsColumns.missing.join(', ')}`);
    }
  } else {
    console.log('  ❌ holdings table does not exist');
    console.log(`  Error: ${holdingsExists.error}`);
  }
  
  // Check transactions table
  console.log('\nChecking transactions table...');
  const transactionsExists = await checkTableExists('transactions');
  results.schema.transactions.exists = transactionsExists.exists;
  
  if (transactionsExists.exists) {
    console.log('  ✅ transactions table exists');
    const transactionsColumns = await checkColumns('transactions', EXPECTED_TRANSACTIONS_COLUMNS);
    results.schema.transactions.columns = transactionsColumns;
    console.log(`  ✅ Found ${transactionsColumns.found.length} columns`);
    if (transactionsColumns.missing.length > 0) {
      console.log(`  ❌ Missing columns: ${transactionsColumns.missing.join(', ')}`);
    }
  } else {
    console.log('  ❌ transactions table does not exist');
    console.log(`  Error: ${transactionsExists.error}`);
  }
  
  console.log('\n📋 STEP 2: RLS Policies Verification\n');
  
  const holdingsRLS = await checkRLS('holdings');
  results.rls.holdings = holdingsRLS;
  console.log(`Holdings RLS: ${holdingsRLS.enabled === true ? '✅ Enabled' : holdingsRLS.enabled === false ? '⚠️  Not Enabled' : '❓ Unknown'}`);
  if (holdingsRLS.message) console.log(`  ${holdingsRLS.message}`);
  
  const transactionsRLS = await checkRLS('transactions');
  results.rls.transactions = transactionsRLS;
  console.log(`Transactions RLS: ${transactionsRLS.enabled === true ? '✅ Enabled' : transactionsRLS.enabled === false ? '⚠️  Not Enabled' : '❓ Unknown'}`);
  if (transactionsRLS.message) console.log(`  ${transactionsRLS.message}`);
  
  console.log('\n🔄 STEP 3: Realtime Subscription Test\n');
  
  const holdingsRealtime = await testRealtimeSubscription('holdings');
  results.realtime.holdings = holdingsRealtime;
  console.log(`Holdings Realtime: ${holdingsRealtime.success ? '✅ Connected' : '❌ Failed'}`);
  if (holdingsRealtime.error) console.log(`  Error: ${holdingsRealtime.error}`);
  
  const transactionsRealtime = await testRealtimeSubscription('transactions');
  results.realtime.transactions = transactionsRealtime;
  console.log(`Transactions Realtime: ${transactionsRealtime.success ? '✅ Connected' : '❌ Failed'}`);
  if (transactionsRealtime.error) console.log(`  Error: ${transactionsRealtime.error}`);
  
  if (userId) {
    console.log('\n🔍 STEP 4: Frontend Query Test\n');
    console.log(`Testing with user_id: ${userId}\n`);
    
    const holdingsQuery = await testFrontendQuery('holdings', userId);
    results.queries.holdings = holdingsQuery;
    console.log(`Holdings Query: ${holdingsQuery.success ? '✅ Success' : '❌ Failed'}`);
    if (holdingsQuery.success) {
      console.log(`  Found ${holdingsQuery.count} rows`);
    } else {
      console.log(`  Error: ${holdingsQuery.error}`);
      if (holdingsQuery.code) console.log(`  Code: ${holdingsQuery.code}`);
    }
    
    const transactionsQuery = await testFrontendQuery('transactions', userId);
    results.queries.transactions = transactionsQuery;
    console.log(`Transactions Query: ${transactionsQuery.success ? '✅ Success' : '❌ Failed'}`);
    if (transactionsQuery.success) {
      console.log(`  Found ${transactionsQuery.count} rows`);
    } else {
      console.log(`  Error: ${transactionsQuery.error}`);
      if (transactionsQuery.code) console.log(`  Code: ${transactionsQuery.code}`);
    }
  } else {
    console.log('\n⚠️  STEP 4: Frontend Query Test - SKIPPED');
    console.log('  No user_id provided. Run with: node diagnose_dashboard_loading.js <USER_ID>');
  }
  
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('=====================\n');
  
  // Generate summary
  const issues = [];
  
  if (!results.schema.holdings.exists) {
    issues.push('❌ holdings table does not exist');
  } else if (results.schema.holdings.columns?.missing?.length > 0) {
    issues.push(`❌ holdings missing columns: ${results.schema.holdings.columns.missing.join(', ')}`);
  }
  
  if (!results.schema.transactions.exists) {
    issues.push('❌ transactions table does not exist');
  } else if (results.schema.transactions.columns?.missing?.length > 0) {
    issues.push(`❌ transactions missing columns: ${results.schema.transactions.columns.missing.join(', ')}`);
  }
  
  if (results.rls.holdings.enabled === false) {
    issues.push('⚠️  RLS not enabled on holdings table');
  }
  
  if (results.rls.transactions.enabled === false) {
    issues.push('⚠️  RLS not enabled on transactions table');
  }
  
  if (!results.realtime.holdings.success) {
    issues.push(`❌ Holdings realtime subscription failed: ${results.realtime.holdings.error}`);
  }
  
  if (!results.realtime.transactions.success) {
    issues.push(`❌ Transactions realtime subscription failed: ${results.realtime.transactions.error}`);
  }
  
  if (userId) {
    if (!results.queries.holdings.success) {
      issues.push(`❌ Holdings query failed: ${results.queries.holdings.error}`);
    }
    if (!results.queries.transactions.success) {
      issues.push(`❌ Transactions query failed: ${results.queries.transactions.error}`);
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ No issues detected! All checks passed.');
    console.log('\nIf dashboard is still loading, check:');
    console.log('  1. Browser console for JavaScript errors');
    console.log('  2. Network tab for failed requests');
    console.log('  3. React DevTools for component state');
  } else {
    console.log('❌ Issues detected:\n');
    issues.forEach(issue => console.log(`  ${issue}`));
  }
  
  console.log('\n');
}

main().catch(console.error);

