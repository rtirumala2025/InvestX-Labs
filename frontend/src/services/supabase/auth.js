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

// Sign up with email and password
export const signUpUser = async (email, password, userData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.fullName,
        username: userData.username,
      },
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

export default {
  signInUser,
  signUpUser,
  signOutUser,
  getCurrentUser,
  onAuthStateChange,
  signInWithGoogle,
  updateUserProfile,
};
