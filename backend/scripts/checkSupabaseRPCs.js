#!/usr/bin/env node

/**
 * Check Supabase RPCs Health
 * 
 * Verifies that all required user RPCs exist in Supabase
 * Run: node backend/scripts/checkSupabaseRPCs.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_KEY (or ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const REQUIRED_RPCS = [
  'get_user_profile',
  'update_user_profile',
  'get_user_preferences',
  'update_user_preferences',
];

console.log('\n╔════════════════════════════════════════╗');
console.log('║   Supabase RPC Health Check           ║');
console.log('╚════════════════════════════════════════╝\n');

console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Checking ${REQUIRED_RPCS.length} required RPCs...\n`);

async function checkRPCHealth() {
  try {
    // Try to call the health check function
    console.log('Calling check_user_rpcs_health()...');
    const { data, error } = await supabase
      .rpc('check_user_rpcs_health')
      .single();
    
    if (error) {
      console.error('❌ Health check RPC not found or failed:', error.message);
      console.log('\n⚠️  The health check function might not exist yet.');
      console.log('Run this migration to create it:');
      console.log('  backend/supabase/migrations/20250125000000_verify_user_rpcs.sql\n');
      return false;
    }
    
    console.log('\n✅ Health check RPC exists\n');
    console.log('Health Check Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Status: ${data.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`Functions Found: ${data.functions_found}/${data.functions_expected}`);
    console.log(`Timestamp: ${data.timestamp}`);
    
    if (data.details && data.details.length > 0) {
      console.log('\nDetailed Function List:');
      data.details.forEach(func => {
        console.log(`  ✓ ${func.name} (${func.type}, ${func.language})`);
      });
    }
    
    if (!data.healthy) {
      console.log('\n❌ Some required RPCs are missing!');
      console.log('Expected functions:', REQUIRED_RPCS.join(', '));
      console.log('\nTo fix this, run the user profile migration:');
      console.log('  backend/supabase/migrations/[timestamp]_user_profile_rpcs.sql\n');
      return false;
    }
    
    console.log('\n✅ All required RPCs are present and healthy!\n');
    return true;
    
  } catch (error) {
    console.error('❌ Error checking RPC health:', error.message);
    console.error(error);
    return false;
  }
}

async function manualCheck() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Manual RPC Check (testing each function)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const testUserId = '00000000-0000-0000-0000-000000000000';
  const results = [];
  
  // Test get_user_profile
  try {
    const { data, error } = await supabase
      .rpc('get_user_profile', { p_user_id: testUserId })
      .single();
    
    if (error) throw error;
    results.push({ name: 'get_user_profile', status: '✅', message: 'Working' });
  } catch (error) {
    results.push({ name: 'get_user_profile', status: '❌', message: error.message });
  }
  
  // Test get_user_preferences
  try {
    const { data, error } = await supabase
      .rpc('get_user_preferences', { p_user_id: testUserId })
      .single();
    
    if (error) throw error;
    results.push({ name: 'get_user_preferences', status: '✅', message: 'Working' });
  } catch (error) {
    results.push({ name: 'get_user_preferences', status: '❌', message: error.message });
  }
  
  // Test update_user_profile
  try {
    const { data, error } = await supabase
      .rpc('update_user_profile', {
        p_user_id: testUserId,
        p_profile_updates: { bio: 'Test' }
      })
      .single();
    
    if (error) throw error;
    results.push({ name: 'update_user_profile', status: '✅', message: 'Working' });
  } catch (error) {
    results.push({ name: 'update_user_profile', status: '❌', message: error.message });
  }
  
  // Test update_user_preferences
  try {
    const { data, error } = await supabase
      .rpc('update_user_preferences', {
        p_user_id: testUserId,
        p_preferences: { theme: 'dark' }
      })
      .single();
    
    if (error) throw error;
    results.push({ name: 'update_user_preferences', status: '✅', message: 'Working' });
  } catch (error) {
    results.push({ name: 'update_user_preferences', status: '❌', message: error.message });
  }
  
  // Print results
  results.forEach(result => {
    console.log(`${result.status} ${result.name}`);
    if (result.status === '❌') {
      console.log(`   Error: ${result.message}`);
    }
  });
  
  const allPassed = results.every(r => r.status === '✅');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Manual Check: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return allPassed;
}

async function main() {
  const healthCheckPassed = await checkRPCHealth();
  const manualCheckPassed = await manualCheck();
  
  if (healthCheckPassed && manualCheckPassed) {
    console.log('🎉 All checks passed! Your Supabase RPCs are ready.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some checks failed. Please review the errors above.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
