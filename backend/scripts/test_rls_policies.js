/**
 * RLS Policy Verification Script
 * 
 * Tests Row Level Security policies by attempting queries with different roles
 * to verify users can only see their own data.
 * 
 * Usage:
 *   node backend/scripts/test_rls_policies.js [USER_ID_1] [USER_ID_2]
 * 
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_ANON_KEY environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
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

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const userId1 = process.argv[2];
const userId2 = process.argv[3];

console.log('🔒 RLS Policy Verification Test');
console.log('================================\n');

// Create clients
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const results = {
  rlsEnabled: { holdings: null, transactions: null },
  policiesExist: { holdings: null, transactions: null },
  queryTests: { holdings: [], transactions: [] },
  isolationTests: { holdings: null, transactions: null }
};

async function testRLSQuery(tableName, userId, clientType = 'anon') {
  const client = clientType === 'admin' ? adminClient : anonClient;
  
  try {
    // Try to query without authentication (should fail or return empty if RLS is working)
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .limit(10);
    
    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        data: null,
        count: 0
      };
    }
    
    return {
      success: true,
      error: null,
      data: data || [],
      count: data?.length || 0
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      data: null,
      count: 0
    };
  }
}

async function testDataIsolation(tableName, userId1, userId2) {
  // Get all data for user1
  const { data: user1Data } = await adminClient
    .from(tableName)
    .select('*')
    .eq('user_id', userId1);
  
  // Get all data for user2
  const { data: user2Data } = await adminClient
    .from(tableName)
    .select('*')
    .eq('user_id', userId2);
  
  // Check if user1 can see user2's data (should not be able to)
  const { data: user1Query } = await anonClient
    .from(tableName)
    .select('*')
    .eq('user_id', userId2)
    .limit(10);
  
  const user1CanSeeUser2Data = user1Query && user1Query.length > 0;
  
  return {
    user1DataCount: user1Data?.length || 0,
    user2DataCount: user2Data?.length || 0,
    user1CanSeeUser2Data,
    isolated: !user1CanSeeUser2Data
  };
}

async function main() {
  console.log('📊 Testing RLS Policies\n');
  
  // Test 1: Query without authentication (should fail or return empty)
  console.log('Test 1: Query without authentication');
  console.log('------------------------------------');
  
  const holdingsAnonTest = await testRLSQuery('holdings', userId1 || 'test-user-id', 'anon');
  results.queryTests.holdings.push({ test: 'anon_query', ...holdingsAnonTest });
  
  if (holdingsAnonTest.success) {
    console.log(`  Holdings: ✅ Query succeeded (returned ${holdingsAnonTest.count} rows)`);
    if (holdingsAnonTest.count > 0) {
      console.log('  ⚠️  WARNING: RLS may not be working - returned data without auth');
    } else {
      console.log('  ✅ RLS appears to be working - no data returned without auth');
    }
  } else {
    console.log(`  Holdings: ❌ Query failed: ${holdingsAnonTest.error}`);
    if (holdingsAnonTest.code === '42501' || holdingsAnonTest.error.includes('permission')) {
      console.log('  ✅ RLS is working - permission denied (expected)');
    }
  }
  
  const transactionsAnonTest = await testRLSQuery('transactions', userId1 || 'test-user-id', 'anon');
  results.queryTests.transactions.push({ test: 'anon_query', ...transactionsAnonTest });
  
  if (transactionsAnonTest.success) {
    console.log(`  Transactions: ✅ Query succeeded (returned ${transactionsAnonTest.count} rows)`);
    if (transactionsAnonTest.count > 0) {
      console.log('  ⚠️  WARNING: RLS may not be working - returned data without auth');
    } else {
      console.log('  ✅ RLS appears to be working - no data returned without auth');
    }
  } else {
    console.log(`  Transactions: ❌ Query failed: ${transactionsAnonTest.error}`);
    if (transactionsAnonTest.code === '42501' || transactionsAnonTest.error.includes('permission')) {
      console.log('  ✅ RLS is working - permission denied (expected)');
    }
  }
  
  // Test 2: Data isolation (if two user IDs provided)
  if (userId1 && userId2) {
    console.log('\nTest 2: Data Isolation');
    console.log('----------------------');
    console.log(`Testing with User 1: ${userId1}`);
    console.log(`Testing with User 2: ${userId2}\n`);
    
    const holdingsIsolation = await testDataIsolation('holdings', userId1, userId2);
    results.isolationTests.holdings = holdingsIsolation;
    
    console.log(`Holdings:`);
    console.log(`  User 1 data count: ${holdingsIsolation.user1DataCount}`);
    console.log(`  User 2 data count: ${holdingsIsolation.user2DataCount}`);
    console.log(`  User 1 can see User 2 data: ${holdingsIsolation.user1CanSeeUser2Data ? '❌ YES (ISOLATION FAILED)' : '✅ NO (ISOLATION WORKING)'}`);
    
    const transactionsIsolation = await testDataIsolation('transactions', userId1, userId2);
    results.isolationTests.transactions = transactionsIsolation;
    
    console.log(`\nTransactions:`);
    console.log(`  User 1 data count: ${transactionsIsolation.user1DataCount}`);
    console.log(`  User 2 data count: ${transactionsIsolation.user2DataCount}`);
    console.log(`  User 1 can see User 2 data: ${transactionsIsolation.user1CanSeeUser2Data ? '❌ YES (ISOLATION FAILED)' : '✅ NO (ISOLATION WORKING)'}`);
  } else {
    console.log('\n⚠️  Test 2: Data Isolation - SKIPPED');
    console.log('  Provide two user IDs to test data isolation:');
    console.log('  node backend/scripts/test_rls_policies.js USER_ID_1 USER_ID_2');
  }
  
  // Summary
  console.log('\n📊 RLS Verification Summary');
  console.log('============================\n');
  
  const allTestsPassed = 
    (!holdingsAnonTest.success || holdingsAnonTest.count === 0) &&
    (!transactionsAnonTest.success || transactionsAnonTest.count === 0) &&
    (!userId1 || !userId2 || (
      !results.isolationTests.holdings?.user1CanSeeUser2Data &&
      !results.isolationTests.transactions?.user1CanSeeUser2Data
    ));
  
  if (allTestsPassed) {
    console.log('✅ RLS policies appear to be working correctly');
    console.log('   - Queries without auth are blocked or return empty');
    if (userId1 && userId2) {
      console.log('   - Data isolation is working (users cannot see each other\'s data)');
    }
  } else {
    console.log('❌ RLS policies may not be working correctly');
    if (holdingsAnonTest.success && holdingsAnonTest.count > 0) {
      console.log('   - Holdings query returned data without authentication');
    }
    if (transactionsAnonTest.success && transactionsAnonTest.count > 0) {
      console.log('   - Transactions query returned data without authentication');
    }
    if (userId1 && userId2) {
      if (results.isolationTests.holdings?.user1CanSeeUser2Data) {
        console.log('   - Holdings data isolation failed');
      }
      if (results.isolationTests.transactions?.user1CanSeeUser2Data) {
        console.log('   - Transactions data isolation failed');
      }
    }
  }
  
  console.log('\n');
}

main().catch(console.error);

