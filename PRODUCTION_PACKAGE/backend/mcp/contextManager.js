import { logger } from '../utils/logger.js';

/**
 * Manages and merges different contexts for AI interactions
 */
class ContextManager {
  constructor({ supabase }) {
    this.supabase = supabase;
    this.contextCache = new Map();
    this.cacheTtl = 5 * 60 * 1000; // 5 minutes cache TTL
  }

  /**
   * Get a unique cache key for context
   * @private
   */
  _getCacheKey(userId, contextType) {
    return `${userId}:${contextType}`;
  }

  /**
   * Get cached context if available and not expired
   * @private
   */
  _getCachedContext(key) {
    const cached = this.contextCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTtl) {
      this.contextCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache a context
   * @private
   */
  _cacheContext(key, data) {
    this.contextCache.set(key, {
      data,
      timestamp: Date.now(),
    });
    return data;
  }

  /**
   * Get user profile context
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile context
   */
  async getUserProfileContext(userId) {
    const cacheKey = this._getCacheKey(userId, 'profile');
    const cached = this._getCachedContext(cacheKey);
    if (cached) return cached;

    try {
      // Get user preferences
      const preferences = await this.supabase.getUserPreferences(userId);
      
      // Get user's portfolios
      const portfolios = await this.supabase.getPortfolios(userId);
      
      // Get user's watchlists
      const watchlists = await this.supabase.getWatchlists(userId);
      
      // Get recent AI interactions
      const recentInteractions = await this.supabase.getAiResponseHistory(userId, 3);

      const profileContext = {
        user_id: userId,
        risk_tolerance: preferences.risk_tolerance || 'moderate',
        investment_goals: preferences.investment_goals || [],
        interests: preferences.interests || [],
        portfolio_count: portfolios.length,
        watchlist_count: watchlists.length,
        recent_interactions: recentInteractions.map(i => ({
          id: i.id,
          model: i.model,
          created_at: i.created_at,
          prompt: i.prompt.substring(0, 50) + (i.prompt.length > 50 ? '...' : '')
        })),
        last_updated: new Date().toISOString()
      };

      return this._cacheContext(cacheKey, profileContext);
    } catch (error) {
      logger.error('Error getting user profile context:', error);
      return {
        user_id: userId,
        risk_tolerance: 'moderate',
        investment_goals: [],
        interests: [],
        portfolio_count: 0,
        watchlist_count: 0,
        recent_interactions: [],
        last_updated: new Date().toISOString(),
        error: 'Failed to load full profile context'
      };
    }
  }

  /**
   * Get market context for specific symbols
   * @param {Array<string>} symbols - Array of stock symbols
   * @returns {Promise<Object>} Market context
   */
  async getMarketContext(symbols) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return {};
    }

    const cacheKey = this._getCacheKey(symbols.sort().join(','), 'market');
    const cached = this._getCachedContext(cacheKey);
    if (cached) return cached;

    try {
      // In a real implementation, this would fetch market data
      // For now, return a simplified context
      const marketContext = {
        symbols: symbols,
        last_updated: new Date().toISOString(),
        data: {}
      };

      // Add a note that real market data would be fetched here
      marketContext.note = 'Real-time market data integration would be implemented here';

      return this._cacheContext(cacheKey, marketContext);
    } catch (error) {
      logger.error('Error getting market context:', error);
      return {
        symbols,
        error: 'Failed to fetch market data',
        last_updated: new Date().toISOString()
      };
    }
  }

  /**
   * Get educational context based on user's interests and knowledge level
   * @param {string} userId - User ID
   * @param {string} topic - Specific topic of interest
   * @returns {Promise<Object>} Educational context
   */
  async getEducationalContext(userId, topic = null) {
    try {
      const preferences = await this.supabase.getUserPreferences(userId);
      const interests = topic ? [topic] : preferences.interests || [];
      
      // In a real implementation, this would fetch educational content
      // based on the user's interests and knowledge level
      const educationalContext = {
        interests,
        knowledge_level: preferences.knowledge_level || 'beginner',
        recommended_topics: [
          'Introduction to Investing',
          'Risk Management',
          'Diversification',
          'Market Analysis'
        ],
        last_updated: new Date().toISOString()
      };

      // Add a note that real educational content would be fetched here
      educationalContext.note = 'Educational content integration would be implemented here';

      return educationalContext;
    } catch (error) {
      logger.error('Error getting educational context:', error);
      return {
        interests: [],
        knowledge_level: 'beginner',
        recommended_topics: [],
        error: 'Failed to load educational context',
        last_updated: new Date().toISOString()
      };
    }
  }

  /**
   * Merge multiple contexts into a single context object
   * @param {Object} contexts - Object containing different context types
   * @returns {Object} Merged context
   */
  mergeContexts(contexts = {}) {
    const defaultContext = {
      timestamp: new Date().toISOString(),
      platform: 'InvestX Labs',
      environment: process.env.NODE_ENV || 'development',
      educational_disclaimer: 'This information is for educational purposes only and should not be considered financial advice.'
    };

    return {
      ...defaultContext,
      ...contexts,
      metadata: {
        context_types: Object.keys(contexts),
        generated_at: new Date().toISOString()
      }
    };
  }

  /**
   * Get a comprehensive context for AI interactions
   * @param {string} userId - User ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Comprehensive context
   */
  async getComprehensiveContext(userId, options = {}) {
    const {
      includeMarketData = false,
      symbols = [],
      includeEducational = true,
      topic = null
    } = options;

    try {
      // Get user profile context
      const profileContext = await this.getUserProfileContext(userId);
      
      // Get market context if requested
      const marketContext = includeMarketData && symbols.length > 0
        ? await this.getMarketContext(symbols)
        : {};
      
      // Get educational context if requested
      const educationalContext = includeEducational
        ? await this.getEducationalContext(userId, topic)
        : {};

      // Merge all contexts
      return this.mergeContexts({
        user: profileContext,
        market: marketContext,
        education: educationalContext
      });
    } catch (error) {
      logger.error('Error getting comprehensive context:', error);
      return this.mergeContexts({
        error: 'Failed to load full context',
        error_details: error.message
      });
    }
  }

  /**
   * Clear the context cache
   * @param {string} [userId] - Optional user ID to clear cache for
   */
  clearCache(userId = null) {
    if (userId) {
      // Clear cache for a specific user
      for (const key of this.contextCache.keys()) {
        if (key.startsWith(`${userId}:`)) {
          this.contextCache.delete(key);
        }
      }
      logger.info(`Cleared context cache for user ${userId}`);
    } else {
      // Clear entire cache
      this.contextCache.clear();
      logger.info('Cleared all context caches');
    }
  }
}

export { ContextManager };
