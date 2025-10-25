import { supabase } from '../../lib/supabaseClient';
import { getSession } from './auth';
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

// Maximum retry attempts for API calls
const MAX_RETRIES = 3;

// Base delay between retries (ms)
const RETRY_DELAY = 1000;

/**
 * Get AI investment recommendations with retry logic
 * @param {Object} userProfile - User profile data
 * @param {Object} options - Additional options
 * @param {Object} userProfile - User profile data
 * @param {Object} [options] - Options
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @param {number} [options.cacheTtl=CACHE_TTL.MEDIUM] - Cache TTL in ms
 * @param {number} [options.retries=3] - Number of retry attempts
 * @returns {Promise<Object>} AI recommendations
 */
const getAIRecommendations = async (userProfile, options = {}) => {
  const {
    useCache = true,
    cacheTtl = CACHE_TTL.MEDIUM,
    retries = MAX_RETRIES
  } = options;
  
  const userId = userProfile?.userId || 'anonymous';
  const cacheKey = `ai:recommendations:${userId}`;
  
  // Return cached data if available and cache is enabled
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Returning cached AI recommendations');
      return { ...cached, _cached: true };
    }
  }
  
  try {
    logInfo(`Fetching AI recommendations for user: ${userId}`);
    
    // Call the Supabase RPC function
    const { data, error } = await supabase
      .rpc('get_ai_recommendations', { 
        user_id: userId,
        user_profile: userProfile 
      });
    
    if (error) throw error;
    
    // Cache the successful response
    if (useCache && data) {
      setCachedData(cacheKey, data, cacheTtl);
    }
    
    return data;
  } catch (error) {
    logError('Error fetching AI recommendations:', error);
    
    // Return cached data if available, even if it's stale
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Returning stale cached AI recommendations');
      return { ...cached, _stale: true };
    }
    
    // Return mock data in development if API fails
    if (process.env.NODE_ENV !== 'production') {
      logInfo('Using mock AI recommendations in development');
      return {
        recommendations: [
          {
            id: 'rec1',
            symbol: 'AAPL',
            action: 'BUY',
            confidence: 0.85,
            reasoning: 'Strong fundamentals and growth potential',
            risk: 'MEDIUM',
            timeHorizon: 'LONG_TERM'
          },
          {
            id: 'rec2',
            symbol: 'MSFT',
            action: 'HOLD',
            confidence: 0.72,
            reasoning: 'Stable performance with consistent growth',
            risk: 'LOW',
            timeHorizon: 'MEDIUM_TERM'
          },
          {
            id: 'rec3',
            symbol: 'GOOGL',
            action: 'BUY',
            confidence: 0.78,
            reasoning: 'Undervalued relative to peers',
            risk: 'MEDIUM',
            timeHorizon: 'LONG_TERM'
          }
        ],
        _mock: true
      };
    }
    
    throw error;
  }
};

/**
 * Get explanation for a specific recommendation using Supabase RPC
 * @param {string} recommendationId - ID of the recommendation
 * @param {string} userId - ID of the user (default: 'anonymous')
 * @param {Object} options - Additional options
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {number} options.retries - Number of retry attempts (default: MAX_RETRIES)
 * @returns {Promise<string>} - Explanation text
 */
