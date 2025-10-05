import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInUser, signOutUser, onAuthStateChange } from '../services/firebase/auth';
import { getUserProfile } from '../services/firebase/userService';

const AuthContext = createContext();

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

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    // Add other auth methods as needed
    login: signIn, // Alias for backward compatibility
    logout: signOut // Alias for backward compatibility
  };

  // Always render children, but provide loading state in the context
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
