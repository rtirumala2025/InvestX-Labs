import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInUser,
  signUpUser,
  signOutUser,
  onAuthStateChange,
  getCurrentUser,
  signInWithGoogle,
  updateUserProfile
} from '../services/supabase/auth';
import { supabase } from '../services/supabase/config';

const AuthContext = createContext({
  currentUser: null,
  loading: true,
  signIn: async () => ({}),
  signInWithGoogle: async () => ({}),
  signOut: async () => {},
  updateProfile: async () => ({})
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Handle authentication state changes
  useEffect(() => {
    const handleAuthStateChange = async (user) => {
      if (user) {
        try {
          // Get user profile from Supabase
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!profile) {
            // Create a new profile if it doesn't exist
            const newProfile = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email.split('@')[0],
              username: user.user_metadata?.username || user.email.split('@')[0],
              profile_completed: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const { error: insertError } = await supabase
              .from('profiles')
              .insert([newProfile]);

            if (insertError) throw insertError;
          }

          setCurrentUser({
            ...user,
            profile
          });

          // Get the redirect URL from session storage
          const redirectUrl = sessionStorage.getItem('preAuthUrl') || '/dashboard';
          // Clear it immediately to prevent future redirects
          sessionStorage.removeItem('preAuthUrl');
          
          // Only redirect if we're not already on the target page
          if (window.location.pathname !== redirectUrl) {
            window.location.href = redirectUrl;
          }
        } catch (error) {
          console.error('Error processing user profile:', error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    };

    // Set up the initial auth state
    const initializeAuth = async () => {
      try {
        // Check current auth state
        const user = await getCurrentUser();
        if (user) {
          await handleAuthStateChange(user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const unsubscribe = onAuthStateChange(handleAuthStateChange);
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { user, error } = await signInUser(email, password);
      
      if (error) throw error;
      
      // Get user profile after successful sign in
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        setCurrentUser({ ...user, ...profile });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      const { user, error } = await signUpUser(email, password, userData);
      
      if (error) throw error;
      
      // User profile is created in the auth state change handler
      // which is triggered automatically after sign up
      
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In function
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setIsPopupOpen(true);
      
      // Store the current URL to redirect back after sign-in
      if (window.location.pathname !== '/login') {
        sessionStorage.setItem('preAuthUrl', window.location.pathname);
      }
      
      // This will redirect to Google OAuth page
      const { error } = await signInWithGoogle();
      
      if (error) throw error;
      
      // If we get here, it's a redirect flow
      return { 
        success: true, 
        redirecting: true 
      };
    } catch (error) {
      console.error('Google Sign-In error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign in with Google' 
      };
    } finally {
      setIsPopupOpen(false);
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      setCurrentUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }
      
      // Update the user's profile
      await updateUserProfile(currentUser.uid, updates);
      
      // Update local state
      setCurrentUser(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...updates,
          profileCompleted: true
        }
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    login: signIn,
    logout: signOut,
    isPopupOpen
  };

  // Show loading state if we're still initializing auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Overlay when popup is open */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Completing sign in...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}