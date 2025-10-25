#!/usr/bin/env node

/**
 * Integration Test for User Service
 * 
 * Tests against real Supabase instance using environment variables
 * Run: node scripts/testIntegration.js
 * CI/CD: This runs in CI against test Supabase instance
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuration from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
const TEST_USER_ID = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000000';

// Validate environment
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg, err) => {
    console.log(`❌ ${msg}`);
    if (err) console.error('  Error:', err.message);
  },
  section: (msg) => console.log(`\n━━━ ${msg} ━━━\n`),
};

/**
 * Test RPC Health Check
 */
async function testRPCHealthCheck() {
  log.section('RPC Health Check');
  
  try {
    log.info('Checking if check_user_rpcs_health exists...');
    
    const { data, error } = await supabase
      .rpc('check_user_rpcs_health')
      .single();
    
    if (error) {
      log.error('Health check RPC failed', error);
      results.tests.push({ name: 'RPC Health Check', passed: false });
      results.failed++;
      return false;
    }
    
    if (data && data.healthy) {
      log.success(`All ${data.functions_found}/${data.functions_expected} RPCs are healthy`);
      log.info('Functions found:', JSON.stringify(data.details, null, 2));
      results.tests.push({ name: 'RPC Health Check', passed: true });
      results.passed++;
      return true;
    } else {
      log.error('Some RPCs are missing');
      log.info('Health data:', JSON.stringify(data, null, 2));
      results.tests.push({ name: 'RPC Health Check', passed: false });
      results.failed++;
      return false;
    }
  } catch (error) {
    log.error('Health check threw exception', error);
    results.tests.push({ name: 'RPC Health Check', passed: false });
    results.failed++;
    return false;
  }
}

/**
 * Test get_user_profile RPC
 */
async function testGetUserProfile() {
  log.section('Test get_user_profile');
  
  try {
    log.info(`Calling get_user_profile for ${TEST_USER_ID}...`);
    
    const { data, error } = await supabase
      .rpc('get_user_profile', { p_user_id: TEST_USER_ID })
      .single();
    
    if (error) {
      log.error('get_user_profile failed', error);
      results.tests.push({ name: 'get_user_profile', passed: false });
      results.failed++;
      return false;
    }
    
    if (data && data.user_id) {
      log.success('get_user_profile returned data');
      log.info(`User: ${data.email || data.full_name || data.user_id}`);
      results.tests.push({ name: 'get_user_profile', passed: true });
      results.passed++;
      return true;
    } else {
      log.error('get_user_profile returned invalid data');
      results.tests.push({ name: 'get_user_profile', passed: false });
      results.failed++;
      return false;
    }
  } catch (error) {
    log.error('get_user_profile threw exception', error);
    results.tests.push({ name: 'get_user_profile', passed: false });
    results.failed++;
    return false;
  }
}

/**
 * Test get_user_preferences RPC
 */
async function testGetUserPreferences() {
  log.section('Test get_user_preferences');
  
  try {
    log.info(`Calling get_user_preferences for ${TEST_USER_ID}...`);
    
    const { data, error } = await supabase
      .rpc('get_user_preferences', { p_user_id: TEST_USER_ID })
      .single();
    
    if (error) {
      log.error('get_user_preferences failed', error);
      results.tests.push({ name: 'get_user_preferences', passed: false });
      results.failed++;
      return false;
    }
    
    if (data && data.user_id) {
      log.success('get_user_preferences returned data');
      log.info(`Theme: ${data.theme}, Language: ${data.language}`);
      results.tests.push({ name: 'get_user_preferences', passed: true });
      results.passed++;
      return true;
    } else {
      log.error('get_user_preferences returned invalid data');
      results.tests.push({ name: 'get_user_preferences', passed: false });
      results.failed++;
      return false;
    }
  } catch (error) {
    log.error('get_user_preferences threw exception', error);
    results.tests.push({ name: 'get_user_preferences', passed: false });
    results.failed++;
    return false;
  }
}

/**
 * Test update_user_profile RPC
 */
async function testUpdateUserProfile() {
  log.section('Test update_user_profile');
  
  try {
    log.info('Calling update_user_profile...');
    
    const updates = {
      bio: `Integration test at ${new Date().toISOString()}`,
    };
    
    const { data, error } = await supabase
      .rpc('update_user_profile', {
        p_user_id: TEST_USER_ID,
        p_profile_updates: updates,
      })
      .single();
    
    if (error) {
      log.error('update_user_profile failed', error);
      results.tests.push({ name: 'update_user_profile', passed: false });
      results.failed++;
      return false;
    }
    
    if (data && data.user_id) {
      log.success('update_user_profile succeeded');
      log.info(`Updated bio: ${data.bio}`);
      results.tests.push({ name: 'update_user_profile', passed: true });
      results.passed++;
      return true;
    } else {
      log.error('update_user_profile returned invalid data');
      results.tests.push({ name: 'update_user_profile', passed: false });
      results.failed++;
      return false;
    }
  } catch (error) {
    log.error('update_user_profile threw exception', error);
    results.tests.push({ name: 'update_user_profile', passed: false });
    results.failed++;
    return false;
  }
}

/**
 * Test update_user_preferences RPC
 */
async function testUpdateUserPreferences() {
  log.section('Test update_user_preferences');
  
  try {
    log.info('Calling update_user_preferences...');
    
    const updates = {
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
      },
    };
    
    const { data, error } = await supabase
      .rpc('update_user_preferences', {
        p_user_id: TEST_USER_ID,
        p_preferences: updates,
      })
      .single();
    
    if (error) {
      log.error('update_user_preferences failed', error);
      results.tests.push({ name: 'update_user_preferences', passed: false });
      results.failed++;
      return false;
    }
    
    if (data && data.user_id) {
      log.success('update_user_preferences succeeded');
      log.info(`Updated theme: ${data.theme}`);
      results.tests.push({ name: 'update_user_preferences', passed: true });
      results.passed++;
      return true;
    } else {
      log.error('update_user_preferences returned invalid data');
      results.tests.push({ name: 'update_user_preferences', passed: false });
      results.failed++;
      return false;
    }
  } catch (error) {
    log.error('update_user_preferences threw exception', error);
    results.tests.push({ name: 'update_user_preferences', passed: false });
    results.failed++;
    return false;
  }
}

/**
 * Print Summary
 */
function printSummary() {
  log.section('Integration Test Summary');
  
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  ❌ ${t.name}`));
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (results.failed === 0) {
    console.log('✅ All integration tests passed!\n');
    return 0;
  } else {
    console.log('❌ Some integration tests failed\n');
    return 1;
  }
}

/**
 * Main Runner
 */
async function runIntegrationTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  User Service Integration Tests       ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  log.info(`Supabase URL: ${SUPABASE_URL}`);
  log.info(`Test User ID: ${TEST_USER_ID}`);
  
  // Run tests
  const healthOk = await testRPCHealthCheck();
  
  if (!healthOk) {
    log.error('Health check failed, skipping remaining tests');
    return printSummary();
  }
  
  await testGetUserProfile();
  await testGetUserPreferences();
  await testUpdateUserProfile();
  await testUpdateUserPreferences();
  
  return printSummary();
}

// Run
runIntegrationTests()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
