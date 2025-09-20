/**
 * Centralized Firebase Error Handler
 * Provides consistent error handling and logging for Firebase operations
 */

// Error types for better categorization
export const FIREBASE_ERROR_TYPES = {
  AUTH: 'authentication',
  FIRESTORE: 'firestore',
  STORAGE: 'storage',
  FUNCTIONS: 'functions',
  NETWORK: 'network',
  PERMISSION: 'permission',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
};

// Common Firebase error codes
export const FIREBASE_ERROR_CODES = {
  // Authentication errors
  'auth/user-not-found': 'User not found',
  'auth/wrong-password': 'Incorrect password',
  'auth/email-already-in-use': 'Email already in use',
  'auth/weak-password': 'Password is too weak',
  'auth/invalid-email': 'Invalid email address',
  'auth/user-disabled': 'User account has been disabled',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later',
  'auth/network-request-failed': 'Network error. Please check your connection',
  
  // Firestore errors
  'permission-denied': 'You do not have permission to perform this action',
  'not-found': 'Document not found',
  'already-exists': 'Document already exists',
  'failed-precondition': 'Operation failed due to a precondition',
  'unavailable': 'Service temporarily unavailable',
  'deadline-exceeded': 'Operation timed out',
  
  // Network errors
  'unavailable': 'Service unavailable',
  'deadline-exceeded': 'Request timeout',
  'auth/network-request-failed': 'Network error. Please check your connection',
  'auth/too-many-requests': 'Too many requests. Please try again later',
  
  // Offline errors
  'failed-precondition': 'Client is offline. Changes will sync when connection is restored',
  'unavailable': 'Service temporarily unavailable. Please check your connection'
};

/**
 * Get user-friendly error message from Firebase error
 * @param {Error} error - Firebase error object
 * @param {string} context - Context where the error occurred
 * @returns {string} User-friendly error message
 */
export const getFirebaseErrorMessage = (error, context = 'operation') => {
  if (!error) return 'An unknown error occurred';
  
  // Check for Firebase error code
  if (error.code && FIREBASE_ERROR_CODES[error.code]) {
    return FIREBASE_ERROR_CODES[error.code];
  }
  
  // Check for custom error message
  if (error.message) {
    // Handle specific error patterns
    if (error.message.includes('permission')) {
      return 'You do not have permission to perform this action';
    }
    if (error.message.includes('network') || error.message.includes('ERR_NAME_NOT_RESOLVED') || error.message.includes('ERR_INTERNET_DISCONNECTED')) {
      return 'Network error. Please check your connection and try again';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again';
    }
    if (error.message.includes('quota')) {
      return 'Service quota exceeded. Please try again later';
    }
    if (error.message.includes('offline') || error.message.includes('Failed to get document because the client is offline')) {
      return 'You are currently offline. Changes will sync when connection is restored';
    }
    if (error.message.includes('Could not reach Cloud Firestore backend')) {
      return 'Cannot connect to database. Please check your internet connection';
    }
  }
  
  // Default fallback messages based on context
  const contextMessages = {
    'authentication': 'Authentication failed. Please check your credentials',
    'firestore': 'Database operation failed. Please try again',
    'storage': 'File operation failed. Please try again',
    'functions': 'Server operation failed. Please try again',
    'network': 'Network error. Please check your connection',
    'permission': 'You do not have permission to perform this action',
    'validation': 'Invalid data provided. Please check your input',
    'operation': 'Operation failed. Please try again'
  };
  
  return contextMessages[context] || 'An unexpected error occurred. Please try again';
};

/**
 * Determine error type from Firebase error
 * @param {Error} error - Firebase error object
 * @returns {string} Error type
 */
export const getFirebaseErrorType = (error) => {
  if (!error) return FIREBASE_ERROR_TYPES.UNKNOWN;
  
  if (error.code) {
    if (error.code.startsWith('auth/')) {
      return FIREBASE_ERROR_TYPES.AUTH;
    }
    if (error.code === 'permission-denied') {
      return FIREBASE_ERROR_TYPES.PERMISSION;
    }
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return FIREBASE_ERROR_TYPES.NETWORK;
    }
  }
  
  if (error.message) {
    if (error.message.includes('permission')) {
      return FIREBASE_ERROR_TYPES.PERMISSION;
    }
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return FIREBASE_ERROR_TYPES.NETWORK;
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return FIREBASE_ERROR_TYPES.VALIDATION;
    }
  }
  
  return FIREBASE_ERROR_TYPES.UNKNOWN;
};

/**
 * Log Firebase error with consistent formatting
 * @param {Error} error - Firebase error object
 * @param {string} context - Context where the error occurred
 * @param {Object} additionalData - Additional data to log
 */
export const logFirebaseError = (error, context, additionalData = {}) => {
  const errorType = getFirebaseErrorType(error);
  const userMessage = getFirebaseErrorMessage(error, context);
  
  const errorLog = {
    timestamp: new Date().toISOString(),
    type: errorType,
    context,
    code: error.code || 'unknown',
    message: error.message || 'No message',
    userMessage,
    stack: error.stack,
    ...additionalData
  };
  
  // Log based on environment
  if (process.env.REACT_APP_ENVIRONMENT === 'development') {
    console.group(`🔥 Firebase ${errorType} Error`);
    console.error('Context:', context);
    console.error('Error:', error);
    console.error('User Message:', userMessage);
    if (Object.keys(additionalData).length > 0) {
      console.error('Additional Data:', additionalData);
    }
    console.groupEnd();
  } else {
    // In production, use structured logging
    console.error('Firebase Error:', JSON.stringify(errorLog));
  }
  
  // TODO: Send to error reporting service (Sentry, etc.)
  // if (process.env.REACT_APP_SENTRY_DSN) {
  //   Sentry.captureException(error, {
  //     tags: { type: errorType, context },
  //     extra: additionalData
  //   });
  // }
};

