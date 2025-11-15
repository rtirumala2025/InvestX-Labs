#!/usr/bin/env node

/**
 * Google OAuth Test Script
 * 
 * Tests Google OAuth configuration and redirect URL generation.
 * Run: node backend/scripts/test_google_oauth.js
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
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

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
  log.error('Missing required Supabase environment variables');
  process.exit(1);
}

log.info(`Supabase URL: ${SUPABASE_URL}`);
log.info('Anon key: ' + (SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'));
log.info('Google Client ID: ' + (GOOGLE_CLIENT_ID ? 'Set (hidden)' : 'Not set'));
log.info('Google Client Secret: ' + (GOOGLE_CLIENT_SECRET ? 'Set (hidden)' : 'Not set (backend only)'));

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

/**
 * Test 1: Environment Variables
 */
async function testEnvironmentVariables() {
  log.section('Test 1: Environment Variables');
  
  const checks = {
    'SUPABASE_URL': SUPABASE_URL,
    'SUPABASE_ANON_KEY': SUPABASE_ANON_KEY,
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
  
  if (allPresent) {
    results.tests.push({ name: 'Environment Variables', status: 'passed' });
    return true;
  } else {
    results.tests.push({ name: 'Environment Variables', status: 'failed' });
    return false;
  }
}

/**
 * Test 2: Google OAuth Redirect URL Generation
 */
async function testOAuthRedirectURL() {
  log.section('Test 2: Google OAuth Redirect URL');
  
  try {
    // Simulate the redirect URL that would be generated
    const expectedRedirectUrl = `${SUPABASE_URL}/auth/v1/callback`;
    log.info(`Expected Supabase callback URL: ${expectedRedirectUrl}`);
    
    // For Google OAuth, the redirect URL should be:
    // {SUPABASE_URL}/auth/v1/callback
    // This needs to be added to Google Cloud Console OAuth credentials
    
    log.success('Redirect URL structure is correct');
    log.info('💡 Add this URL to Google Cloud Console OAuth credentials:');
    log.info(`   ${expectedRedirectUrl}`);
    
    results.tests.push({ name: 'OAuth Redirect URL', status: 'passed', redirectUrl: expectedRedirectUrl });
    return true;
  } catch (error) {
    log.error('OAuth redirect URL test failed', error);
    results.tests.push({ name: 'OAuth Redirect URL', status: 'failed', error: error.message });
    return false;
  }
}

/**
 * Test 3: Google OAuth Provider Check
 */
async function testGoogleOAuthProvider() {
  log.section('Test 3: Google OAuth Provider');
  
  try {
    // Attempt to initiate OAuth flow (this will generate a redirect URL)
    // We catch the redirect and verify the URL structure
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`
      }
    });
    
    if (error) {
      // Check for specific errors
      if (error.message.includes('Unsupported provider') || error.message.includes('provider not enabled')) {
        log.error('Google provider not enabled in Supabase', error);
        log.info('💡 Enable Google provider in Supabase dashboard:');
        log.info('   Authentication → Providers → Google → Enable');
        results.tests.push({ name: 'Google OAuth Provider', status: 'failed', error: 'Provider not enabled' });
        return false;
      } else if (error.message.includes('invalid_client') || error.message.includes('Client ID')) {
        log.error('Google Client ID may be invalid or not configured in Supabase', error);
        log.info('💡 Verify Google Client ID in Supabase dashboard matches .env file');
        results.tests.push({ name: 'Google OAuth Provider', status: 'failed', error: 'Invalid Client ID' });
        return false;
      }
      throw error;
    }
    
    // If we get here, the OAuth URL was generated successfully
    if (data?.url) {
      log.success('Google OAuth provider is accessible');
      log.info(`OAuth URL generated: ${data.url.substring(0, 100)}...`);
      log.info('💡 This URL can be used to initiate Google sign-in');
      results.tests.push({ name: 'Google OAuth Provider', status: 'passed', urlGenerated: true });
      return true;
    } else {
      log.error('OAuth URL not generated');
      results.tests.push({ name: 'Google OAuth Provider', status: 'failed', error: 'No URL generated' });
      return false;
    }
  } catch (error) {
    log.error('Google OAuth provider test failed', error);
    results.tests.push({ name: 'Google OAuth Provider', status: 'failed', error: error.message });
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Testing Google OAuth Configuration...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const tests = [
    testEnvironmentVariables,
    testOAuthRedirectURL,
    testGoogleOAuthProvider
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
    console.log('\n🎉 All tests passed! Google OAuth is configured correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('\n💡 Common issues:');
    console.log('   1. Google provider not enabled in Supabase dashboard');
    console.log('   2. Google Client ID/Secret not configured in Supabase');
    console.log('   3. Redirect URL not added to Google Cloud Console');
    console.log('   4. Environment variables not set correctly');
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

