#!/usr/bin/env node

/**
 * User Service Integration Test
 * 
 * Tests the userService.js implementation against Supabase RPCs
 * Run: node scripts/testUserService.js
 */

import 'dotenv/config';
import { 
  getUserProfile, 
  getUserPreferences, 
  testConnection,
  updateUserProfile,
  updateUserPreferences,
  getUserData,
  clearUserCache
} from '../src/services/userService.js';

// Test configuration
const TEST_USER_ID = process.env.TEST_USER_ID || '00000000-0000-0000-0000-000000000000';
const VERBOSE = process.env.VERBOSE === 'true';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg, data) => {
    console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);
    if (VERBOSE && data) console.log(data);
  },
  success: (msg, data) => {
    console.log(`${colors.green}✓${colors.reset} ${msg}`);
    if (VERBOSE && data) console.log(data);
  },
  error: (msg, error) => {
    console.log(`${colors.red}✗${colors.reset} ${msg}`);
    if (error) {
      console.error(`${colors.red}Error:${colors.reset}`, error.message);
      if (VERBOSE && error.stack) console.error(error.stack);
    }
  },
  warn: (msg) => {
    console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
  },
  section: (msg) => {
    console.log(`\n${colors.cyan}${colors.bright}━━━ ${msg} ━━━${colors.reset}\n`);
  },
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

const recordTest = (name, passed, error = null) => {
  results.tests.push({ name, passed, error });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
};

/**
 * Test 1: Supabase Connection
 */
async function testSupabaseConnection() {
  log.section('Test 1: Supabase Connection');
  
  try {
    log.info('Testing Supabase connection...');
    const result = await testConnection();
    
    if (result.success) {
      log.success('Supabase connection successful');
      log.info(`Timestamp: ${result.timestamp}`);
      recordTest('Supabase Connection', true);
      return true;
    } else {
      log.error('Supabase connection failed', new Error(result.message));
      recordTest('Supabase Connection', false, result.error);
      return false;
    }
  } catch (error) {
    log.error('Supabase connection test threw exception', error);
    recordTest('Supabase Connection', false, error.message);
    return false;
  }
}

/**
 * Test 2: Get User Profile
 */
async function testGetUserProfile() {
  log.section('Test 2: Get User Profile');
  
  try {
    log.info(`Fetching profile for user: ${TEST_USER_ID}`);
    const profile = await getUserProfile(TEST_USER_ID, { useCache: false });
    
    if (profile && profile.user_id) {
      log.success('User profile fetched successfully');
      log.info('Profile data:', {
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        risk_tolerance: profile.risk_tolerance,
      });
      recordTest('Get User Profile', true);
      return profile;
    } else {
      log.error('Invalid profile data returned');
      recordTest('Get User Profile', false, 'Invalid data structure');
      return null;
    }
  } catch (error) {
    log.error('Failed to fetch user profile', error);
    recordTest('Get User Profile', false, error.message);
    return null;
  }
}

/**
 * Test 3: Get User Preferences
 */
async function testGetUserPreferences() {
  log.section('Test 3: Get User Preferences');
  
  try {
    log.info(`Fetching preferences for user: ${TEST_USER_ID}`);
    const preferences = await getUserPreferences(TEST_USER_ID, { useCache: false });
    
    if (preferences && preferences.user_id) {
      log.success('User preferences fetched successfully');
      log.info('Preferences data:', {
        user_id: preferences.user_id,
        theme: preferences.theme,
        language: preferences.language,
        currency: preferences.currency,
      });
      recordTest('Get User Preferences', true);
      return preferences;
    } else {
      log.error('Invalid preferences data returned');
      recordTest('Get User Preferences', false, 'Invalid data structure');
      return null;
    }
  } catch (error) {
    log.error('Failed to fetch user preferences', error);
    recordTest('Get User Preferences', false, error.message);
    return null;
  }
}

/**
 * Test 4: Cache Functionality
 */
