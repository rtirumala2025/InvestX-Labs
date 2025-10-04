import { useState, useEffect, useContext, createContext } from 'react';
import { createUser, signInUser, signOutUser, onAuthStateChange, signInWithGoogle, signInWithGoogleRedirect, getGoogleRedirectResult } from '../services/firebase/auth';
import { auth } from '../services/firebase/config';
import { createUserProfile, getUserProfile, updateUserProfile as updateUserProfileService } from '../services/firebase/userService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      
      if (user) {
        // Load user profile from Firestore when authenticated
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.warn('Error loading user profile (Firestore may not be configured):', error);
          // Set a basic profile if Firestore fails
          setUserProfile({
            email: user.email,
            displayName: user.displayName || user.email,
            profileCompleted: false
          });
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    // Check for redirect result on app load
    const checkRedirectResult = async () => {
      try {
        const result = await getGoogleRedirectResult();
        if (result?.user) {
          console.log('Google redirect sign-in successful');
          // User profile will be handled by the auth state change above
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }
    };

    checkRedirectResult();

    return unsubscribe;
  }, []);

  const signup = async (email, password, additionalData = {}) => {
    try {
      setLoading(true);
      const userCredential = await createUser(email, password, additionalData);
      
      // Auto-create user document in Firestore on signup
      if (userCredential.user) {
        const userData = {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || `${additionalData.firstName || ''} ${additionalData.lastName || ''}`.trim(),
          firstName: additionalData.firstName || '',
          lastName: additionalData.lastName || '',
          profileCompleted: false,
          profile: {
            age: null,
            monthlyAllowance: null,
            interests: [],
            riskTolerance: null,
            investmentGoals: [],
            experienceLevel: 'beginner'
          },
          notifications: {
            email: true,
            push: true,
            marketUpdates: true,
            educationalContent: true
          }
        };
        
        await createUserProfile(userCredential.user.uid, userData);
      }
      
      return userCredential;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await signInUser(email, password);
      return userCredential;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOutUser();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (useRedirect = false) => {
    try {
      setLoading(true);
      
      // Check if Firebase is properly configured
      if (!auth.app.options.apiKey || auth.app.options.apiKey === 'your_firebase_api_key_here') {
        throw new Error('Firebase is not properly configured. Please check your environment variables.');
      }
      
      let userCredential;
      
      if (useRedirect) {
        // Use redirect method as fallback
        await signInWithGoogleRedirect();
        return null; // Redirect will handle the rest
      } else {
        try {
          // Try popup method first
          userCredential = await signInWithGoogle();
        } catch (error) {
          console.warn('Popup method failed, trying redirect:', error.message);
          
          // If popup fails due to blocking or other issues, try redirect
          if (error.message.includes('popup') || error.message.includes('blocked') || error.message.includes('timed out')) {
            await signInWithGoogleRedirect();
            return null; // Redirect will handle the rest
          }
          
          // Re-throw other errors
          throw error;
        }
      }
      
      // Handle successful popup sign-in
      if (userCredential?.user) {
        try {
          const existingProfile = await getUserProfile(userCredential.user.uid);
          if (!existingProfile) {
            // Create user profile for Google sign-in users
            const userData = {
              email: userCredential.user.email,
              displayName: userCredential.user.displayName || '',
              firstName: userCredential.user.displayName?.split(' ')[0] || '',
              lastName: userCredential.user.displayName?.split(' ').slice(1).join(' ') || '',
              profileCompleted: false,
              profile: {
                age: null,
                monthlyAllowance: null,
                interests: [],
                riskTolerance: null,
                investmentGoals: [],
                experienceLevel: 'beginner'
              },
              notifications: {
                email: true,
                push: true,
                marketUpdates: true,
                educationalContent: true
              }
            };
            
            await createUserProfile(userCredential.user.uid, userData);
          }
        } catch (error) {
          console.error('Error handling Google sign-in profile:', error);
          // Don't throw here - user is still signed in, just profile creation failed
        }
      }
      
      return userCredential;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      await updateUserProfileService(user.uid, updates);
      
      // Refresh user profile
      const updatedProfile = await getUserProfile(user.uid);
      setUserProfile(updatedProfile);
      
      return updatedProfile;
    } catch (error) {
      throw error;
    }
  };

  return {
    user,
    userProfile,
    loading,
    signup,
    login,
    logout,
    loginWithGoogle,
    updateUserProfile
  };
};

export const AuthProvider = ({ children }) => {
  const auth = useAuthProvider();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
