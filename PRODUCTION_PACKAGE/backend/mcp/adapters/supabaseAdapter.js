import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger.js';

/**
 * Adapter for Supabase to work with Model Context Protocol
 */
class SupabaseAdapter {
  constructor(config) {
    this.supabaseUrl = config.url;
    this.supabaseKey = config.key;
    this.client = createClient(this.supabaseUrl, this.supabaseKey);
    this.tables = {
      marketCache: 'market_cache',
      aiResponses: 'ai_responses',
      userPreferences: 'user_preferences',
      investmentPortfolios: 'investment_portfolios',
      watchlists: 'watchlists',
    };
  }

  /**
   * Initialize the database schema if it doesn't exist
   */
  async initializeDatabase() {
    try {
      // Check if tables exist, create if they don't
      const { data: tables, error: tablesError } = await this.client
        .from('pg_tables')
        .select('tablename')
        .in('schemaname', ['public']);

      if (tablesError) throw tablesError;

      const tableNames = tables.map(t => t.tablename);
      const tablesToCreate = [];

      // Check and create market_cache table
      if (!tableNames.includes(this.tables.marketCache)) {
        tablesToCreate.push(this._createMarketCacheTable());
      }

      // Check and create ai_responses table
      if (!tableNames.includes(this.tables.aiResponses)) {
        tablesToCreate.push(this._createAiResponsesTable());
      }

      // Check and create user_preferences table
      if (!tableNames.includes(this.tables.userPreferences)) {
        tablesToCreate.push(this._createUserPreferencesTable());
      }

      // Check and create investment_portfolios table
      if (!tableNames.includes(this.tables.investmentPortfolios)) {
        tablesToCreate.push(this._createInvestmentPortfoliosTable());
      }

      // Check and create watchlists table
      if (!tableNames.includes(this.tables.watchlists)) {
        tablesToCreate.push(this._createWatchlistsTable());
      }

      await Promise.all(tablesToCreate);
      logger.info('Database initialization complete');
      return true;
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Create market_cache table
   * @private
   */
  async _createMarketCacheTable() {
    const { error } = await this.client.rpc('create_extension_if_not_exists', {
      extension_name: 'uuid-ossp',
    });

    if (error) {
      logger.warn('Failed to create uuid-ossp extension:', error.message);
    }

    const { error: tableError } = await this.client.rpc('create_table_if_not_exists', {
      table_name: this.tables.marketCache,
      table_definition: `
        CREATE TABLE ${this.tables.marketCache} (
          key TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_market_cache_expires ON ${this.tables.marketCache}(expires_at);
      `,
    });

    if (tableError) throw tableError;
    logger.info(`Created ${this.tables.marketCache} table`);
  }

  /**
   * Create ai_responses table
   * @private
   */
  async _createAiResponsesTable() {
    const { error } = await this.client.rpc('create_table_if_not_exists', {
      table_name: this.tables.aiResponses,
      table_definition: `
        CREATE TABLE ${this.tables.aiResponses} (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id TEXT NOT NULL,
          context JSONB,
          model TEXT NOT NULL,
          prompt TEXT NOT NULL,
          response TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_ai_responses_user_id ON ${this.tables.aiResponses}(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_responses_created_at ON ${this.tables.aiResponses}(created_at);
      `,
    });

    if (error) throw error;
    logger.info(`Created ${this.tables.aiResponses} table`);
  }

  /**
   * Create user_preferences table
   * @private
   */
  async _createUserPreferencesTable() {
    const { error } = await this.client.rpc('create_table_if_not_exists', {
      table_name: this.tables.userPreferences,
      table_definition: `
        CREATE TABLE ${this.tables.userPreferences} (
          user_id TEXT PRIMARY KEY,
          risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
          investment_goals TEXT[],
          interests TEXT[],
          notification_preferences JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `,
    });

    if (error) throw error;
    logger.info(`Created ${this.tables.userPreferences} table`);
  }

  /**
   * Create investment_portfolios table
   * @private
   */
  async _createInvestmentPortfoliosTable() {
    const { error } = await this.client.rpc('create_table_if_not_exists', {
      table_name: this.tables.investmentPortfolios,
      table_definition: `
        CREATE TABLE ${this.tables.investmentPortfolios} (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          assets JSONB[],
          allocation_targets JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT fk_user
            FOREIGN KEY(user_id) 
            REFERENCES auth.users(id)
            ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_investment_portfolios_user_id ON ${this.tables.investmentPortfolios}(user_id);
      `,
    });

    if (error) throw error;
    logger.info(`Created ${this.tables.investmentPortfolios} table`);
  }

  /**
   * Create watchlists table
   * @private
   */
  async _createWatchlistsTable() {
    const { error } = await this.client.rpc('create_table_if_not_exists', {
      table_name: this.tables.watchlists,
      table_definition: `
        CREATE TABLE ${this.tables.watchlists} (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          symbols TEXT[] NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT fk_user
            FOREIGN KEY(user_id) 
            REFERENCES auth.users(id)
            ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON ${this.tables.watchlists}(user_id);
      `,
    });

    if (error) throw error;
    logger.info(`Created ${this.tables.watchlists} table`);
  }

  /**
   * Get cached market data
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} - Cached data or null if not found/expired
   */
  async getCachedMarketData(key) {
    try {
      const { data, error } = await this.client
        .from(this.tables.marketCache)
        .select('data, expires_at')
        .eq('key', key)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;
      return data.data;
    } catch (error) {
      logger.error('Error getting cached market data:', error);
      return null;
    }
  }

  /**
   * Cache market data
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   * @param {number} ttlSeconds - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async cacheMarketData(key, data, ttlSeconds = 3600) {
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + ttlSeconds);

      const { error } = await this.client
        .from(this.tables.marketCache)
        .upsert(
          {
            key,
            data,
            expires_at: expiresAt.toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error caching market data:', error);
      return false;
    }
  }

  /**
   * Save AI response to the database
   * @param {Object} params - Response parameters
   * @returns {Promise<Object>} - Saved response
   */
  async saveAiResponse(params) {
    const {
      userId,
      context,
      model,
      prompt,
      response,
      metadata = {},
    } = params;

    try {
      const { data, error } = await this.client
        .from(this.tables.aiResponses)
        .insert({
          user_id: userId,
          context,
          model,
          prompt,
          response,
          metadata: {
            ...metadata,
            model_version: 'llama-3-70b-instruct',
            platform: 'investx-labs',
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error saving AI response:', error);
      throw error;
    }
  }

  /**
   * Get AI response history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of responses to return
   * @returns {Promise<Array>} - List of AI responses
   */
  async getAiResponseHistory(userId, limit = 10) {
    try {
      const { data, error } = await this.client
        .from(this.tables.aiResponses)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting AI response history:', error);
      return [];
    }
  }

  /**
   * Get or create user preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User preferences
   */
  async getUserPreferences(userId) {
    try {
      // Try to get existing preferences
      const { data, error } = await this.client
        .from(this.tables.userPreferences)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

      // Return existing preferences or create default ones
      if (data) return data;

      // Create default preferences
      const defaultPrefs = {
        user_id: userId,
        risk_tolerance: 'moderate',
        investment_goals: ['learning', 'long_term_growth'],
        interests: ['stocks', 'etfs', 'crypto'],
        notification_preferences: {
          email: true,
          push: true,
          weekly_digest: true,
          price_alerts: true,
        },
      };

      const { data: newPrefs, error: createError } = await this.client
        .from(this.tables.userPreferences)
        .insert(defaultPrefs)
        .select()
        .single();

      if (createError) throw createError;
      return newPrefs;
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} updates - Preferences to update
   * @returns {Promise<Object>} - Updated preferences
   */
  async updateUserPreferences(userId, updates) {
    try {
      const { data, error } = await this.client
        .from(this.tables.userPreferences)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Get user's investment portfolios
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - List of portfolios
   */
  async getPortfolios(userId) {
    try {
      const { data, error } = await this.client
        .from(this.tables.investmentPortfolios)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting portfolios:', error);
      return [];
    }
  }

  /**
   * Get user's watchlists
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - List of watchlists
   */
  async getWatchlists(userId) {
    try {
      const { data, error } = await this.client
        .from(this.tables.watchlists)
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting watchlists:', error);
      return [];
    }
  }
}

export { SupabaseAdapter };
