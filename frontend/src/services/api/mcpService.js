import apiClient from './apiClient';
import { getSession } from './auth';
import { logError, logInfo } from '../../utils/logger';

const { get, post, put, del, patch, handleApiError, withRetry } = apiClient;

// Cache configuration
const CACHE_TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
};

// Cache storage
const cache = new Map();

/**
 * Get cached data if available and not expired
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if not found/expired
 */
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const { data, timestamp, ttl } = cached;
  if (Date.now() - timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  
  return data;
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} [ttl=CACHE_TTL.MEDIUM] - Time to live in ms
 */
const setCachedData = (key, data, ttl = CACHE_TTL.MEDIUM) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

/**
 * Invalidate cache entries matching a key pattern
 * @param {string} pattern - Cache key pattern (supports startsWith)
 */
const invalidateCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
};

// API Base URL - should be set in environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Maximum retry attempts for API calls
const MAX_RETRIES = 3;

// Base delay between retries (ms)
const RETRY_DELAY = 1000;

/**
 * Get MCP context for a user
 * @param {string} userId - User ID
 * @param {Object} [options] - Options
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @param {number} [options.cacheTtl=CACHE_TTL.MEDIUM] - Cache TTL in ms
 * @param {number} [options.retries=2] - Number of retry attempts
 * @returns {Promise<Object>} MCP context data
 */
export const getMCPContext = async (userId, options = {}) => {
  const { 
    useCache = true, 
    cacheTtl = CACHE_TTL.MEDIUM,
    retries = 2
  } = options;
  
  const cacheKey = `mcp:context:${userId}`;
  
  // Return cached data if available and cache is enabled
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Returning cached MCP context');
      return cached;
    }
  }
  
  try {
    logInfo(`Fetching MCP context for user ${userId}`);
    
    const response = await withRetry(
      () => get(
        `${API_BASE_URL}/mcp/context/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${getSession()?.accessToken || ''}`,
            'X-Request-ID': `mcp-ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        }
      ),
      { retries, delay: 1000 }
    );
    
    const data = response?.data || {};
    
    // Cache the response if successful
    if (useCache) {
      setCachedData(cacheKey, data, cacheTtl);
    }
    
    logInfo('Successfully fetched MCP context');
    return data;
  } catch (error) {
    logError('Error fetching MCP context:', error);
    
    // In development, return mock data if the API call fails
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock MCP context due to error');
      return {
        userId,
        riskProfile: 'moderate',
        investmentGoals: ['growth', 'income'],
        riskTolerance: 5,
        timeHorizon: 5,
        preferredAssetClasses: ['stocks', 'etfs'],
        lastUpdated: new Date().toISOString(),
        _mock: true
      };
    }
    
    throw error;
  }
};

/**
 * Update MCP context for the current user with retry logic
 * @param {Object} contextUpdate - Updates to the MCP context
 * @param {Object} options - Additional options
 * @param {number} options.retries - Number of retry attempts (default: MAX_RETRIES)
 * @returns {Promise<Object>} Updated MCP context
 */
export const updateMCPContext = async (contextUpdate, options = {}) => {
  const { retries = MAX_RETRIES } = options;
  const session = getSession();
  
  if (!session) {
    const error = new Error('User not authenticated');
    logError('Authentication required for updating MCP context', error);
    throw error;
  }
  
  const attempt = async (attemptNumber = 1) => {
    try {
      logInfo('Updating MCP context', { attempt: attemptNumber });
      
      const response = await patch(
        `${API_BASE_URL}/mcp/context`,
        {
          ...contextUpdate,
          // Include additional metadata
          metadata: {
            ...(contextUpdate.metadata || {}),
            updatedAt: new Date().toISOString(),
            updatedBy: session.user.id,
            userAgent: navigator?.userAgent,
            ipAddress: '0.0.0.0' // This would be set by the server in production
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
            'X-Request-ID': `mcp-update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        }
      );
      
      logInfo('Successfully updated MCP context');
      return response.data || {};
      
    } catch (error) {
      logError('Error updating MCP context:', error);
      
      // If we have retries left, wait and try again
      if (attemptNumber < retries) {
        const delay = RETRY_DELAY * Math.pow(2, attemptNumber - 1);
        logInfo(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attempt(attemptNumber + 1);
      }
      
      // If we're out of retries, handle the error
      handleApiError(error, 'Failed to update MCP context');
      
      // In development, log the error but don't fail the UI
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to update MCP context, but continuing in development mode');
        return {
          ...contextUpdate,
          lastUpdated: new Date().toISOString(),
          _localUpdate: true
        };
      }
      
      // In production, rethrow the error to be handled by the caller
      throw error;
    }
  };
  
  return attempt();
};

/**
 * Get MCP recommendations based on current context with retry logic
 * @param {Object} options - Options for recommendations
 * @param {string} [options.type] - Type of recommendations to get
 * @param {string} [options.contextId] - Optional context ID to get recommendations for
 * @param {number} [options.limit=10] - Maximum number of recommendations to return
 * @param {Object} fetchOptions - Additional fetch options
 * @param {boolean} [fetchOptions.useCache=true] - Whether to use cache (default: true)
 * @param {number} [fetchOptions.retries=MAX_RETRIES] - Number of retry attempts
 * @returns {Promise<Array>} List of MCP recommendations
 */
