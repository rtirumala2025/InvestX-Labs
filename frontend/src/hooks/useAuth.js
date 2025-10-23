import { useState, useEffect, useContext, createContext } from 'react';
import {
  signInUser,
  signUpUser,
  signOutUser,
  onAuthStateChange,
  signInWithGoogle,
  getCurrentUser,
  updateUserProfile as updateSupabaseProfile
} from '../services/supabase/auth';

const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const useAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state and set up listener
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // First check if there's an existing session
        const { data: { session } } = await getCurrentUser();
        
        if (mounted) {
          if (session?.user) {
            await handleAuthStateChange(session.user);
          } else {
            setUser(null);
            setUserProfile(null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      if (session?.user) {
        handleAuthStateChange(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleAuthStateChange = async (userData) => {
    setUser(userData);
    
    if (userData) {
      setUserProfile({
        ...userData.user_metadata,
        email: userData.email,
        displayName: userData.user_metadata?.full_name || userData.email,
        profileCompleted: !!userData.user_metadata?.full_name
      });
    } else {
      setUserProfile(null);
    }
  };

  const signup = async (email, password, userData = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await signUpUser(email, password, {
        fullName: userData.displayName || email.split('@')[0],
        username: email.split('@')[0],
        ...userData
      });

      if (error) throw error;
      
      return { 
        success: true,
        user: {
          ...data.user,
          displayName: userData.displayName || email.split('@')[0]
        } 
      };
    } catch (err) {
      console.error('Signup error:', err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await signInUser(email, password);
      if (error) throw error;
      
      return { 
        success: true,
        user: data.user
      };
    } catch (err) {
      console.error('Login error:', err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await signOutUser();
      if (error) throw error;
      
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await signInWithGoogle();
      if (error) throw error;
      
      return { 
        success: true,
        user: data.user
      };
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user is signed in' };
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await updateSupabaseProfile({
        data: {
          full_name: updates.displayName,
          ...updates
        }
      });
      
      if (error) throw error;
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        ...updates,
        displayName: updates.displayName || prev.displayName,
        profileCompleted: true
      }));
      
      return { success: true };
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    userProfile,
    loading,
    error,
    signup,
    login,
    logout,
    loginWithGoogle,
    updateUserProfile
  };
};

const AuthProvider = ({ children }) => {
  const auth = useAuthProvider();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };
