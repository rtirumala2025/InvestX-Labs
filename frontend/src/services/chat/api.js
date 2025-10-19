import axios from 'axios';

// Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/chat';
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Development logging
if (import.meta.env.MODE === 'development') {
  console.log('🔧 Chat API Configuration:', {
    API_URL,
    NODE_ENV: import.meta.env.MODE,
    timeout: `${REQUEST_TIMEOUT}ms`,
    maxRetries: MAX_RETRIES
  });
}

// Create axios instance with timeout
const api = axios.create({
  baseURL: '', // Using full URL in requests
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper function to delay execution
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const chatAPI = {
  sendMessage: async (message, userId = 'anonymous', sessionId = 'default-session') => {
    const requestData = { message, userId, sessionId };
    let lastError;
    
    if (import.meta.env.MODE === 'development') {
      console.log('[Chat API] Sending message:', {
        ...requestData,
        timestamp: new Date().toISOString()
      });
    }
    
    // Retry logic
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await api.post(API_URL, requestData);
        
        if (import.meta.env.MODE === 'development') {
          console.log(`[Chat API] Response (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, {
            status: response.status,
            model: response.data?.model,
            timestamp: new Date().toISOString()
          });
        }
        
        return response.data;
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 408 (Request Timeout)
        if (error.response?.status >= 400 && error.response?.status < 500 && 
            error.response?.status !== 408) {
          break;
        }
        
        // Add delay before retry (except after last attempt)
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY * (attempt + 1)); // Exponential backoff
        }
      }
    }
    
    // All retries failed, throw the last error
    const errorDetails = {
      time: new Date().toISOString(),
      message: lastError.message,
      status: lastError.response?.status,
      isTimeout: lastError.code === 'ECONNABORTED'
    };
    
    console.error('[Chat API] Request failed after retries:', errorDetails);
    
    throw new Error(
      lastError.response?.status === 401
        ? 'Authentication error. Please check your connection.'
        : lastError.isTimeout || lastError.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : 'Unable to connect to the chat service. Please try again later.'
    );
  },
};
