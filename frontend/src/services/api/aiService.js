import apiClient from './apiClient';
import { getSession } from './auth';
import { logError, logInfo } from '../../utils/logger';

const { get, post, handleApiError, withRetry } = apiClient;

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

// Maximum retry attempts for API calls
const MAX_RETRIES = 3;

// Base delay between retries (ms)
const RETRY_DELAY = 1000;

/**
 * Get AI investment recommendations with retry logic
 * @param {Object} userProfile - User profile data
 * @param {Object} options - Additional options
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {number} options.cacheTtl - Cache TTL in milliseconds (default: 5 minutes)
 * @param {number} options.retries - Number of retry attempts (default: MAX_RETRIES)
 * @returns {Promise<Object>} - AI recommendations
 */
/**
 * Get AI investment recommendations
 * @param {Object} userProfile - User profile data
 * @param {Object} [options] - Options
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @param {number} [options.cacheTtl=CACHE_TTL.MEDIUM] - Cache TTL in ms
 * @param {number} [options.retries=3] - Number of retry attempts
 * @returns {Promise<Object>} AI recommendations
 */
export const getAIRecommendations = async (userProfile, options = {}) => {
  const { 
    useCache = true, 
    cacheTtl = CACHE_TTL.MEDIUM,
    retries = 3
  } = options;
  
  const cacheKey = `ai:recs:${userProfile?.userId || 'anon'}`;
  
  // Return cached data if available and cache is enabled
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Returning cached AI recommendations');
      return cached;
    }
  }
  
  try {
    logInfo('Fetching AI recommendations from backend');
    
    const response = await withRetry(
      () => post(
        '/api/ai/recommendations',
        { 
          userProfile,
          context: {
            timestamp: new Date().toISOString(),
            riskTolerance: userProfile?.riskTolerance || 'moderate',
            investmentGoal: userProfile?.investmentGoal || 'growth',
            timeHorizon: userProfile?.timeHorizon || 5,
            userAgent: navigator?.userAgent,
            referrer: document?.referrer
          }
        },
        { 
          headers: {
            'Authorization': `Bearer ${getSession()?.accessToken || ''}`,
            'Content-Type': 'application/json',
            'X-Request-ID': `ai-rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        }
      ),
      { retries, delay: 1000 }
    );
    
    const data = response?.data || { recommendations: [] };
    
    // Cache the response if successful
    if (useCache) {
      setCachedData(cacheKey, data, cacheTtl);
    }
    
    logInfo('Successfully fetched AI recommendations');
    return data;
      
  } catch (error) {
    logError('Error in getAIRecommendations:', error);
    
    // If we're in development, return mock data as a fallback
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock AI recommendations due to error');
      return {
        recommendations: [
          {
            id: 'mock-1',
            symbol: 'AAPL',
            name: 'Apple Inc.',
            confidence: 0.85,
            reason: 'Strong financials and consistent growth',
            riskLevel: 'medium',
            lastUpdated: new Date().toISOString(),
            _mock: true
          },
          {
            id: 'mock-2',
            symbol: 'MSFT',
            name: 'Microsoft Corporation',
            confidence: 0.78,
            reason: 'Cloud computing leadership and steady growth',
            riskLevel: 'low',
            lastUpdated: new Date().toISOString(),
            _mock: true
          }
        ],
        timestamp: new Date().toISOString(),
        modelVersion: '1.0.0',
        _mock: true
      };
    }
    
    // In production, rethrow the error to be handled by the caller
    throw error;
  }
};

/**
 * Get explanation for a specific recommendation with retry logic
 * @param {string} recommendationId - ID of the recommendation
 * @param {string} userId - ID of the user
 * @param {Object} options - Additional options
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {number} options.retries - Number of retry attempts (default: MAX_RETRIES)
 * @returns {Promise<string>} - Explanation text
 */
export const getRecommendationExplanation = async (recommendationId, userId, options = {}) => {
  const { useCache = true, retries = MAX_RETRIES } = options;
  
  const attempt = async (attemptNumber = 1) => {
    try {
      logInfo(`Fetching explanation for recommendation ${recommendationId} (attempt ${attemptNumber})`);
      
      const response = await get(
        `/ai/recommendations/${encodeURIComponent(recommendationId)}/explanation`,
        { 
          userId,
          // Include any additional context needed by the backend
          context: {
            timestamp: new Date().toISOString(),
            sessionId: getSession()?.sessionId
          }
        },
        { 
          useCache,
          headers: {
            'Authorization': `Bearer ${getSession()?.accessToken || ''}`
          }
        }
      );
      
      logInfo(`Successfully fetched explanation for recommendation ${recommendationId}`);
      return response.data?.explanation || 'No explanation available.';
      
    } catch (error) {
      logError(`Error getting explanation for recommendation ${recommendationId}:`, error);
      
      // If we have retries left, wait and try again
      if (attemptNumber < retries) {
        const delay = RETRY_DELAY * Math.pow(2, attemptNumber - 1);
        logInfo(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attempt(attemptNumber + 1);
      }
      
      // If we're out of retries, handle the error
      handleApiError(error, 'Failed to fetch recommendation explanation');
      return 'Unable to load explanation at this time. Please try again later.';
    }
  };
  
  return attempt();
};

/**
 * Get market insights and analysis with retry logic
 * @param {Object} filters - Filters for market data
 * @param {string[]} filters.sectors - Sectors to include
 * @param {string} filters.timeframe - Timeframe for analysis (default: '1m')
 * @param {string} filters.region - Region filter (default: 'US')
 * @param {Object} options - Additional options
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {number} options.retries - Number of retry attempts (default: MAX_RETRIES)
 * @returns {Promise<Object>} - Market insights
 */
export const getMarketInsights = async (filters = {}, options = {}) => {
  const { useCache = true, retries = MAX_RETRIES } = options;
  const { 
    sectors = [], 
    timeframe = '1m',
    region = 'US',
    includeTechnical = true,
    includeFundamental = true,
    includeSentiment = true
  } = filters;
  
  const attempt = async (attemptNumber = 1) => {
    try {
      logInfo(`Fetching market insights (attempt ${attemptNumber})`);
      
      const response = await post(
        '/ai/market-insights',
        {
          sectors,
          timeframe,
          region,
          includeTechnical,
          includeFundamental,
          includeSentiment,
          timestamp: new Date().toISOString(),
          // Include any additional context needed by the backend
          context: {
            sessionId: getSession()?.sessionId,
            userId: getSession()?.user?.id
          }
        },
        { 
          useCache, 
          cacheTtl: CACHE_TTL.MEDIUM,
          headers: {
            'Authorization': `Bearer ${getSession()?.accessToken || ''}`,
            'X-Request-ID': `insights-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        }
      );
      
      logInfo('Successfully fetched market insights');
      return response.data || {};
      
    } catch (error) {
      logError('Error getting market insights:', error);
      
      // If we have retries left, wait and try again
      if (attemptNumber < retries) {
        const delay = RETRY_DELAY * Math.pow(2, attemptNumber - 1);
        logInfo(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attempt(attemptNumber + 1);
      }
      
      // If we're out of retries, handle the error
      handleApiError(error, 'Failed to fetch market insights');
      
      // In development, return mock data if the API call fails
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Using mock market insights due to error');
        return {
          summary: 'Market is currently experiencing volatility.',
          keyTrends: [
            'Tech sector shows strong growth potential.',
            'Energy sector facing headwinds.',
            'Consumer goods remain stable.'
          ],
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
 * Submit feedback on AI recommendations with retry logic
 * @param {string} recommendationId - ID of the recommendation
 * @param {Object} feedback - Feedback data
 * @param {string} feedback.rating - User rating (e.g., 'helpful', 'not_helpful')
 * @param {string} [feedback.comment] - Optional comment
 * @param {string} [feedback.userId] - Optional user ID (will use current session if not provided)
 * @param {Object} options - Additional options
 * @param {number} options.retries - Number of retry attempts (default: MAX_RETRIES)
 * @returns {Promise<Object>} - Confirmation of feedback submission
 */
export const submitFeedback = async (recommendationId, feedback, options = {}) => {
  const { retries = MAX_RETRIES } = options;
  
  const attempt = async (attemptNumber = 1) => {
    try {
      logInfo(`Submitting feedback for recommendation ${recommendationId} (attempt ${attemptNumber})`);
      
      const session = getSession();
      if (!session && !feedback.userId) {
        throw new Error('User not authenticated and no userId provided in feedback');
      }
      
      const response = await post(
        `/ai/recommendations/${encodeURIComponent(recommendationId)}/feedback`,
        {
          ...feedback,
          // Use provided userId or fall back to session user
          userId: feedback.userId || session?.user?.id,
          timestamp: new Date().toISOString(),
          // Include any additional context needed by the backend
          metadata: {
            ...(feedback.metadata || {}),
            userAgent: navigator?.userAgent,
            url: window.location.href
          },
          context: {
            sessionId: session?.sessionId,
            userAgent: navigator?.userAgent,
            referrer: document?.referrer
          }
        },
        { 
          useCache: false, // Never cache feedback submissions
          headers: {
            'Authorization': `Bearer ${session?.accessToken || ''}`,
            'Content-Type': 'application/json',
            'X-Request-ID': `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        }
      );
      
      logInfo(`Successfully submitted feedback for recommendation ${recommendationId}`);
      return response.data;
      
    } catch (error) {
      logError(`Error submitting feedback for recommendation ${recommendationId}:`, error);
      
      // If we have retries left, wait and try again
      if (attemptNumber < retries) {
        const delay = RETRY_DELAY * Math.pow(2, attemptNumber - 1);
        logInfo(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attempt(attemptNumber + 1);
      }
      
      // If we're out of retries, handle the error
      handleApiError(error, 'Failed to submit feedback');
      
      // In development, log the error but don't fail the UI
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to submit feedback, but continuing in development mode');
        return { success: false, message: 'Feedback submission failed but continuing in development' };
      }
      
      // In production, rethrow the error to be handled by the caller
      throw error;
    }
  };
  
  return attempt();
};

/**
 * Track AI recommendation interaction
 * @param {string} recommendationId - ID of the recommendation
 * @param {string} interactionType - Type of interaction (e.g., 'view', 'click', 'dismiss')
 * @param {Object} [metadata] - Additional metadata about the interaction
 * @returns {Promise<Object>} - Confirmation of interaction tracking
 */
export const trackRecommendationInteraction = async (recommendationId, interactionType, metadata = {}) => {
  try {
    const session = getSession();
    
    // Don't fail the app if tracking fails
    const response = await post(
      '/ai/interactions/track',
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
    logError('Error tracking recommendation interaction:', error);
    return { success: false, error: error.message };
  }
};

// Functions are already exported as named exports above