/**
 * Handle Firebase error with consistent response
 * @param {Error} error - Firebase error object
 * @param {string} context - Context where the error occurred
 * @param {Object} options - Additional options
 * @returns {Object} Standardized error response
 */
export const handleFirebaseError = (error, context, options = {}) => {
  const {
    showToast = true,
    logError = true,
    additionalData = {},
    fallbackMessage = null
  } = options;
  
  if (logError) {
    logFirebaseError(error, context, additionalData);
  }
  
  const userMessage = fallbackMessage || getFirebaseErrorMessage(error, context);
  const errorType = getFirebaseErrorType(error);
  
  const errorResponse = {
    success: false,
    error: {
      type: errorType,
      code: error.code || 'unknown',
      message: userMessage,
      originalError: process.env.REACT_APP_ENVIRONMENT === 'development' ? error : undefined
    }
  };
  
  // Show toast notification if enabled
  if (showToast && typeof window !== 'undefined') {
    // TODO: Integrate with your toast notification system
    // toast.error(userMessage);
  }
  
  return errorResponse;
};

/**
 * Wrapper for Firebase operations with error handling
 * @param {Function} operation - Firebase operation to execute
 * @param {string} context - Context for error logging
 * @param {Object} options - Error handling options
 * @returns {Promise} Promise that resolves with standardized response
 */
export const withFirebaseErrorHandling = async (operation, context, options = {}) => {
  try {
    const result = await operation();
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return handleFirebaseError(error, context, options);
  }
};

/**
 * Check if error indicates offline state
 * @param {Error} error - Firebase error object
 * @returns {boolean} True if error indicates offline state
 */
export const isOfflineError = (error) => {
  if (!error) return false;
  
  const offlineIndicators = [
    'ERR_NAME_NOT_RESOLVED',
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NETWORK_IO_SUSPENDED',
    'Failed to get document because the client is offline',
    'Could not reach Cloud Firestore backend',
    'network-request-failed',
    'unavailable'
  ];
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return offlineIndicators.some(indicator => 
    errorMessage.includes(indicator.toLowerCase()) || 
    errorCode.includes(indicator.toLowerCase())
  );
};

/**
 * Retry Firebase operation with exponential backoff and offline detection
 * @param {Function} operation - Firebase operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {Object} options - Additional options
 * @returns {Promise} Promise that resolves with operation result
 */
export const retryFirebaseOperation = async (operation, maxRetries = 3, baseDelay = 1000, options = {}) => {
  const {
    skipOfflineErrors = false,
    onOfflineDetected = null,
    onRetryAttempt = null
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if this is an offline error
      if (isOfflineError(error)) {
        if (skipOfflineErrors) {
          console.warn('Offline error detected, skipping retry');
          if (onOfflineDetected) {
            onOfflineDetected(error);
          }
          throw error;
        }
        
        // For offline errors, use longer delays
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(3, attempt); // Longer delays for offline
          console.warn(`Offline error detected, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
          if (onRetryAttempt) {
            onRetryAttempt(attempt + 1, maxRetries + 1, error);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Don't retry on permission errors or validation errors
      if (error.code === 'permission-denied' || 
          error.code?.startsWith('auth/') ||
          error.message?.includes('validation')) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Firebase operation failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
        if (onRetryAttempt) {
          onRetryAttempt(attempt + 1, maxRetries + 1, error);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Create a network-aware Firebase operation that handles offline scenarios
 * @param {Function} operation - Firebase operation to wrap
 * @param {Object} options - Options for the operation
 * @returns {Function} Network-aware operation
 */
export const createNetworkAwareOperation = (operation, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    queueWhenOffline = true,
    onOfflineDetected = null,
    onRetryAttempt = null
  } = options;
  
  return async (...args) => {
    try {
      return await retryFirebaseOperation(
        () => operation(...args),
        maxRetries,
        baseDelay,
        {
          skipOfflineErrors: !queueWhenOffline,
          onOfflineDetected,
          onRetryAttempt
        }
      );
    } catch (error) {
      if (isOfflineError(error) && queueWhenOffline) {
        // If we're offline and should queue, we could integrate with the network monitor
        // For now, just throw with a specific offline error
        const offlineError = new Error('Operation queued for retry when network is restored');
        offlineError.isOffline = true;
        offlineError.originalError = error;
        throw offlineError;
      }
      throw error;
    }
  };
};

export default {
  FIREBASE_ERROR_TYPES,
  FIREBASE_ERROR_CODES,
  getFirebaseErrorMessage,
  getFirebaseErrorType,
  logFirebaseError,
  handleFirebaseError,
  withFirebaseErrorHandling,
  retryFirebaseOperation,
  isOfflineError,
  createNetworkAwareOperation
};
