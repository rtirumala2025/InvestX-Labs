/**
 * Google OAuth Diagnostic Utility
 * 
 * Run this in the browser console to diagnose Google OAuth issues:
 * 
 * diagnoseGoogleOAuth();
 */

import { supabase } from '../services/supabase/config';
import { checkOAuthHealth, OAuthHealthStatus } from '../services/supabase/oauthHealthCheck';

export const diagnoseGoogleOAuth = async () => {
  console.log('🔍 ========== GOOGLE OAUTH DIAGNOSTIC ==========');
  console.log('');
  
  // Use the comprehensive health check
  const healthCheck = await checkOAuthHealth();
  
  console.log('\n========== DIAGNOSTIC RESULTS ==========');
  console.log(`Overall Status: ${healthCheck.status === OAuthHealthStatus.HEALTHY ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  console.log(`Can Attempt Sign-In: ${healthCheck.canAttemptSignIn ? '✅ Yes' : '❌ No'}`);
  
  console.log('\nDetailed Checks:');
  Object.entries(healthCheck.checks).forEach(([checkName, checkResult]) => {
    const status = checkResult.passed ? '✅' : '❌';
    console.log(`  ${status} ${checkName}: ${checkResult.passed ? 'Passed' : checkResult.error || 'Failed'}`);
  });
  
  if (healthCheck.errors.length > 0) {
    console.log('\n❌ Issues Found:');
    healthCheck.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  if (healthCheck.fixes.length > 0) {
    console.log('\n💡 How to Fix:');
    healthCheck.fixes.forEach((fix, i) => {
      console.log(`   ${i + 1}. ${fix}`);
    });
  }
  
  if (healthCheck.status === OAuthHealthStatus.HEALTHY) {
    console.log('\n✅ All checks passed! Google OAuth is properly configured.');
  } else {
    console.log('\n⚠️  Google OAuth needs configuration. Follow the fixes above.');
  }
  
  console.log('\n==========================================');
  
  return healthCheck;
};

// Make it available globally for easy console access
if (typeof window !== 'undefined') {
  window.diagnoseGoogleOAuth = diagnoseGoogleOAuth;
  console.log('💡 Tip: Run diagnoseGoogleOAuth() in the console to test Google OAuth');
}

export default diagnoseGoogleOAuth;