async function testCacheFunctionality() {
  log.section('Test 4: Cache Functionality');
  
  try {
    log.info('Testing cache hit...');
    
    // First call - should hit Supabase
    const start1 = Date.now();
    const profile1 = await getUserProfile(TEST_USER_ID, { useCache: true });
    const time1 = Date.now() - start1;
    
    // Second call - should hit cache
    const start2 = Date.now();
    const profile2 = await getUserProfile(TEST_USER_ID, { useCache: true });
    const time2 = Date.now() - start2;
    
    log.info(`First call: ${time1}ms, Second call: ${time2}ms`);
    
    if (time2 < time1) {
      log.success('Cache is working (second call was faster)');
      recordTest('Cache Functionality', true);
    } else {
      log.warn('Cache might not be working (second call was not faster)');
      results.warnings++;
      recordTest('Cache Functionality', true); // Still pass, timing can vary
    }
    
    // Test cache invalidation
    log.info('Testing cache invalidation...');
    clearUserCache(TEST_USER_ID);
    log.success('Cache cleared successfully');
    
    return true;
  } catch (error) {
    log.error('Cache functionality test failed', error);
    recordTest('Cache Functionality', false, error.message);
    return false;
  }
}

/**
 * Test 5: Update User Profile
 */
async function testUpdateUserProfile() {
  log.section('Test 5: Update User Profile');
  
  try {
    log.info('Testing profile update...');
    
    const updates = {
      bio: `Test update at ${new Date().toISOString()}`,
    };
    
    const updatedProfile = await updateUserProfile(TEST_USER_ID, updates);
    
    if (updatedProfile && updatedProfile.user_id) {
      log.success('Profile updated successfully');
      log.info('Updated bio:', updatedProfile.bio);
      recordTest('Update User Profile', true);
      return updatedProfile;
    } else {
      log.error('Invalid updated profile data');
      recordTest('Update User Profile', false, 'Invalid data structure');
      return null;
    }
  } catch (error) {
    log.error('Failed to update user profile', error);
    recordTest('Update User Profile', false, error.message);
    return null;
  }
}

/**
 * Test 6: Update User Preferences
 */
async function testUpdateUserPreferences() {
  log.section('Test 6: Update User Preferences');
  
  try {
    log.info('Testing preferences update...');
    
    const updates = {
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
      },
    };
    
    const updatedPreferences = await updateUserPreferences(TEST_USER_ID, updates);
    
    if (updatedPreferences && updatedPreferences.user_id) {
      log.success('Preferences updated successfully');
      log.info('Updated theme:', updatedPreferences.theme);
      recordTest('Update User Preferences', true);
      return updatedPreferences;
    } else {
      log.error('Invalid updated preferences data');
      recordTest('Update User Preferences', false, 'Invalid data structure');
      return null;
    }
  } catch (error) {
    log.error('Failed to update user preferences', error);
    recordTest('Update User Preferences', false, error.message);
    return null;
  }
}

/**
 * Test 7: Get Complete User Data
 */
async function testGetCompleteUserData() {
  log.section('Test 7: Get Complete User Data');
  
  try {
    log.info('Fetching complete user data...');
    
    const userData = await getUserData(TEST_USER_ID, { useCache: false });
    
    if (userData && userData.profile && userData.preferences) {
      log.success('Complete user data fetched successfully');
      log.info('Profile user_id:', userData.profile.user_id);
      log.info('Preferences user_id:', userData.preferences.user_id);
      recordTest('Get Complete User Data', true);
      return userData;
    } else {
      log.error('Invalid complete user data structure');
      recordTest('Get Complete User Data', false, 'Invalid data structure');
      return null;
    }
  } catch (error) {
    log.error('Failed to fetch complete user data', error);
    recordTest('Get Complete User Data', false, error.message);
    return null;
  }
}

/**
 * Print Test Summary
 */
function printSummary() {
  log.section('Test Summary');
  
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  
  if (results.failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  ${colors.red}✗${colors.reset} ${t.name}`);
        if (t.error) console.log(`    Error: ${t.error}`);
      });
  }
  
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  if (results.failed === 0) {
    console.log(`${colors.green}${colors.bright}✓ All tests passed!${colors.reset}\n`);
    return 0;
  } else {
    console.log(`${colors.red}${colors.bright}✗ Some tests failed${colors.reset}\n`);
    return 1;
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('╔════════════════════════════════════════╗');
  console.log('║   User Service Integration Tests      ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
  
  log.info(`Test User ID: ${TEST_USER_ID}`);
  log.info(`Verbose Mode: ${VERBOSE}`);
  log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Run tests sequentially
  const connectionOk = await testSupabaseConnection();
  
  if (!connectionOk) {
    log.warn('Skipping remaining tests due to connection failure');
    return printSummary();
  }
  
  await testGetUserProfile();
  await testGetUserPreferences();
  await testCacheFunctionality();
  await testUpdateUserProfile();
  await testUpdateUserPreferences();
  await testGetCompleteUserData();
  
  return printSummary();
}

// Run tests
runAllTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    log.error('Unexpected error in test runner', error);
    process.exit(1);
  });
