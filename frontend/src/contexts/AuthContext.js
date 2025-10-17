import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInUser, signOutUser, onAuthStateChange, signInWithGoogle as signInWithGoogleAuth } from '../services/firebase/auth';
import { getUserProfile } from '../services/firebase/userService';

const AuthContext = createContext({
  currentUser: null,
  loading: true,
  signIn: async () => ({}),
  signInWithGoogle: async () => ({}),  // Add this line
  signOut: async () => {},
  updateProfile: async () => ({})
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        // Load user profile when authenticated
        try {
          const profile = await getUserProfile(user.uid);
          setCurrentUser({
            ...user,
            profile: profile || {
              email: user.email,
              displayName: user.displayName || user.email,
              profileCompleted: false
            }
          });
        } catch (error) {
          console.error('Error loading user profile:', error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
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

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
const signInWithGoogle = async () => {
  try {
    setLoading(true);
    const result = await signInWithGoogleAuth();
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    return { success: false, error: error.message };
  } finally {
    setLoading(false);
  }
};

// Then the value object
const value = {
  currentUser,
  loading,
  signIn,
  signInWithGoogle,  // Now this is defined above
  signOut,
  login: signIn,
  logout: signOut
};

  // Always render children, but provide loading state in the context
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
