import { supabase } from './config';

// Sign in with email and password
export const signInUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.fullName,
        username: userData.username,
      },
      // Redirect user to email verification page after clicking email link
      emailRedirectTo: `${window.location.origin}/verify-email`,
    },
  });

  if (error) throw error;
  return data;
};

// Sign out
export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Listen for auth state changes
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  
  return () => subscription?.unsubscribe();
};

// Sign in with Google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  
  if (error) throw error;
  return data;
};

// Update user profile
export const updateUserProfile = async (updates) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });
  
  if (error) throw error;
  return data;
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
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) throw error;
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
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) throw error;
  return data;
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
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
  });
  
  if (error) throw error;
};

export default {
  signInUser,
  signUpUser,
  signOutUser,
  getCurrentUser,
  onAuthStateChange,
  signInWithGoogle,
  updateUserProfile,
  sendPasswordResetEmail,
  updatePassword,
  resendVerificationEmail,
};
