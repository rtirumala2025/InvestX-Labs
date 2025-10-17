import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInUser, 
  signOutUser, 
  onAuthStateChange,
  getCurrentUser,
  signInWithGoogle as signInWithGoogleAuth,
  getGoogleRedirectResult
} from '../services/firebase/auth';
import { 
  getUserProfile, 
  createUserProfile,
  updateUserProfile  // Added missing import
} from '../services/firebase/userService';

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
          let profile = await getUserProfile(user.uid);
          if (!profile) {
            // Create a new profile if it doesn't exist
            profile = {
              email: user.email,
              displayName: user.displayName || user.email,
              profileCompleted: false
            };
            await createUserProfile(user.uid, profile);
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
        // First check for a redirect result
        const result = await getGoogleRedirectResult();
        if (result?.user) {
          await handleAuthStateChange(result.user);
          return;
        }
        
        // If no redirect result, check current auth state
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

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const result = await signInUser(email, password);
      return { success: true, user: result.user };
    } catch (error) {
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
      
      const result = await signInWithGoogleAuth();
      
      if (result?.user) {
        // For popup flow
        const profile = {
          email: result.user.email,
          displayName: result.user.displayName || result.user.email,
          profileCompleted: false
        };
        
        // Create or update user profile
        await createUserProfile(result.user.uid, profile);
        
        setCurrentUser({
          ...result.user,
          profile
        });
        
        return { 
          success: true, 
          user: result.user,
          redirecting: false
        };
      }
      
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