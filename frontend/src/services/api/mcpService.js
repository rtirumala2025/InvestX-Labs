import { get, post, patch, handleApiError } from './apiClient';
import { getSession } from './auth';
import { logError, logInfo } from '../../utils/logger';

// API Base URL - should be set in environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Cache time constants (in milliseconds)
const CACHE_TTL = {
  SHORT: 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
};

// Maximum retry attempts for API calls
const MAX_RETRIES = 3;

// Base delay between retries (ms)
const RETRY_DELAY = 1000;

/**
 * Get MCP context for the current user with retry logic
 * @param {Object} options - Additional options
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {number} options.retries - Number of retry attempts (default: MAX_RETRIES)
 * @returns {Promise<Object>} MCP context data
 */
export const getMCPContext = async (options = {}) => {
  const { useCache = true, retries = MAX_RETRIES } = options;
  
  const attempt = async (attemptNumber = 1) => {
    try {
      logInfo('Fetching MCP context', { attempt: attemptNumber });
      
      const response = await get(
        `${API_BASE_URL}/mcp/context`,
        {
          // Include any additional context needed by the backend
          timestamp: new Date().toISOString(),
          sessionId: getSession()?.sessionId,
          userAgent: navigator?.userAgent
        },
        {
          useCache,
          cacheTtl: CACHE_TTL.MEDIUM,
          headers: {
            'Authorization': `Bearer ${getSession()?.accessToken || ''}`,
            'X-Request-ID': `mcp-context-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        }
      );
      
      logInfo('Successfully fetched MCP context');
      return response.data || {};
      
    } catch (error) {
      logError('Error getting MCP context:', error);
      
      // If we have retries left, wait and try again
      if (attemptNumber < retries) {
        const delay = RETRY_DELAY * Math.pow(2, attemptNumber - 1);
        logInfo(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attempt(attemptNumber + 1);
      }
      
      // If we're out of retries, handle the error
      handleApiError(error, 'Failed to fetch MCP context');
      
      // In development, return mock data if the API call fails
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Using mock MCP context due to error');
        return {
          riskProfile: 'moderate',
          investmentGoals: ['growth', 'income'],
          timeHorizon: 5, // years
          lastUpdated: new Date().toISOString(),
          disclaimer: 'This is mock data for development purposes only.'
        };
      }
      
      // In production, rethrow the error to be handled by the caller
      throw error;
    }
  };
  
  return attempt();
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
* Send user feedback on MCP recommendations with retry logic
* @param {string} recommendationId - ID of the recommendation
* @param {Object} feedback - Feedback data
* @param {string} feedback.rating - User rating (e.g., 'helpful', 'not_helpful')
* @param {string} [feedback.comment] - Optional comment
* @param {string} [feedback.userId] - Optional user ID (will use current session if not provided)
* @param {Object} options - Additional options
* @param {number} [options.retries=MAX_RETRIES] - Number of retry attempts
* @returns {Promise<Object>} Confirmation of feedback submission
*/
export const submitMCPFeedback = async (recommendationId, feedback, options = {}) => {
const { retries = MAX_RETRIES } = options;
const session = getSession();
  
if (!session && !feedback.userId) {
const error = new Error('User not authenticated and no userId provided in feedback');
logError('Authentication required for submitting MCP feedback', error);
throw error;
}
  
const attempt = async (attemptNumber = 1) => {
  
  return attempt();
};

/**
* Track MCP recommendation interaction
* @param {string} recommendationId - ID of the recommendation
* @param {string} interactionType - Type of interaction (e.g., 'view', 'click', 'dismiss')
* @param {Object} [metadata] - Additional metadata about the interaction
* @returns {Promise<Object>} - Confirmation of interaction tracking
*/
export const trackMCPInteraction = async (recommendationId, interactionType, metadata = {}) => {
  try {
    const session = getSession();
    
    // Don't fail the app if tracking fails
    const response = await post(
      `${API_BASE_URL}/mcp/interactions/track`,
      {
        recommendationId,
        interactionType,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator?.userAgent
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
    
    return response.data;
  } catch (error) {
    // Log the error but don't throw - we don't want to break the UI for tracking
    logError('Error tracking MCP interaction:', error);
    return { success: false, error: error.message };
  }
url: window.location.href,
userAgent: navigator?.userAgent
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
  
return response.data;
} catch (error) {
// Log the error but don't throw - we don't want to break the UI for tracking
logError('Error tracking MCP interaction:', error);
return { success: false, error: error.message };
}
};

// Export all functions
export default {
getMCPContext,
updateMCPContext,
getMCPRecommendations,
submitMCPFeedback,
trackMCPInteraction
};
