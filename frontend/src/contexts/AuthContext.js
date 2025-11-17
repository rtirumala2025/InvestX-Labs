import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInUser,
  signUpUser,
  signOutUser,
  onAuthStateChange,
  getCurrentUser,
  signInWithGoogle
} from '../services/supabase/auth';
import { supabase } from '../services/supabase/config';
import { useApp } from './AppContext';
import { getAvatarPublicUrl } from '../services/supabase/storage';

const AuthContext = createContext({
  currentUser: null,
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signInWithGoogle: async () => ({}),
  signOut: async () => {},
  updateProfile: async () => ({}),
  // Aliases
  login: async () => ({}),
  logout: async () => {},
  signup: async () => ({}),
  loginWithGoogle: async () => ({}),
  updateUserProfile: async () => ({})
});

const PROFILE_CACHE_KEY = 'investx.cachedProfile';

const getProfileStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Profile cache storage unavailable:', error);
    return null;
  }
};

const loadCachedProfile = () => {
  const storage = getProfileStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load cached profile:', error);
    return null;
  }
};

const persistProfile = (profile) => {
  const storage = getProfileStorage();
  if (!storage) return;

  try {
    if (profile) {
      storage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      storage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch (error) {
    console.warn('Failed to persist profile cache:', error);
  }
};

export function useAuth() {
  return useContext(AuthContext);
}

const enrichProfile = (profile) => {
  if (!profile) return profile;

  const imagePath = profile.profile_image || profile.avatar_url || null;
  const profileImageUrl = getAvatarPublicUrl(imagePath);

  return {
    ...profile,
    profile_image: imagePath,
    avatar_url: imagePath,
    profile_image_url: profileImageUrl
  };
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { registerContext, queueToast } = useApp();
  
  // Session timeout configuration (30 minutes of inactivity)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Handle authentication state changes
  useEffect(() => {
    const handleAuthStateChange = async (user) => {
      if (user) {
        try {
          // Get user profile from Supabase
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          let normalizedProfile = profile;

          if (!normalizedProfile) {
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
              .from('user_profiles')
              .insert([newProfile]);
            
            if (insertError) throw insertError;

            normalizedProfile = newProfile;
          }

          const enrichedUser = {
            ...user,
            profile: enrichProfile(normalizedProfile)
          };

          setCurrentUser(enrichedUser);
          persistProfile(enrichedUser);

          // Get the redirect URL from session storage
          const redirectUrl = sessionStorage.getItem('preAuthUrl') || '/dashboard';
          // Clear it immediately to prevent future redirects
          sessionStorage.removeItem('preAuthUrl');
          
          // Only redirect if we're not already on the target page
          if (window.location.pathname !== redirectUrl) {
            window.location.href = redirectUrl;
          }
        } catch (error) {
          console.debug?.('AuthContext profile handling error', error);
        }
      } else {
        setCurrentUser(null);
        persistProfile(null);
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
          const cached = loadCachedProfile();
          if (cached) {
            setCurrentUser(cached);
          }
          setLoading(false);
        }
      } catch (error) {
        console.debug?.('AuthContext init error', error);
        const cached = loadCachedProfile();
        if (cached) {
          setCurrentUser(cached);
        }
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
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          console.debug?.('AuthContext fetch profile after sign in error', profileError);
          throw profileError;
        }
      const enrichedUser = { ...user, profile: enrichProfile(profile) };
      setCurrentUser(enrichedUser);
      persistProfile(enrichedUser);
      }
      
      return { success: true };
    } catch (error) {
      console.debug?.('AuthContext sign in error', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      const { error } = await signUpUser(email, password, userData);
      
      if (error) throw error;
      
      // User profile is created in the auth state change handler
      // which is triggered automatically after sign up
      
      return { success: true };
    } catch (error) {
      console.debug?.('AuthContext sign up error', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In function
  const handleSignInWithGoogle = async () => {
    try {
      setLoading(true);
      setIsPopupOpen(true);
      
      // Store the current URL to redirect back after sign-in
      if (window.location.pathname !== '/login') {
        sessionStorage.setItem('preAuthUrl', window.location.pathname);
      }
      
      // Call the imported signInWithGoogle service function (not self)
      const { error } = await signInWithGoogle();
      
      if (error) throw error;
      
      // If we get here, it's a redirect flow
      return { 
        success: true, 
        redirecting: true 
      };
    } catch (error) {
      console.debug?.('AuthContext Google Sign-In error', error);
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
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await signOutUser();
      setCurrentUser(null);
      persistProfile(null);
      queueToast?.('Signed out successfully', 'success');
      return { success: true };
    } catch (error) {
      queueToast?.(error.message || 'Unable to sign out', 'error');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [queueToast]);

  // Update user profile
  const updateProfile = async (updates = {}) => {
    try {
      setLoading(true);
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      const {
        full_name,
        name,
        bio,
        profile_image,
        avatar_url,
        email,
        ...rest
      } = updates;

      const profilePayload = {
        ...(full_name || name ? { full_name: full_name ?? name } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(profile_image || avatar_url ? { profile_image: profile_image ?? avatar_url, avatar_url: profile_image ?? avatar_url } : {}),
        ...rest,
        updated_at: new Date().toISOString(),
      };

      const sanitizedProfilePayload = Object.fromEntries(
        Object.entries(profilePayload).filter(([, value]) => value !== undefined)
      );

      let updatedProfile = currentUser.profile || {};

      if (Object.keys(sanitizedProfilePayload).length) {
        const { data, error } = await supabase
          .from('user_profiles')
          .update(sanitizedProfilePayload)
          .eq('id', currentUser.id)
          .select()
          .maybeSingle();

        if (error) {
          throw error;
        }

        updatedProfile = data
          ? enrichProfile({ ...updatedProfile, ...data })
          : enrichProfile({ ...updatedProfile, ...sanitizedProfilePayload });
      }

      let updatedUser = currentUser;
      if (email && email !== currentUser.email) {
        const { data: authData, error: authError } = await supabase.auth.updateUser({ email });
        if (authError) {
          throw authError;
        }
        updatedUser = authData?.user
          ? { ...authData.user, profile: updatedProfile }
          : { ...currentUser, email, profile: updatedProfile };
      } else {
        updatedUser = { ...currentUser, profile: updatedProfile };
      }

      setCurrentUser(updatedUser);
      persistProfile(updatedUser);

      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.debug?.('AuthContext updateProfile error', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Session Timeout Management
   * 
   * Automatically logs out user after 30 minutes of inactivity.
   * Inactivity is detected by monitoring mouse movements and keyboard presses.
   * Timer is reset on each user interaction.
   */
  useEffect(() => {
    // Only set up timeout if user is logged in
    if (!currentUser) return;

    let inactivityTimer;

    /**
     * Reset the inactivity timer
     * Called on every user interaction (mousemove, keypress, click)
     */
    const resetInactivityTimer = () => {
      // Clear existing timer
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      // Set new timer
      inactivityTimer = setTimeout(async () => {
        try {
          await signOut();
          // Show notification to user
          if (window.confirm('Your session has expired due to inactivity. Please log in again.')) {
            window.location.href = '/login';
          }
        } catch (error) {
          console.debug?.('AuthContext session timeout error', error);
        }
      }, SESSION_TIMEOUT);
    };

    // Activity event listeners
    const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
    
    // Add event listeners for user activity
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Initialize the timer
    resetInactivityTimer();

    // Cleanup function
    return () => {
      // Remove all event listeners
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      // Clear the timeout
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [currentUser, SESSION_TIMEOUT, signOut]);

  useEffect(() => {
    let unregister;
    if (registerContext) {
      unregister = registerContext('auth', {
        currentUser,
        loading,
        isPopupOpen,
      });
    }
    return () => unregister?.();
  }, [currentUser, isPopupOpen, loading, registerContext]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`user-profile-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${currentUser.id}`
        },
        (payload) => {
          const nextProfile = enrichProfile(payload.new || payload.old);
          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  profile: {
                    ...(prev.profile || {}),
                    ...nextProfile
                  }
                }
              : prev
          );
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('🔐 [AuthContext] Realtime profile sync disconnected:', status);
          // Don't show toast on every disconnect - only log it
          // queueToast?.('Realtime profile sync disconnected. Some updates may be delayed.', 'warning');
        } else if (status === 'SUBSCRIBED') {
          console.log('🔐 [AuthContext] Realtime profile sync connected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, queueToast]);

  const value = {
    currentUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle: handleSignInWithGoogle,
    signOut,
    updateProfile,
    // Aliases for compatibility with different naming conventions
    login: signIn,
    logout: signOut,
    signup: signUp,
    loginWithGoogle: handleSignInWithGoogle,
    updateUserProfile: updateProfile,
    user: currentUser,
    userProfile: currentUser?.profile,
    error: null,
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