import { supabase } from '../supabase/config';
import { logError, logInfo } from '../../utils/logger';

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

// Maximum retry attempts for API calls
const MAX_RETRIES = 3;

/**
 * Handle API errors consistently
 * @param {Error} error - The error object
 * @param {string} context - Context of the error
 * @throws {Error} Enhanced error with context
 */
const handleApiError = (error, context = 'MCP Service') => {
  const errorMessage = error.message || 'Unknown error';
  const errorDetails = error.details || error.toString();
  const fullMessage = `[${context}] ${errorMessage}: ${errorDetails}`;
  
  logError(fullMessage, { error, context });
  throw new Error(fullMessage);
};

/**
 * Get the current user session
 * @returns {Promise<Object>} The current session
 */
const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    handleApiError(error, 'Failed to get session');
  }
};

/**
 * Get MCP context for a user
 * @param {string} userId - User ID (defaults to 'anonymous' if not provided)
 * @param {Object} [options] - Options
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @param {number} [options.cacheTtl=CACHE_TTL.MEDIUM] - Cache TTL in ms
 * @param {number} [options.retries=MAX_RETRIES] - Number of retry attempts
 * @returns {Promise<Object>} MCP context data
 */
const getMCPContext = async (userId = 'anonymous', options = {}) => {
  const {
    useCache = true,
    cacheTtl = CACHE_TTL.MEDIUM
  } = options;

  const cacheKey = `mcp:context:${userId}`;
  
  // Return cached data if available and cache is enabled
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Returning cached MCP context', { userId });
      return { ...cached, _cached: true };
    }
  }

  try {
    logInfo('Fetching MCP context', { userId });
    
    // Use Supabase RPC to get user context
    const { data, error } = await supabase
      .rpc('get_user_context', { user_id: userId })
      .single();

    if (error) throw error;

    const context = {
      ...data,
      userId,
      _cached: false,
      _timestamp: new Date().toISOString()
    };

    // Cache the successful response
    if (useCache) {
      setCachedData(cacheKey, context, cacheTtl);
    }

    return context;
  } catch (error) {
    logError('Error fetching MCP context', { error, userId });
    
    // Return a default context if the request fails
    const defaultContext = {
      userId,
      preferences: {
        theme: 'light',
        notifications: true,
        defaultView: 'dashboard'
      },
      lastActive: new Date().toISOString(),
      features: {},
      _cached: false,
      _error: error.message,
      _fallback: true
    };

    // Cache the fallback to prevent repeated failed requests
    if (useCache) {
      setCachedData(cacheKey, defaultContext, CACHE_TTL.SHORT);
    }
    
    // In development, return mock data if the API call fails
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock MCP context due to error');
      return {
        ...defaultContext,
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
const updateMCPContext = async (contextUpdate, options = {}) => {
  const { retries = MAX_RETRIES } = options;
  
  let attempts = 0;
  let lastError;

  while (attempts < retries) {
    try {
      attempts++;
      
      const session = await getSession();
      const userId = session?.user?.id || 'anonymous';

      // Prepare the context update with metadata
      const updateWithMetadata = {
        ...contextUpdate,
        _metadata: {
          ...(contextUpdate._metadata || {}),
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
          userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server',
          attempt: attempts
        }
      };

      // Call the Supabase RPC function
      const { data, error } = await supabase
        .rpc('update_user_context', { 
          user_id: userId,
          context_updates: updateWithMetadata
        })
        .single();

      if (error) throw error;

      // Invalidate any cached context
      invalidateCache(`mcp-context-${userId}`);
      
      logInfo('Successfully updated MCP context', { userId });
      return data || updateWithMetadata;
      
    } catch (error) {
      lastError = error;
      logError(`Attempt ${attempts} failed for updateMCPContext`, { 
        error, 
        attempt: attempts,
        totalRetries: retries
      });
      
      // Exponential backoff
      if (attempts < retries) {
        const delay = 1000 * Math.pow(2, attempts);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all retries failed
  const errorMessage = lastError?.message || 'Failed to update MCP context';
  logError('All retries failed for updateMCPContext', { 
    error: lastError,
    attempts 
  });

  // In development, return the local update with a flag
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Using local MCP context update due to error');
    return {
      ...contextUpdate,
      lastUpdated: new Date().toISOString(),
      _localUpdate: true,
      _error: errorMessage
    };
  }
  
  throw lastError || new Error(errorMessage);
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
const getMCPRecommendations = async (options = {}, fetchOptions = {}) => {
  const { type, contextId, limit = 10 } = options;
  const { useCache = true, retries = MAX_RETRIES } = fetchOptions;
  
  const cacheKey = `mcp-recommendations-${type || 'all'}-${contextId || 'global'}-${limit}`;
  
  // Try to get from cache first
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }
  
  let attempts = 0;
  let lastError;

  while (attempts < retries) {
    try {
      attempts++;
      
      const session = await getSession();
      const userId = session?.user?.id || 'anonymous';
      
      // Call the Supabase RPC function
      const { data, error } = await supabase
        .rpc('get_recommendations', {
          user_id: userId,
          recommendation_type: type || null,
          context_id: contextId || null,
          max_results: limit
        });

      if (error) throw error;

      // Cache the successful response
      if (useCache) {
        setCachedData(cacheKey, data, CACHE_TTL.MEDIUM);
      }
      
      return data || [];
    } catch (error) {
      lastError = error;
      logError(`Attempt ${attempts} failed for getMCPRecommendations`, { 
        error, 
        options,
        contextId,
        attempt: attempts,
        totalRetries: retries
      });
      
      if (attempts < retries) {
        const delay = 1000 * Math.pow(2, attempts);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Return mock data in development if all retries fail
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Using mock MCP recommendations due to error');
    return [
      { 
        id: 'rec1', 
        type: type || 'default', 
        score: 0.9, 
        content: 'Sample recommendation 1',
        _mock: true
      },
      { 
        id: 'rec2', 
        type: type || 'default', 
        score: 0.85, 
        content: 'Sample recommendation 2',
        _mock: true
      },
    ].slice(0, limit);
  }
  
  throw lastError || new Error('Failed to get MCP recommendations');
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
const submitFeedback = async (feedback) => {
  const { userId, contentId, rating, comment = '', metadata = {} } = feedback;
  
  try {
    const session = await getSession();
    const currentUserId = session?.user?.id || userId || 'anonymous';
    
    logInfo(`Submitting feedback for content ${contentId}`, { userId: currentUserId });
    
    // Prepare feedback data
    const feedbackData = {
      user_id: currentUserId,
      content_id: contentId,
      rating,
      comment,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        session_id: session?.id
      }
    };
    
    // Call the Supabase RPC function
    const { data, error } = await supabase
      .rpc('submit_feedback', feedbackData)
      .single();
      
    if (error) throw error;
    
    // Invalidate any cached recommendations that might be affected
    invalidateCache('mcp-recommendations-');
    
    return { 
      success: true, 
      data: data || { id: `local-${Date.now()}` },
      _cached: false
    };
    
  } catch (error) {
    // Log the error but don't throw - we don't want to break the UI for tracking
    logError('Error submitting MCP feedback:', error);
    
    // In development, return a success response with a mock ID
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock feedback submission due to error:', error.message);
      return { 
        success: true, 
        data: { id: `mock-${Date.now()}` },
        _mock: true
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to submit feedback',
      _error: true
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
const trackMCPInteraction = async (interaction) => {
  const { type, contentId, metadata = {} } = interaction;
  
  try {
    const session = await getSession();
    const userId = session?.user?.id || 'anonymous';
    
    logInfo(`Tracking MCP interaction: ${type} for content ${contentId}`, { userId });
    
    // Prepare interaction data
    const interactionData = {
      user_id: userId,
      interaction_type: type,
      content_id: contentId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        session_id: session?.id,
        screen_width: typeof window !== 'undefined' ? window.innerWidth : 0,
        screen_height: typeof window !== 'undefined' ? window.innerHeight : 0
      }
    };
    
    // Call the Supabase RPC function
    const { error } = await supabase
      .rpc('track_interaction', interactionData);
      
    if (error) throw error;
    
    return { 
      success: true,
      _cached: false
    };
    
  } catch (error) {
    // Don't fail the interaction if tracking fails
    logError('Error tracking MCP interaction:', error);
    
    // In development, return a success response
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock interaction tracking due to error:', error.message);
      return { 
        success: true,
        _mock: true
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to track interaction',
      _error: true
    };
  }
};

// Export all functions
/**
 * Test connection to the MCP service
 * @returns {Promise<Object>} Service status
 */
const testConnection = async () => {
  try {
    // Test Supabase connection by fetching the current session
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) throw sessionError;
    
    // Test RPC function
    const { data, error: rpcError } = await supabase
      .rpc('get_ai_health')
      .single();
      
    if (rpcError) throw rpcError;
    
    return { 
      success: true, 
      data: {
        ...data,
        supabase_connected: !!session.session
      } 
    };
  } catch (error) {
    logError('MCP Service connection test failed', error);
    
    // In development, return a mock success response
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock MCP connection test due to error:', error.message);
      return { 
        success: true, 
        data: { 
          status: 'ok', 
          version: '1.0.0',
          supabase_connected: true,
          _mock: true
        } 
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to connect to MCP service',
      _error: true
    };
  }
};

// Export all functions as named exports
export {
  getMCPContext,
  updateMCPContext,
  getMCPRecommendations,
  submitFeedback as submitMCPFeedback,
  trackMCPInteraction,
  testConnection
};

// For backward compatibility, also provide a default export with the same functions
export default {
  getMCPContext,
  updateMCPContext,
  getMCPRecommendations,
  submitFeedback,
  trackMCPInteraction,
  testConnection
};