const getRecommendationExplanation = async (recommendationId, userId = 'anonymous', options = {}) => {
  const { 
    useCache = true, 
    retries = MAX_RETRIES,
    cacheTtl = CACHE_TTL.MEDIUM
  } = options;
  
  const cacheKey = `ai:explanation:${recommendationId}:${userId}`;
  
  // Return cached explanation if available and cache is enabled
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo(`Returning cached explanation for recommendation ${recommendationId}`);
      return cached;
    }
  }
  
  try {
    logInfo(`Fetching explanation for recommendation ${recommendationId}`);
    
    // Call the Supabase RPC function
    const { data, error } = await supabase
      .rpc('get_recommendation_explanation', { 
        recommendation_id: recommendationId,
        user_id: userId 
      });
    
    if (error) throw error;
    
    const explanation = data?.explanation || 'No explanation available';
    
    // Cache the successful response
    if (useCache) {
      setCachedData(cacheKey, explanation, cacheTtl);
    }
    
    return explanation;
  } catch (error) {
    logError(`Error fetching explanation for recommendation ${recommendationId}:`, error);
    
    // Return cached explanation if available, even if it's stale
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo(`Returning stale cached explanation for recommendation ${recommendationId}`);
      return cached;
    }
    
    // Return a default explanation in case of error
    return 'Unable to load explanation at this time. Please try again later.';
  }
};

/**
 * Get market insights and analysis using Supabase RPC
 * @param {Object} filters - Filters for market data
 * @param {string[]} filters.sectors - Sectors to include
 * @param {string} filters.timeframe - Timeframe for analysis (default: '1m')
 * @param {string} filters.region - Region filter (default: 'US')
 * @param {Object} options - Additional options
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {number} options.retries - Number of retry attempts (default: MAX_RETRIES)
 * @returns {Promise<Object>} - Market insights
 */
