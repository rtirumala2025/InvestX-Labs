#!/usr/bin/env node

/**
 * Comprehensive Supabase Audit Test Script
 * 
 * Tests Supabase connection, lists tables, RPCs, and validates configuration.
 * Run: node backend/scripts/test_supabase_comprehensive.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const results = {
  passed: 0,
  failed: 0,
  tests: [],
  tables: [],
  rpcs: []
};

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => {
    console.log(`✅ ${msg}`);
    results.passed++;
  },
  error: (msg, err) => {
    console.log(`❌ ${msg}`);
    if (err) console.error('   Error:', err.message);
    results.failed++;
  },
  section: (msg) => console.log(`\n━━━ ${msg} ━━━`)
};

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  log.error('Missing required Supabase environment variables');
  process.exit(1);
}

log.info(`Supabase URL: ${SUPABASE_URL}`);
log.info('Anon key: ' + (SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'));
log.info('Service role key: ' + (SUPABASE_SERVICE_KEY ? 'Set (hidden)' : 'Not set'));
log.info('Google Client ID: ' + (GOOGLE_CLIENT_ID ? 'Set (hidden)' : 'Not set'));
log.info('Google Client Secret: ' + (GOOGLE_CLIENT_SECRET ? 'Set (hidden)' : 'Not set (backend only)'));

// Create Supabase clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

const supabaseService = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
}) : null;

/**
 * Test 1: Environment Variables
 */
async function testEnvironmentVariables() {
  log.section('Test 1: Environment Variables');
  
  const checks = {
    'SUPABASE_URL': SUPABASE_URL,
    'SUPABASE_ANON_KEY': SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_KEY': SUPABASE_SERVICE_KEY,
    'GOOGLE_CLIENT_ID': GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': GOOGLE_CLIENT_SECRET
  };
  
  let allPresent = true;
  for (const [key, value] of Object.entries(checks)) {
    if (value) {
      log.success(`${key}: Present`);
    } else {
      log.error(`${key}: Missing`);
      allPresent = false;
    }
  }
  
  results.tests.push({ name: 'Environment Variables', status: allPresent ? 'passed' : 'failed' });
  return allPresent;
}

/**
 * Test 2: Database Connection and Tables
 */
async function testDatabaseTables() {
  log.section('Test 2: Database Tables');
  
  const testClient = supabaseService || supabaseAnon;
  const keyType = supabaseService ? 'service_role' : 'anon';
  
  log.info(`Using ${keyType} key for table access`);
  
  // Common tables to check
  const tablesToCheck = [
    'user_profiles',
    'portfolios',
    'holdings',
    'transactions',
    'chat_sessions',
    'chat_messages',
    'market_news',
    'leaderboard_scores',
    'user_achievements',
    'spending_analysis'
  ];
  
  const accessibleTables = [];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await testClient
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          log.info(`${table}: Table does not exist`);
        } else if (error.code === '42501' || error.message.includes('permission denied')) {
          log.info(`${table}: Table exists but RLS blocked (expected with ${keyType} key)`);
          accessibleTables.push({ name: table, status: 'exists_RLS_blocked' });
        } else {
          log.info(`${table}: Error - ${error.message}`);
        }
      } else {
        log.success(`${table}: Accessible`);
        accessibleTables.push({ name: table, status: 'accessible' });
        results.tables.push(table);
      }
    } catch (error) {
      log.info(`${table}: Error - ${error.message}`);
    }
  }
  
  log.info(`Found ${accessibleTables.length} accessible tables`);
  results.tests.push({ name: 'Database Tables', status: 'passed', tables: accessibleTables });
  return true;
}

/**
 * Test 3: RPC Functions
 */
async function testRPCFunctions() {
  log.section('Test 3: RPC Functions');
  
  const testClient = supabaseService || supabaseAnon;
  
  // RPC functions to test
  const rpcsToTest = [
    { name: 'get_leaderboard', params: { p_limit: 1 } },
    { name: 'get_user_profile', params: { p_user_id: '00000000-0000-0000-0000-000000000000' } },
    { name: 'calculate_portfolio_metrics', params: {} },
    { name: 'award_achievement', params: {} },
    { name: 'get_quote', params: { p_symbol: 'AAPL' } }
  ];
  
  const accessibleRPCs = [];
  
  for (const rpc of rpcsToTest) {
    try {
      const { data, error } = await testClient.rpc(rpc.name, rpc.params);
      
      if (error) {
        if (error.code === '42883' || error.message.includes('function') || error.message.includes('does not exist')) {
          log.info(`${rpc.name}: RPC function does not exist`);
        } else {
          // Function exists but may have parameter issues - that's okay
          log.success(`${rpc.name}: RPC function exists (parameter error expected)`);
          accessibleRPCs.push({ name: rpc.name, status: 'exists' });
          results.rpcs.push(rpc.name);
        }
      } else {
        log.success(`${rpc.name}: Accessible`);
        accessibleRPCs.push({ name: rpc.name, status: 'accessible' });
        results.rpcs.push(rpc.name);
      }
    } catch (error) {
      if (error.message.includes('function') || error.message.includes('does not exist')) {
        log.info(`${rpc.name}: RPC function does not exist`);
      } else {
        log.info(`${rpc.name}: Error - ${error.message}`);
      }
    }
  }
  
  log.info(`Found ${accessibleRPCs.length} accessible RPC functions`);
  results.tests.push({ name: 'RPC Functions', status: 'passed', rpcs: accessibleRPCs });
  return true;
}

/**
 * Test 4: Google OAuth
 */
async function testGoogleOAuth() {
  log.section('Test 4: Google OAuth Configuration');
  
  try {
    // Test OAuth URL generation
    const { data, error } = await supabaseAnon.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`
      }
    });
    
    if (error) {
      if (error.message.includes('Unsupported provider') || error.message.includes('provider not enabled')) {
        log.error('Google provider not enabled in Supabase');
        results.tests.push({ name: 'Google OAuth', status: 'failed', error: 'Provider not enabled' });
        return false;
      }
      throw error;
    }
    
    if (data?.url) {
      log.success('Google OAuth provider is accessible');
      log.info(`OAuth URL generated successfully`);
      log.info(`Redirect URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`);
      log.info(`Supabase callback: ${SUPABASE_URL}/auth/v1/callback`);
      results.tests.push({ name: 'Google OAuth', status: 'passed' });
      return true;
    } else {
      log.error('OAuth URL not generated');
      results.tests.push({ name: 'Google OAuth', status: 'failed', error: 'No URL generated' });
      return false;
    }
  } catch (error) {
    log.error('Google OAuth test failed', error);
    results.tests.push({ name: 'Google OAuth', status: 'failed', error: error.message });
    return false;
  }
}

/**
 * Test 5: RLS Test with Service Role Key
 */
async function testRLSWithServiceKey() {
  log.section('Test 5: RLS Test with Service Role Key');
  
  if (!supabaseService) {
    log.info('Service role key not set - skipping RLS test');
    results.tests.push({ name: 'RLS Test', status: 'skipped', note: 'Service key not available' });
    return true;
  }
  
  try {
    const { data, error } = await supabaseService
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        log.error('Table user_profiles does not exist');
        results.tests.push({ name: 'RLS Test', status: 'failed', error: 'Table not found' });
        return false;
      }
      throw error;
    }
    
    log.success('RLS test passed - service role key bypasses RLS');
    results.tests.push({ name: 'RLS Test', status: 'passed' });
    return true;
  } catch (error) {
    log.error('RLS test failed', error);
    results.tests.push({ name: 'RLS Test', status: 'failed', error: error.message });
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Comprehensive Supabase Audit Test...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const tests = [
    testEnvironmentVariables,
    testDatabaseTables,
    testRPCFunctions,
    testGoogleOAuth,
    testRLSWithServiceKey
  ];
  
  for (const test of tests) {
    await test();
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log.section('Test Summary');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}`);
  
  console.log('\n📋 Accessible Tables:');
  if (results.tables.length > 0) {
    results.tables.forEach(table => console.log(`   ✅ ${table}`));
  } else {
    console.log('   ⚠️  No tables accessible (may need migrations or service key)');
  }
  
  console.log('\n📋 Accessible RPC Functions:');
  if (results.rpcs.length > 0) {
    results.rpcs.forEach(rpc => console.log(`   ✅ ${rpc}`));
  } else {
    console.log('   ⚠️  No RPC functions accessible (may need migrations)');
  }
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  return results.failed === 0;
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });

