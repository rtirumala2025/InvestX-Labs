import { supabase } from './config';

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

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    ensureAuthClient();
    console.log('🔐 [Auth] Initiating Google OAuth sign in');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    if (error) {
      console.error('🔐 [Auth] ❌ Google OAuth error:', error.message);
      throw error;
    }
    
    console.log('🔐 [Auth] ✅ Google OAuth initiated, redirecting...');
    return data;
  } catch (error) {
    console.warn('Supabase signInWithGoogle failed:', error);
    throw error;
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