export const getMCPRecommendations = async (options = {}, fetchOptions = {}) => {
  const { type, contextId, limit = 10 } = options;
  const { useCache = true, retries = MAX_RETRIES } = fetchOptions;
  const session = getSession();
  
  const attempt = async (attemptNumber = 1) => {
    try {
      logInfo('Fetching MCP recommendations', { 
        attempt: attemptNumber,
        type,
        contextId
      });
      
      const response = await get(
        `${API_BASE_URL}/mcp/recommendations`,
        {
          type,
          contextId,
          limit,
          // Include additional context
          timestamp: new Date().toISOString(),
          sessionId: session?.sessionId,
          userId: session?.user?.id,
          userAgent: navigator?.userAgent
        },
        {
          useCache,
          cacheTtl: type === 'personalized' ? CACHE_TTL.SHORT : CACHE_TTL.MEDIUM,
          headers: {
            'Authorization': `Bearer ${session?.accessToken || ''}`,
            'X-Request-ID': `mcp-recs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        }
      );
      
      logInfo(`Successfully fetched ${response.data?.length || 0} MCP recommendations`);
      return response.data || [];
      
    } catch (error) {
      logError('Error getting MCP recommendations:', error);
      
      // If we have retries left, wait and try again
      if (attemptNumber < retries) {
        const delay = RETRY_DELAY * Math.pow(2, attemptNumber - 1);
        logInfo(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attempt(attemptNumber + 1);
      }
      
      // If we're out of retries, handle the error
      handleApiError(error, 'Failed to fetch MCP recommendations');
      
      // In development, return mock data if the API call fails
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Using mock MCP recommendations due to error');
        return [
          {
            id: 'rec-1',
            type: type || 'general',
            title: 'Diversify your portfolio',
            description: 'Consider adding more assets from different sectors to reduce risk.',
            priority: 'high',
            confidence: 0.85,
            actions: [
              { id: 'act-1', label: 'View portfolio', type: 'navigate', target: '/portfolio' },
              { id: 'act-2', label: 'Dismiss', type: 'dismiss' }
            ],
            timestamp: new Date().toISOString(),
            _mock: true
          }
        ];
      }
      
      // In production, rethrow the error to be handled by the caller
      throw error;
    }
  };
  
  return attempt();
};

/**
 * Submit feedback for MCP content
 * @param {Object} feedback - Feedback data
 * @param {string} feedback.userId - User ID
 * @param {string} feedback.contentId - ID of the content
 * @param {number} feedback.rating - Rating (1-5)
 * @param {string} [feedback.comment] - Optional comment
 * @param {Object} [feedback.metadata] - Additional metadata
 * @returns {Promise<Object>} Submission response
 */
/**
 * Submit feedback for MCP content
 * @param {Object} feedback - Feedback data
 * @param {string} feedback.userId - User ID
 * @param {string} feedback.contentId - ID of the content
 * @param {number} feedback.rating - Rating (1-5)
 * @param {string} [feedback.comment] - Optional comment
 * @param {Object} [feedback.metadata] - Additional metadata
 * @returns {Promise<Object>} Submission response
 */
export const submitFeedback = async (feedback) => {
  const { userId, contentId, rating, comment = '', metadata = {} } = feedback;
  const session = getSession();
  
  try {
    logInfo(`Submitting feedback for content ${contentId}`);
    
    const response = await post(
      '/api/mcp/feedback',
      {
        userId: session?.user?.id || userId,
        contentId,
        rating,
        comment,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
        },
        sessionId: session?.sessionId
      },
      {
        useCache: false,
        headers: {
          'Authorization': `Bearer ${session?.accessToken || ''}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response?.data || { success: true };
  } catch (error) {
    // Log the error but don't throw - we don't want to break the UI for tracking
    logError('Error submitting MCP feedback:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to submit feedback' 
    };
  }
};

/**
 * Track user interaction with MCP content
 * @param {Object} interaction - Interaction data
 * @param {string} interaction.type - Type of interaction (e.g., 'view', 'click', 'dismiss')
 * @param {string} interaction.contentId - ID of the content
 * @param {Object} [interaction.metadata] - Additional metadata
 * @returns {Promise<Object>} Tracking response
 */
export const trackMCPInteraction = async (interaction) => {
  const { type, contentId, metadata = {} } = interaction;
  const session = getSession();
  
  try {
    logInfo(`Tracking MCP interaction: ${type} for content ${contentId}`);
    
    const response = await post(
      '/api/mcp/interactions',
      {
        type,
        contentId,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
        },
        userId: session?.user?.id,
        sessionId: session?.sessionId
      },
      {
        useCache: false,
        headers: {
          'Authorization': `Bearer ${session?.accessToken || ''}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response?.data || { success: true };
  } catch (error) {
    logError('Error tracking MCP interaction:', error);
    return { success: false, error: error.message };
  }
};

// Export all functions
export default {
  getMCPContext,
  updateMCPContext,
  getMCPRecommendations,
  submitFeedback,
  trackMCPInteraction
};
