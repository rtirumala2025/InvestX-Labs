import { supabase } from './config';
import { checkOAuthHealth, OAuthHealthStatus } from './oauthHealthCheck';

const createSupabaseError = (message, code = 'SUPABASE_UNAVAILABLE') => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const ensureAuthClient = () => {
  if (!supabase?.auth) {
    throw createSupabaseError('Supabase auth client is unavailable.');
  }
};

// Sign in with email and password
export const signInUser = async (email, password) => {
  try {
    ensureAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Supabase signInUser failed:', error);
    throw error;
  }
};

/**
 * Sign up a new user with email and password
 * 
 * Creates a new user account and sends an email verification link.
 * The user's metadata (full_name, username) is stored in the auth.users table.
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password (min 6 characters)
 * @param {Object} userData - Additional user data (fullName, username)
 * @returns {Promise<Object>} User data and session information
 */
export const signUpUser = async (email, password, userData) => {
  try {
    ensureAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          username: userData.username,
        },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Supabase signUpUser failed:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    ensureAuthClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.warn('Supabase signOutUser failed:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    ensureAuthClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.warn('Supabase getCurrentUser failed:', error);
    throw error;
  }
};

// Listen for auth state changes
export const onAuthStateChange = (callback) => {
  if (!supabase?.auth?.onAuthStateChange) {
    console.warn('Supabase onAuthStateChange unavailable; returning noop unsubscriber.');
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });

  return () => subscription?.unsubscribe();
};

/**
 * Check if ad blockers or privacy extensions might be blocking requests
 * This is a best-effort detection - not 100% reliable
 */
const detectBlockedRequests = () => {
  // Check for common ad blocker indicators
  const hasAdBlocker = 
    window.navigator.webdriver === undefined && // Not automated
    (window.adsbygoogle === undefined || // Google Ads blocked
     document.getElementById('google_ads_iframe_1') === null); // Ad elements missing
  
  // Check console for ERR_BLOCKED_BY_CLIENT errors
  // Note: We can't directly read console errors, but we can check for blocked resources
  return hasAdBlocker;
};

// Sign in with Google - Bulletproof implementation with pre-validation
export const signInWithGoogle = async (options = {}) => {
  const { skipHealthCheck = false, retryCount = 0, maxRetries = 0 } = options;
  
  try {
    console.log('🔐 [Auth] ========== STARTING GOOGLE OAUTH ==========');
    console.log('🔐 [Auth] Step 1: Pre-flight health check...');
    
    // Pre-validate OAuth configuration (unless explicitly skipped)
    // Make health check non-blocking - if it fails, we'll still try OAuth
    if (!skipHealthCheck) {
      try {
        console.log('🔐 [Auth] Running health check (non-blocking)...');
        const healthCheck = await checkOAuthHealth();
        
        if (healthCheck.status !== OAuthHealthStatus.HEALTHY) {
          console.warn('🔐 [Auth] ⚠️ OAuth health check failed, but continuing anyway');
          console.warn('🔐 [Auth] Errors:', healthCheck.errors);
          console.warn('🔐 [Auth] Fixes:', healthCheck.fixes);
          // Don't block - let OAuth attempt proceed and show actual error
        } else {
          console.log('🔐 [Auth] ✅ OAuth health check passed');
        }
      } catch (healthCheckError) {
        console.warn('🔐 [Auth] ⚠️ Health check threw error, continuing anyway:', healthCheckError);
        // Don't block OAuth flow if health check fails
      }
    }
    
    console.log('🔐 [Auth] Step 2: Validating Supabase client...');
    ensureAuthClient();
    
    if (!supabase?.auth) {
      const error = new Error('Supabase auth client is not available. Please check your environment variables (REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY) and restart the dev server.');
      console.error('🔐 [Auth] ❌', error.message);
      return { data: null, error };
    }
    
    if (typeof supabase.auth.signInWithOAuth !== 'function') {
      const error = new Error('OAuth method not available. Supabase client may not be properly initialized.');
      console.error('🔐 [Auth] ❌', error.message);
      return { data: null, error };
    }
    
    console.log('🔐 [Auth] ✅ Supabase client validated');
    
    // Warn if ad blocker might be interfering
    if (detectBlockedRequests()) {
      console.warn('🔐 [Auth] ⚠️ Ad blocker detected. If sign-in fails, try disabling it temporarily.');
    }
    
    // Use the base origin for redirect - Supabase will handle the OAuth callback
    const redirectTo = `${window.location.origin}/dashboard`;
    console.log('🔐 [Auth] Step 3: Setting redirect URL:', redirectTo);
    console.log('🔐 [Auth] Current origin:', window.location.origin);
    
    console.log('🔐 [Auth] Step 4: Calling signInWithOAuth...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    console.log('🔐 [Auth] Step 5: OAuth response received');
    console.log('🔐 [Auth] Response data:', data);
    console.log('🔐 [Auth] Response error:', error);
    
    if (error) {
      console.error('🔐 [Auth] ❌ Google OAuth error:', error);
      console.error('🔐 [Auth] Error message:', error.message);
      console.error('🔐 [Auth] Error code:', error.code);
      
      // Provide helpful error message for common issues
      let helpfulMessage = error.message || 'Unknown OAuth error';
      let actionSteps = [];
      
      if (error.message?.includes('Unsupported provider') || 
          error.message?.includes('provider not enabled') || 
          error.message?.includes('not enabled') ||
          (error.message?.toLowerCase().includes('google') && error.message?.toLowerCase().includes('disabled'))) {
        helpfulMessage = 'Google OAuth provider is not enabled in Supabase.';
        actionSteps = [
          '1. Go to Supabase Dashboard: https://app.supabase.com',
          '2. Navigate to: Authentication → Providers',
          '3. Find "Google" in the list',
          '4. Toggle "Enable Google provider" to ON',
          '5. Add your Google OAuth Client ID and Client Secret',
          '6. Save and try again'
        ];
        console.error('🔐 [Auth] ❌ PROVIDER NOT ENABLED - Enable in Supabase Dashboard!');
      } else if (error.message?.includes('blocked') || error.message?.includes('ERR_BLOCKED')) {
        helpfulMessage = 'Sign-in may be blocked by an ad blocker or privacy extension.';
        actionSteps = [
          '1. Disable ad blockers temporarily',
          '2. Add exceptions for: accounts.google.com, oauth2.googleapis.com',
          '3. Try again'
        ];
      } else if (error.message?.includes('redirect_uri_mismatch') || 
                 (error.message?.includes('redirect') && error.message?.includes('mismatch'))) {
        helpfulMessage = 'OAuth redirect URI mismatch.';
        actionSteps = [
          '1. Check Google Cloud Console → APIs & Services → Credentials',
          '2. Verify Authorized redirect URI includes: https://[your-project].supabase.co/auth/v1/callback',
          '3. Check Supabase Dashboard → Authentication → URL Configuration',
          '4. Ensure redirect URLs are whitelisted'
        ];
      } else if (error.message?.includes('invalid_client') || 
                 error.message?.includes('Client ID') ||
                 error.message?.includes('client_id')) {
        helpfulMessage = 'Invalid OAuth client configuration.';
        actionSteps = [
          '1. Go to Supabase Dashboard → Authentication → Providers → Google',
          '2. Verify Client ID and Client Secret are correct',
          '3. Check Google Cloud Console to ensure credentials match',
          '4. Save and try again'
        ];
      } else {
        // Generic error - provide troubleshooting steps
        actionSteps = [
          '1. Check browser console for detailed error messages',
          '2. Verify Google OAuth is enabled in Supabase Dashboard',
          '3. Check that redirect URLs are configured correctly',
          '4. Try refreshing the page and signing in again'
        ];
      }
      
      const enhancedError = new Error(helpfulMessage);
      enhancedError.originalError = error;
      enhancedError.code = error.code || 'OAUTH_ERROR';
      enhancedError.actionSteps = actionSteps;
      
      console.error('🔐 [Auth] Troubleshooting steps:', actionSteps);
      
      // Retry logic for transient errors (network issues, etc.)
      if (retryCount < maxRetries && (
        error.message?.includes('network') || 
        error.message?.includes('fetch') ||
        error.message?.includes('timeout')
      )) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
        console.log(`🔐 [Auth] Retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return signInWithGoogle({ ...options, skipHealthCheck: true, retryCount: retryCount + 1, maxRetries });
      }
      
      return { data: null, error: enhancedError };
    }
    
    // Supabase should automatically redirect, but if it doesn't, manually redirect
    if (data?.url) {
      console.log('🔐 [Auth] ✅ Google OAuth URL generated successfully!');
      console.log('🔐 [Auth] OAuth URL:', data.url);
      console.log('🔐 [Auth] Redirect will go to:', redirectTo);
      console.log('🔐 [Auth] Step 6: Redirecting to Google OAuth...');
      
      // Store redirect info in sessionStorage for post-OAuth handling
      try {
        sessionStorage.setItem('oauth_redirect_to', redirectTo);
        sessionStorage.setItem('oauth_started_at', Date.now().toString());
      } catch (e) {
        console.warn('🔐 [Auth] Could not store OAuth state:', e);
      }
      
      // Redirect immediately - no delay needed
      window.location.href = data.url;
      return { data, error: null };
    } else {
      console.error('🔐 [Auth] ❌ No OAuth URL in response!');
      console.error('🔐 [Auth] Response data:', data);
      const error = new Error('OAuth URL was not generated. This usually means Google OAuth is not properly configured in Supabase.');
      error.actionSteps = [
        '1. Go to Supabase Dashboard → Authentication → Providers → Google',
        '2. Ensure "Enable Google provider" is toggled ON',
        '3. Verify Client ID and Client Secret are entered',
        '4. Save and try again'
      ];
      return { 
        data: null, 
        error
      };
    }
  } catch (error) {
    console.error('🔐 [Auth] ❌ Exception in signInWithGoogle:', error);
    console.error('🔐 [Auth] Error stack:', error.stack);
    
    // Enhance error message for blocked requests
    if (error.message && (error.message.includes('blocked') || error.message.includes('ERR_BLOCKED'))) {
      const enhancedError = new Error(
        'Google sign-in is being blocked. Please disable ad blockers or privacy extensions temporarily, or add exceptions for accounts.google.com and oauth2.googleapis.com'
      );
      enhancedError.originalError = error;
      enhancedError.code = 'BLOCKED_BY_CLIENT';
      return { data: null, error: enhancedError };
    }
    
    return { data: null, error };
  }
};

/**
 * Send a password reset email to the user
 * 
 * Triggers Supabase to send a password reset link to the user's email.
 * The link will redirect to the reset-password page in the app.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<void>}
 */
export const sendPasswordResetEmail = async (email) => {
  try {
    ensureAuthClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
  } catch (error) {
    console.warn('Supabase sendPasswordResetEmail failed:', error);
    throw error;
  }
};

/**
 * Update the user's password
 * 
 * Used after user clicks the password reset link from their email.
 * Requires the user to be in an authenticated session from the reset link.
 * 
 * @param {string} newPassword - New password (min 6 characters)
 * @returns {Promise<Object>} Updated user data
 */
export const updatePassword = async (newPassword) => {
  try {
    ensureAuthClient();
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Supabase updatePassword failed:', error);
    throw error;
  }
};

/**
 * Resend email verification link
 * 
 * Allows users to request a new verification email if they didn't receive
 * the original or if it expired.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<void>}
 */
export const resendVerificationEmail = async (email) => {
  try {
    ensureAuthClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) throw error;
  } catch (error) {
    console.warn('Supabase resendVerificationEmail failed:', error);
    throw error;
  }
};

export default {
  signInUser,
  signUpUser,
  signOutUser,
  getCurrentUser,
  onAuthStateChange,
  signInWithGoogle,
  sendPasswordResetEmail,
  updatePassword,
  resendVerificationEmail,
};