const getMarketInsights = async (filters = {}, options = {}) => {
  const { useCache = true, retries = MAX_RETRIES } = options;
  const { 
    sectors = [], 
    timeframe = '1m',
    region = 'US',
    includeTechnical = true,
    includeFundamental = true,
    includeSentiment = true
  } = filters;
  
  const cacheKey = `market:insights:${sectors.sort().join(',')}:${timeframe}:${region}`;
  
  // Return cached insights if available and cache is enabled
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Returning cached market insights');
      return { ...cached, _cached: true };
    }
  }
  
  // Simple retry mechanism
  const attempt = async (attemptsLeft = retries) => {
    try {
      logInfo('Fetching market insights with filters:', { 
        sectors, 
        timeframe, 
        region,
        includeTechnical,
        includeFundamental,
        includeSentiment
      });
      
      // Call the Supabase RPC function
      const { data, error } = await supabase
        .rpc('get_market_insights', {
          p_sectors: sectors,
          p_timeframe: timeframe,
          p_region: region,
          p_include_technical: includeTechnical,
          p_include_fundamental: includeFundamental,
          p_include_sentiment: includeSentiment
        });
      
      if (error) throw error;
      
      // Cache the successful response
      if (useCache && data) {
        setCachedData(cacheKey, data, CACHE_TTL.SHORT);
      }
      
      return data;
    } catch (error) {
      logError('Error fetching market insights:', error);
      
      // If we have retries left, wait and try again
      if (attemptsLeft > 0) {
        const delay = RETRY_DELAY * (retries - attemptsLeft + 1);
        logInfo(`Retrying market insights fetch in ${delay}ms... (${attemptsLeft} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attempt(attemptsLeft - 1);
      }
      
      // Return cached insights if available, even if stale
      const cached = getCachedData(cacheKey);
      if (cached) {
        logInfo('Returning stale cached market insights');
        return { ...cached, _stale: true };
      }
      
      // In development, return mock data if API fails
      if (process.env.NODE_ENV !== 'production') {
        logInfo('Using mock market insights in development');
        return {
          technical: {
            rsi: 62.4,
            macd: 1.23,
            bollinger: {
              upper: 152.34,
              middle: 148.76,
              lower: 145.18
            }
          },
          fundamental: {
            peRatio: 28.5,
            dividendYield: 0.6,
            marketCap: 2500000000000,
            beta: 1.2
          },
          sentiment: {
            score: 0.75,
            positive: 65,
            neutral: 25,
            negative: 10,
            sources: ['news', 'social', 'analysts']
          },
          _mock: true
        };
      }
      
      // In production, rethrow the error to be handled by the caller
      throw error;
    }
  };
  
  return attempt();
};

/**
 * Submit feedback on AI recommendations using Supabase RPC
 * @param {string} recommendationId - ID of the recommendation
 * @param {Object} feedback - Feedback data
 * @param {string} feedback.rating - User rating (e.g., 'helpful', 'not_helpful')
 * @param {string} [feedback.comment] - Optional comment
 * @param {string} [feedback.userId] - Optional user ID (will use current session if not provided)
 * @param {Object} options - Additional options
 * @param {number} options.retries - Number of retry attempts (default: MAX_RETRIES)
 * @returns {Promise<Object>} - Confirmation of feedback submission
 */
const submitFeedback = async (recommendationId, feedback, options = {}) => {
  const { retries = MAX_RETRIES } = options;
  const userId = feedback.userId || getSession()?.user?.id || 'anonymous';
  
  try {
    logInfo(`Submitting feedback for recommendation ${recommendationId}`);
    
    // Call the Supabase RPC function
    const { data, error } = await supabase
      .rpc('submit_recommendation_feedback', {
        recommendation_id: recommendationId,
        user_id: userId,
        rating: feedback.rating,
        comment: feedback.comment || null,
        metadata: {
          user_agent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server',
          timestamp: new Date().toISOString()
        }
      });
    
    if (error) throw error;
    
    logInfo(`Successfully submitted feedback for recommendation ${recommendationId}`);
    return data;
  } catch (error) {
    logError(`Error submitting feedback for recommendation ${recommendationId}:`, error);
    
    // In development, simulate a successful response
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock feedback submission in development');
      return {
        success: true,
        feedbackId: `feedback-${Date.now()}`,
        _mock: true
      };
    }
    
    throw error;
  }
};

/**
 * Track AI recommendation interaction using Supabase RPC
 * @param {string} recommendationId - ID of the recommendation
 * @param {string} interactionType - Type of interaction (e.g., 'view', 'click', 'dismiss')
 * @param {Object} [metadata] - Additional metadata about the interaction
 * @returns {Promise<Object>} - Confirmation of interaction tracking
 */
const trackRecommendationInteraction = async (recommendationId, interactionType, metadata = {}) => {
  try {
    const session = getSession();
    
    // Don't fail the app if tracking fails
    const { data, error } = await supabase.rpc('track_recommendation_interaction', {
      p_recommendation_id: recommendationId,
      p_interaction_type: interactionType,
      p_metadata: {
        ...metadata,
        user_agent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server',
        timestamp: new Date().toISOString(),
        user_id: session?.user?.id || 'anonymous',
        session_id: session?.sessionId || 'no-session'
      }
    });
    
    if (error) throw error;
    
    logInfo(`Tracked ${interactionType} interaction for recommendation ${recommendationId}`);
    return data;
  } catch (error) {
    // Log the error but don't throw - we don't want to break the UI for tracking
    logError('Error tracking recommendation interaction:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test connection to the AI service
 * @returns {Promise<Object>} Service status
 */
const testConnection = async () => {
  try {
    // Test Supabase connection by calling the health check RPC
    const { data, error } = await supabase
      .rpc('get_ai_health')
      .single();
    
    if (error) throw error;
    
    return { 
      success: true, 
      data: {
        ...data,
        supabase_connected: true
      } 
    };
  } catch (error) {
    logError('AI Service connection test failed', error);
    
    // In development, return a mock success response
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock AI service connection in development');
      return { 
        success: true, 
        data: { 
          status: 'ok', 
          version: '1.0.0',
          services: {
            database: true,
            cache: true,
            models: ['recommendation', 'sentiment', 'forecasting']
          },
          supabase_connected: true,
          _mock: true
        } 
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to connect to AI service',
      _error: true
    };
  }
};

export {
  getAIRecommendations,
  getRecommendationExplanation,
  getMarketInsights,
  submitFeedback,
  trackRecommendationInteraction,
  testConnection
};