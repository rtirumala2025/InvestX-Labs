import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  getIdToken,
  reload
} from 'firebase/auth';
import { auth } from './config';
import { 
  handleFirebaseError, 
  withFirebaseErrorHandling, 
  createNetworkAwareOperation,
  isOfflineError 
} from '../../utils/firebaseErrorHandler';

/**
 * Create a new user account with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {Object} additionalData - Additional user data (firstName, lastName)
 * @returns {Promise<Object>} User credential object
 */
export const createUser = async (email, password, additionalData = {}) => {
  return withFirebaseErrorHandling(
    async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with additional data
      if (additionalData.firstName || additionalData.lastName) {
        await updateProfile(user, {
          displayName: `${additionalData.firstName || ''} ${additionalData.lastName || ''}`.trim()
        });
      }
      
      return userCredential;
    },
    'createUser'
  );
};

/**
 * Sign in user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} User credential object
 */
export const signInUser = async (email, password) => {
  return withFirebaseErrorHandling(
    async () => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    },
    'signInUser'
  );
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
  return withFirebaseErrorHandling(
    async () => {
      await signOut(auth);
    },
    'signOutUser'
  );
};

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Sign in with Google
 * @returns {Promise<Object>} User credential object
 */
export const signInWithGoogle = async () => {
  return withFirebaseErrorHandling(
    async () => {
      // Check if Firebase is properly configured
      if (!auth.app.options.apiKey || auth.app.options.apiKey === 'your_firebase_api_key_here') {
        throw new Error('Firebase is not properly configured. Please check your environment variables.');
      }

      const provider = new GoogleAuthProvider();
      
      // Add custom parameters for better user experience
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'offline'
      });
      
      // First, try to detect if popups are blocked
      let testPopup;
      try {
        testPopup = window.open('', '_blank', 'width=1,height=1');
        if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
          throw new Error('Popup blocked. Please allow popups for this site and try again.');
        }
        testPopup.close();
      } catch (error) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      let result;
      try {
        // Add a timeout to prevent hanging
        const signInPromise = signInWithPopup(auth, provider);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Sign-in timed out. Please try again.')), 30000);
        });
        
        result = await Promise.race([signInPromise, timeoutPromise]);
        
        // Verify the result
        if (!result || !result.user) {
          throw new Error('Sign-in failed. No user data received.');
        }
        
      } catch (error) {
        console.error('Google sign-in error details:', error);
        
        // Handle specific Firebase Auth errors
        switch (error.code) {
          case 'auth/popup-blocked':
            throw new Error('Popup blocked. Please allow popups for this site and try again.');
          case 'auth/popup-closed-by-user':
            throw new Error('Sign-in cancelled. Please try again.');
          case 'auth/cancelled-popup-request':
            throw new Error('Sign-in cancelled. Please try again.');
          case 'auth/account-exists-with-different-credential':
            throw new Error('An account already exists with this email using a different sign-in method.');
          case 'auth/operation-not-allowed':
            throw new Error('Google sign-in is not enabled. Please contact support.');
          case 'auth/unauthorized-domain':
            throw new Error('This domain is not authorized for Google sign-in. Please contact support.');
          case 'auth/invalid-api-key':
            throw new Error('Invalid Firebase configuration. Please contact support.');
          case 'auth/network-request-failed':
            throw new Error('Network error. Please check your internet connection and try again.');
          case 'auth/too-many-requests':
            throw new Error('Too many failed attempts. Please try again later.');
          default:
            if (error.message.includes('timed out')) {
              throw error;
            }
            throw new Error(`Sign-in failed: ${error.message || 'Unknown error occurred'}`);
        }
      }
      
      return result;
    },
    'signInWithGoogle'
  );
};

/**
 * Sign in with Google using redirect (fallback for popup issues)
 * @returns {Promise<Object>} User credential object
 */
export const signInWithGoogleRedirect = async () => {
  return withFirebaseErrorHandling(
    async () => {
      // Check if Firebase is properly configured
      if (!auth.app.options.apiKey || auth.app.options.apiKey === 'your_firebase_api_key_here') {
        throw new Error('Firebase is not properly configured. Please check your environment variables.');
      }

      const provider = new GoogleAuthProvider();
      
      // Add custom parameters for better user experience
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'offline'
      });
      
      // Use redirect instead of popup
      await signInWithRedirect(auth, provider);
      
      // Note: This function will cause a page redirect, so it won't return normally
      // The result should be handled by getGoogleRedirectResult() after redirect
      return null;
    },
    'signInWithGoogleRedirect'
  );
};

/**
 * Get the result of Google redirect sign-in
 * @returns {Promise<Object|null>} User credential object or null
 */
export const getGoogleRedirectResult = async () => {
  return withFirebaseErrorHandling(
    async () => {
      const result = await getRedirectResult(auth);
      return result;
    },
    'getGoogleRedirectResult'
  );
};

/**
 * Get the current user
 * @returns {Object|null} Current user object or null
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Get the current user's ID token with retry logic
 * @param {boolean} forceRefresh - Whether to force refresh the token
 * @returns {Promise<string>} ID token
 */
export const getCurrentUserToken = async (forceRefresh = false) => {
  const networkAwareGetToken = createNetworkAwareOperation(
    async () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      try {
        return await getIdToken(user, forceRefresh);
      } catch (error) {
        // If token refresh fails due to network issues, try to reload user
        if (isOfflineError(error)) {
          console.warn('Token refresh failed due to network issues, attempting user reload');
          try {
            await reload(user);
            return await getIdToken(user, false);
          } catch (reloadError) {
            console.error('User reload failed:', reloadError);
            throw error; // Throw original error
          }
        }
        throw error;
      }
    },
    {
      maxRetries: 2,
      baseDelay: 1000,
      queueWhenOffline: false // Don't queue token operations
    }
  );

  return withFirebaseErrorHandling(
    () => networkAwareGetToken(),
    'getCurrentUserToken'
  );
};

/**
 * Refresh the current user's authentication state
 * @returns {Promise<Object>} Updated user object
 */
export const refreshUserAuth = async () => {
  const networkAwareRefresh = createNetworkAwareOperation(
    async () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user to refresh');
      }
      
      try {
        await reload(user);
        return user;
      } catch (error) {
        // If reload fails, try to get a fresh token
        if (isOfflineError(error)) {
          console.warn('User reload failed due to network issues, attempting token refresh');
          try {
            await getIdToken(user, true);
            return user;
          } catch (tokenError) {
            console.error('Token refresh also failed:', tokenError);
            throw error; // Throw original error
          }
        }
        throw error;
      }
    },
    {
      maxRetries: 2,
      baseDelay: 1000,
      queueWhenOffline: false
    }
  );

  return withFirebaseErrorHandling(
    () => networkAwareRefresh(),
    'refreshUserAuth'
  );
};

/**
 * Check if the current user's token is valid and refresh if needed
 * @returns {Promise<boolean>} True if user is authenticated and token is valid
 */
export const validateUserAuth = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }

    // Try to get token to validate authentication
    const tokenResult = await getCurrentUserToken(false);
    return tokenResult.success;
  } catch (error) {
    console.warn('User authentication validation failed:', error);
    return false;
  }
};
