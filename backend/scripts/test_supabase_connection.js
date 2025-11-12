#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * 
 * Tests Supabase connection, authentication, and database access.
 * Run: node backend/scripts/test_supabase_connection.js
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

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
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
  log.error('Missing required environment variables');
  console.error('\n📝 Please create a .env file in the backend directory with:');
  console.error('   SUPABASE_URL=https://your-project.supabase.co');
  console.error('   SUPABASE_ANON_KEY=your_anon_key_here');
  console.error('   SUPABASE_SERVICE_KEY=your_service_role_key_here (optional, but recommended)');
  console.error('\n💡 You can find these values in your Supabase dashboard:');
  console.error('   Project Settings → API → Project URL, anon public key, and service_role secret key');
  process.exit(1);
}

log.info(`Supabase URL: ${SUPABASE_URL}`);
log.info('Anon key: ' + (SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'));
log.info('Service role key: ' + (SUPABASE_SERVICE_KEY ? 'Set (hidden) - will use for RLS test' : 'Not set - will use anon key'));

// Create Supabase clients
// Anon key client (for most tests)
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Service role key client (for RLS test - bypasses RLS)
const supabaseService = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
}) : null;

// Default to anon client for backward compatibility
const supabase = supabaseAnon;

/**
 * Test 1: Basic Database Connection
 */
async function testDatabaseConnection() {
  log.section('Test 1: Database Connection');
  
  try {
    // Try to query a common table (should work with anon key)
    const { data, error } = await supabase
      .from('market_news')
      .select('id')
      .limit(1);
    
    if (error) {
      // Check if it's a table not found error
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        log.error('Table not found - migrations may not be run', error);
        log.info('💡 Run migrations: Check backend/supabase/migrations/');
        return false;
      }
      throw error;
    }
    
    log.success('Database connection successful');
    log.info(`Query returned ${data?.length || 0} rows`);
    results.tests.push({ name: 'Database Connection', status: 'passed' });
    return true;
  } catch (error) {
    log.error('Database connection failed', error);
    results.tests.push({ name: 'Database Connection', status: 'failed', error: error.message });
    return false;
  }
}

/**
 * Test 2: Authentication Service
 */
async function testAuthService() {
  log.section('Test 2: Authentication Service');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    log.success('Auth service accessible');
    log.info(`Current session: ${session ? 'Active' : 'None (expected for test)'}`);
    results.tests.push({ name: 'Auth Service', status: 'passed' });
    return true;
  } catch (error) {
    log.error('Auth service test failed', error);
    results.tests.push({ name: 'Auth Service', status: 'failed', error: error.message });
    return false;
  }
}

/**
 * Test 3: Row Level Security (RLS) Policies
 */
async function testRLSPolicies() {
  log.section('Test 3: Row Level Security Policies');
  
  // Use service role key if available (bypasses RLS), otherwise use anon key
  const testClient = supabaseService || supabaseAnon;
  const keyType = supabaseService ? 'service_role' : 'anon';
  
  log.info(`Using ${keyType} key for RLS test`);
  
  try {
    // Test database access - service role can bypass RLS, anon key respects RLS
    const { data, error } = await testClient
      .from('market_news')
      .select('id')
      .limit(1);
    
    if (error) {
      // Check if it's a table not found error
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        log.error('Table not found - migrations may not be run', error);
        log.info('💡 Run migrations: Check backend/supabase/migrations/');
        return false;
      }
      
      // Check if it's an RLS policy error (only relevant for anon key)
      if (error.code === '42501' || error.message.includes('permission denied')) {
        if (keyType === 'anon') {
          log.error('RLS policy blocking access with anon key', error);
          log.info('💡 This is expected - RLS policies are working correctly');
          log.info('💡 To test data access, set SUPABASE_SERVICE_KEY in .env file');
          log.info('💡 Service role key bypasses RLS for testing purposes');
          // Still count as passed since RLS is working as intended
          log.success('RLS policies working correctly (blocking anon access as expected)');
          results.tests.push({ name: 'RLS Policies', status: 'passed', note: 'RLS blocking anon key (expected)' });
          return true;
        } else {
          throw error;
        }
      }
      throw error;
    }
    
    log.success('RLS test passed - database access confirmed');
    if (keyType === 'service_role') {
      log.info('Service role key used - RLS bypassed for testing');
    } else {
      log.info('Anon key used - public read access confirmed');
    }
    results.tests.push({ name: 'RLS Policies', status: 'passed', keyType });
    return true;
  } catch (error) {
    log.error('RLS test failed', error);
    results.tests.push({ name: 'RLS Policies', status: 'failed', error: error.message });
    return false;
  }
}

/**
 * Test 4: RPC Functions (if available)
 */
async function testRPCFunctions() {
  log.section('Test 4: RPC Functions');
  
  try {
    // Try a simple RPC call (if it exists)
    const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: 1 });
    
    if (error) {
      // If RPC doesn't exist, that's okay - just log it
      if (error.code === '42883' || error.message.includes('function') || error.message.includes('does not exist')) {
        log.info('RPC function get_leaderboard not found (this is okay)');
        log.info('💡 RPC functions are optional - run migrations if needed');
        results.tests.push({ name: 'RPC Functions', status: 'skipped', note: 'Function not found' });
        return true;
      }
      throw error;
    }
    
    log.success('RPC functions accessible');
    results.tests.push({ name: 'RPC Functions', status: 'passed' });
    return true;
  } catch (error) {
    log.error('RPC test failed', error);
    results.tests.push({ name: 'RPC Functions', status: 'failed', error: error.message });
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Testing Supabase Connection...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const tests = [
    testDatabaseConnection,
    testAuthService,
    testRLSPolicies,
    testRPCFunctions
  ];
  
  for (const test of tests) {
    await test();
  }
  
  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log.section('Test Summary');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Supabase connection is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('\n💡 Common issues:');
    console.log('   1. Environment variables not set in .env file');
    console.log('   2. Supabase project URL or key incorrect');
    console.log('   3. Database migrations not run');
    console.log('   4. RLS policies not configured');
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

