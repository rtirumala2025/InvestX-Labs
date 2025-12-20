import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle as signInWithGoogleService } from '../services/supabase/auth';
import { supabase } from '../services/supabase/config';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import OAuthHealthChecker from '../components/auth/OAuthHealthChecker';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('remember_me') === 'true';
  });
  const [rateLimitRemaining, setRateLimitRemaining] = useState(null);
  const [sessionExpiryWarning, setSessionExpiryWarning] = useState(null);
  const [preventRedirect, setPreventRedirect] = useState(false);
  const { signIn: login, signInWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // DON'T auto-redirect on login page - let the authentication flow handle redirects
  // Auto-redirect causes issues when there's a stale session or when user is trying to sign in
  // The AuthContext and successful login flows will handle navigation
  useEffect(() => {
    // Only log for debugging - don't redirect automatically
    if (currentUser && !loading) {
      console.log('🔐 [LoginPage] User detected on login page (not redirecting - let auth flow handle it)');
    }
  }, [currentUser, loading]);

  // Debug: Log when component mounts and clear stale sessions
  useEffect(() => {
    // Clear stale cached session that's causing "Offline read-only mode"
    const cachedSessionKey = 'investx.cachedSession';
    const staleSession = localStorage.getItem(cachedSessionKey);
    if (staleSession) {
      console.log('🔐 [LoginPage] Clearing stale cached session');
      localStorage.removeItem(cachedSessionKey);
    }
    
    console.log('🔐 [LoginPage] Component mounted', {
      loading,
      hasSignInWithGoogle: typeof signInWithGoogle === 'function',
      hasSignInWithGoogleService: typeof signInWithGoogleService === 'function',
      hasSupabase: !!supabase,
      supabaseAuth: !!supabase?.auth
    });
    
    // Test if button exists in DOM after mount
    setTimeout(() => {
      const googleButtons = document.querySelectorAll('button[type="button"]');
      console.log('🔐 [LoginPage] Buttons found in DOM:', googleButtons.length);
      googleButtons.forEach((btn, idx) => {
        console.log(`🔐 [LoginPage] Button ${idx}:`, {
          text: btn.textContent?.trim(),
          disabled: btn.disabled,
          hasOnClick: btn.onclick !== null
        });
      });
    }, 1000);
  }, []);

  // Task 24: Session expiration check
  useEffect(() => {
    const checkSession = setInterval(() => {
      // Check if there's a session expiry time stored
      const expiryTime = localStorage.getItem('session_expiry');
      if (expiryTime) {
        const timeUntilExpiry = new Date(expiryTime) - new Date();
        const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
        
        if (minutesUntilExpiry > 0 && minutesUntilExpiry <= 5) {
          setSessionExpiryWarning(minutesUntilExpiry);
        } else if (minutesUntilExpiry <= 0) {
          setSessionExpiryWarning(0);
        } else {
          setSessionExpiryWarning(null);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkSession);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Task 24: Store remember me preference
        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remember_me');
          localStorage.removeItem('remembered_email');
        }
        
        // Set session expiry (default 30 minutes, extend if remember me)
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + (rememberMe ? 60 * 24 : 30));
        localStorage.setItem('session_expiry', expiryTime.toISOString());
        
        navigate('/dashboard');
      } else {
        // Task 24: Check for rate limit error
        if (result.error?.includes('rate limit') || result.error?.includes('too many')) {
          const retryAfter = result.retryAfter || 60;
          setRateLimitRemaining(retryAfter);
          setError(`Too many login attempts. Please try again in ${retryAfter} seconds.`);
          
          // Countdown timer
          const interval = setInterval(() => {
            setRateLimitRemaining(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setError(result.error || 'Failed to log in. Please check your credentials.');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (e) => {
    // CRITICAL: Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // CRITICAL: Log immediately to verify function is called
    console.log('🔐 [LoginPage] ========== handleGoogleSignIn CALLED ==========');
    
    setError('');
    setLoading(true);
    setPreventRedirect(true);
    
    try {
      // Verify Supabase client is available
      if (!supabase || !supabase.auth) {
        const errorMsg = 'Supabase client is not available. Please refresh the page.';
        console.error('🔐 [LoginPage] ❌', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('🔐 [LoginPage] ✅ Supabase client verified');
      console.log('🔐 [LoginPage] Calling signInWithGoogleService...');
      
      // Call the service function directly
      const result = await signInWithGoogleService();
      
      console.log('🔐 [LoginPage] signInWithGoogleService result:', result);
      console.log('🔐 [LoginPage] Result has error:', !!result.error);
      console.log('🔐 [LoginPage] Result has data:', !!result.data);
      console.log('🔐 [LoginPage] Result data URL:', result.data?.url);
      
      // Service function returns { data, error }
      if (result.error) {
        console.error('🔐 [LoginPage] ❌ OAuth error received:', result.error);
        console.error('🔐 [LoginPage] Error message:', result.error.message);
        console.error('🔐 [LoginPage] Error code:', result.error.code);
        console.error('🔐 [LoginPage] Error actionSteps:', result.error.actionSteps);
        throw result.error;
      }
      
      // If we have a URL, redirect is happening (OAuth succeeded)
      if (result.data?.url) {
        console.log('🔐 [LoginPage] ✅ OAuth redirect URL received:', result.data.url);
        console.log('🔐 [LoginPage] Redirecting to Google OAuth...');
        // The service function already redirects via window.location.href
        // Don't set loading to false as we're redirecting
        return;
      }
      
      // If no redirect URL and no error, this is unexpected - show error
      console.error('🔐 [LoginPage] ❌ No OAuth URL and no error - OAuth not configured');
      const noUrlError = new Error('OAuth URL was not generated. Google OAuth is not properly configured in Supabase.');
      noUrlError.actionSteps = [
        '1. Go to Supabase Dashboard: https://app.supabase.com',
        '2. Navigate to: Authentication → Providers',
        '3. Find "Google" in the list and click it',
        '4. Toggle "Enable Google provider" to ON',
        '5. Add your Google OAuth Client ID and Client Secret',
        '6. Click "Save" and try again'
      ];
      throw noUrlError;
    } catch (error) {
      console.error('🔐 [LoginPage] ❌ Google sign-in error caught:', error);
      
      // Build error message with action steps
      let errorMessage = error?.message || 'Failed to sign in with Google';
      let actionSteps = error?.actionSteps || [];
      
      // If no action steps, provide default based on error message
      if (actionSteps.length === 0) {
        if (errorMessage.includes('provider') || errorMessage.includes('not enabled') || errorMessage.includes('disabled')) {
          actionSteps = [
            '1. Go to Supabase Dashboard: https://app.supabase.com',
            '2. Navigate to: Authentication → Providers',
            '3. Find "Google" and toggle it ON',
            '4. Add your Google OAuth Client ID and Client Secret',
            '5. Save and try again'
          ];
        } else if (errorMessage.includes('redirect') || errorMessage.includes('URI')) {
          actionSteps = [
            '1. Check Google Cloud Console → APIs & Services → Credentials',
            '2. Verify Authorized redirect URI includes: https://[your-project].supabase.co/auth/v1/callback',
            '3. Check Supabase Dashboard → Authentication → URL Configuration'
          ];
        } else if (errorMessage.includes('client') || errorMessage.includes('invalid')) {
          actionSteps = [
            '1. Go to Supabase Dashboard → Authentication → Providers → Google',
            '2. Verify Client ID and Client Secret are correct',
            '3. Check Google Cloud Console to ensure credentials match',
            '4. Save and try again'
          ];
        } else {
          actionSteps = [
            '1. Check browser console (F12) for detailed error messages',
            '2. Verify Google OAuth is enabled in Supabase Dashboard',
            '3. Check that redirect URLs are configured correctly',
            '4. Try refreshing the page and signing in again'
          ];
        }
      }
      
      // Build final error message
      if (actionSteps.length > 0) {
        errorMessage += '\n\n📋 To fix this:\n' + actionSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n');
      }
      
      console.error('🔐 [LoginPage] Setting error message:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      setPreventRedirect(false); // Allow redirects again after error is set
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden font-sans">
      {/* Floating gradient orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-r from-blue-500/40 to-purple-500/30 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 right-0 w-[28rem] h-[28rem] bg-gradient-to-r from-orange-400/30 to-pink-400/20 rounded-full blur-3xl"
        animate={{ y: [0, -30, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
      />

      {/* Floating Color Dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-3 h-3 bg-blue-400/60 rounded-full blur-sm"
          animate={{
            x: [0, 100, -50, 80, 0],
            y: [0, -80, 60, -40, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ left: '10%', top: '20%' }}
        />
        <motion.div
          className="absolute w-2.5 h-2.5 bg-purple-400/50 rounded-full blur-sm"
          animate={{
            x: [0, -60, 90, -30, 0],
            y: [0, 70, -90, 40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          style={{ right: '15%', top: '30%' }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-orange-300/50 rounded-full blur-sm"
          animate={{
            x: [0, -90, 40, -70, 0],
            y: [0, 50, -80, 60, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          style={{ left: '80%', bottom: '20%' }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-12">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <GlassCard 
            variant="hero" 
            padding="xl" 
            shadow="xl" 
            className="max-w-md w-full"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-orange-300">
                Welcome back
              </h1>
              <p className="text-gray-300">Sign in to continue your learning journey</p>
            </div>

            <OAuthHealthChecker />
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm"
                >
                  <div className="text-red-300 text-sm whitespace-pre-line font-mono text-xs">
                    {error.split('\n').map((line, idx) => (
                      <div key={idx} className={line.startsWith('📋') || line.match(/^\d+\./) ? 'mt-2 font-semibold' : ''}>
                        {line}
                      </div>
                    ))}
                  </div>
                  {rateLimitRemaining !== null && (
                    <p className="text-red-200 text-xs mt-2">
                      Retry in: {rateLimitRemaining} seconds
                    </p>
                  )}
                </motion.div>
              )}

              {sessionExpiryWarning !== null && sessionExpiryWarning > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-sm"
                >
                  <p className="text-yellow-300 text-sm">
                    ⚠️ Your session will expire in {sessionExpiryWarning} minute{sessionExpiryWarning !== 1 ? 's' : ''}. Please save your work.
                  </p>
                </motion.div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50 focus:ring-2"
                  />
                  <span className="ml-2">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-blue-300 hover:text-blue-200 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <GlassButton
                type="submit"
                disabled={loading}
                variant="primary"
                size="large"
                className="w-full"
                loading={loading}
              >
                Sign In
              </GlassButton>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-900 text-gray-400">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                id="google-signin-button"
                onClick={async (e) => {
                  // CRITICAL: Prevent any default behavior and stop propagation IMMEDIATELY
                  if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                  }
                  
                  // Log immediately to verify handler is called
                  console.log('🔐 [LoginPage] ========== BUTTON CLICKED ==========');
                  console.log('🔐 [LoginPage] Button click handler is running!');
                  console.log('🔐 [LoginPage] Event:', e);
                  console.log('🔐 [LoginPage] Event type:', e?.type);
                  console.log('🔐 [LoginPage] Current target:', e?.currentTarget);
                  console.log('🔐 [LoginPage] Button disabled?', e?.currentTarget?.disabled);
                  console.log('🔐 [LoginPage] Loading state:', loading);
                  
                  // Set loading immediately and prevent auto-redirect
                  setLoading(true);
                  setError('');
                  setPreventRedirect(true);
                  
                  try {
                    await handleGoogleSignIn(e);
                  } catch (err) {
                    console.error('🔐 [LoginPage] ❌ Unhandled error in handleGoogleSignIn:', err);
                    console.error('🔐 [LoginPage] Error details:', {
                      message: err?.message,
                      stack: err?.stack,
                      name: err?.name,
                      actionSteps: err?.actionSteps
                    });
                    
                    // Build error message with action steps
                    let errorMsg = err?.message || 'An unexpected error occurred';
                    if (err?.actionSteps && err.actionSteps.length > 0) {
                      errorMsg += '\n\n📋 To fix this:\n' + err.actionSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n');
                    }
                    
                    setError(errorMsg);
                    setLoading(false);
                    setPreventRedirect(false); // Allow redirects again after error is set
                  }
                }}
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-4 text-lg font-medium rounded-xl border border-white/20 bg-white/8 hover:bg-white/15 text-white backdrop-blur-2xl backdrop-saturate-150 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-300 hover:text-blue-200 font-medium transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;