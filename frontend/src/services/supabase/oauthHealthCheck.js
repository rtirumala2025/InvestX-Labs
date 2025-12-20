/**
 * Google OAuth Health Check
 * 
 * Pre-validates OAuth configuration before attempting sign-in.
 * This prevents user-facing errors and provides clear diagnostics.
 */

import { supabase } from './config';

/**
 * Health check result structure
 */
export const OAuthHealthStatus = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
};

/**
 * Comprehensive OAuth health check
 * Returns detailed status and actionable fixes
 */
export const checkOAuthHealth = async () => {
  console.log('🔍 [OAuthHealthCheck] Starting comprehensive health check...');
  
  const result = {
    status: OAuthHealthStatus.UNKNOWN,
    healthy: false,
    checks: {},
    errors: [],
    fixes: [],
    canAttemptSignIn: false
  };

  // Check 1: Supabase client exists
  console.log('🔍 [OAuthHealthCheck] Check 1: Supabase client');
  if (!supabase) {
    console.error('🔍 [OAuthHealthCheck] ❌ Supabase client not initialized');
    result.checks.supabaseClient = { passed: false, error: 'Supabase client not initialized' };
    result.errors.push('Supabase client not initialized');
    result.fixes.push('Check environment variables: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    return result;
  }
  console.log('🔍 [OAuthHealthCheck] ✅ Supabase client exists');
  result.checks.supabaseClient = { passed: true };

  // Check 2: Auth service available
  console.log('🔍 [OAuthHealthCheck] Check 2: Auth service');
  if (!supabase.auth) {
    console.error('🔍 [OAuthHealthCheck] ❌ Auth service not available');
    result.checks.authService = { passed: false, error: 'Auth service not available' };
    result.errors.push('Auth service not available');
    result.fixes.push('Supabase client may be in offline mode. Check environment variables.');
    return result;
  }
  console.log('🔍 [OAuthHealthCheck] ✅ Auth service available');
  result.checks.authService = { passed: true };

  // Check 3: OAuth method exists
  console.log('🔍 [OAuthHealthCheck] Check 3: OAuth method');
  if (typeof supabase.auth.signInWithOAuth !== 'function') {
    console.error('🔍 [OAuthHealthCheck] ❌ signInWithOAuth method not available');
    result.checks.oAuthMethod = { passed: false, error: 'signInWithOAuth method not available' };
    result.errors.push('OAuth method not available');
    result.fixes.push('Supabase client may be outdated or in stub mode');
    return result;
  }
  console.log('🔍 [OAuthHealthCheck] ✅ OAuth method available');
  result.checks.oAuthMethod = { passed: true };

  // Check 4: Environment variables
  console.log('🔍 [OAuthHealthCheck] Check 4: Environment variables');
  const hasUrl = !!process.env.REACT_APP_SUPABASE_URL;
  const hasKey = !!process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  if (!hasUrl || !hasKey) {
    console.error('🔍 [OAuthHealthCheck] ❌ Environment variables missing', { hasUrl, hasKey });
    result.checks.envVars = { 
      passed: false, 
      error: 'Environment variables missing',
      details: {
        hasUrl,
        hasKey
      }
    };
    result.errors.push('Environment variables missing');
    result.fixes.push('Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to frontend/.env file');
    result.fixes.push('Restart the development server after adding environment variables');
    return result;
  }
  console.log('🔍 [OAuthHealthCheck] ✅ Environment variables present');
  result.checks.envVars = { passed: true };

  // Check 5: Test OAuth provider (non-blocking, informative)
  console.log('🔍 [OAuthHealthCheck] Check 5: OAuth provider test');
  try {
    const testRedirect = `${window.location.origin}/dashboard`;
    console.log('🔍 [OAuthHealthCheck] Testing OAuth with redirect:', testRedirect);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: testRedirect
      }
    });

    if (error) {
      console.error('🔍 [OAuthHealthCheck] ❌ OAuth provider error:', error.message);
      result.checks.oAuthProvider = { passed: false, error: error.message };
      
      // Categorize the error
      if (error.message?.includes('Unsupported provider') || 
          error.message?.includes('provider not enabled') ||
          error.message?.includes('not enabled')) {
        console.error('🔍 [OAuthHealthCheck] Provider not enabled');
        result.errors.push('Google OAuth provider not enabled in Supabase');
        result.fixes.push('Go to Supabase Dashboard → Authentication → Providers → Google');
        result.fixes.push('Toggle "Enable Google provider" to ON');
        result.fixes.push('Add your Google OAuth Client ID and Client Secret');
        result.fixes.push('Save and try again');
      } else if (error.message?.includes('invalid_client') || 
                 error.message?.includes('Client ID')) {
        console.error('🔍 [OAuthHealthCheck] Invalid client configuration');
        result.errors.push('Invalid Google OAuth client configuration');
        result.fixes.push('Check Google OAuth Client ID and Secret in Supabase Dashboard');
        result.fixes.push('Verify credentials match Google Cloud Console');
      } else if (error.message?.includes('redirect_uri_mismatch')) {
        console.error('🔍 [OAuthHealthCheck] Redirect URI mismatch');
        result.errors.push('OAuth redirect URI mismatch');
        result.fixes.push('Add redirect URI to Google Cloud Console: https://[your-project].supabase.co/auth/v1/callback');
        result.fixes.push('Check Supabase Dashboard → Authentication → URL Configuration');
      } else {
        console.error('🔍 [OAuthHealthCheck] Unknown OAuth error');
        result.errors.push(`OAuth error: ${error.message}`);
        result.fixes.push('Check Supabase Dashboard → Authentication → Providers → Google');
      }
      
      result.canAttemptSignIn = false;
    } else if (data?.url) {
      console.log('🔍 [OAuthHealthCheck] ✅ OAuth provider working - URL generated');
      result.checks.oAuthProvider = { passed: true, url: data.url };
      result.canAttemptSignIn = true;
    } else {
      console.error('🔍 [OAuthHealthCheck] ❌ No OAuth URL generated');
      result.checks.oAuthProvider = { passed: false, error: 'No OAuth URL generated' };
      result.errors.push('OAuth URL not generated');
      result.fixes.push('Google OAuth provider may not be properly configured');
      result.canAttemptSignIn = false;
    }
  } catch (err) {
    console.error('🔍 [OAuthHealthCheck] ❌ OAuth test exception:', err);
    result.checks.oAuthProvider = { passed: false, error: err.message };
    result.errors.push(`OAuth test exception: ${err.message}`);
    result.canAttemptSignIn = false;
  }

  // Determine overall status
  const allChecksPassed = Object.values(result.checks).every(check => check.passed === true);
  result.healthy = allChecksPassed && result.canAttemptSignIn;
  result.status = result.healthy ? OAuthHealthStatus.HEALTHY : OAuthHealthStatus.UNHEALTHY;

  console.log('🔍 [OAuthHealthCheck] Health check complete:', {
    status: result.status,
    healthy: result.healthy,
    canAttemptSignIn: result.canAttemptSignIn,
    errors: result.errors.length,
    checksPassed: allChecksPassed
  });

  return result;
};

/**
 * Quick health check (faster, less detailed)
 */
export const quickOAuthHealthCheck = async () => {
  if (!supabase?.auth?.signInWithOAuth) {
    return { healthy: false, reason: 'OAuth method not available' };
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      return { healthy: false, reason: error.message };
    }

    return { healthy: true };
  } catch (err) {
    return { healthy: false, reason: err.message };
  }
};

export default checkOAuthHealth;

