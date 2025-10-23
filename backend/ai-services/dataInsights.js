import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import fetch from 'node-fetch';
import { exponentialBackoff, formatFinancialNumber } from './utils.js';

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

class DataInsights {
  constructor(supabaseUrl, supabaseKey, alphaVantageKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.ALPHA_VANTAGE_KEY = alphaVantageKey;
    this.ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';
  }

  async getMarketData(symbol, functionType = 'GLOBAL_QUOTE', options = {}) {
    const cacheKey = `market_${functionType}_${symbol}`;
    const requestId = options.requestId || `req_${Date.now()}`;
    const logContext = { cacheKey, symbol, functionType, requestId };
    
    logger.debug('Fetching market data', logContext);
    
    try {
      // Check cache first
      const { data: cached, error: cacheError } = await exponentialBackoff(
        () => this.supabase
          .from('market_cache')
          .select('data, expires_at')
          .eq('key', cacheKey)
          .gt('expires_at', new Date().toISOString())
          .single(),
        3, // maxRetries
        1000, // initialDelay
        (error) => {
          logger.warn('Supabase cache query failed, retrying...', {
            ...logContext,
            error: error.message
          });
          return true; // Always retry on error
        }
      );

      if (cached && !cacheError) {
        logger.debug('Returning cached market data', {
          ...logContext,
          cacheHit: true,
          expiresAt: cached.expires_at
        });
        return cached.data;
      }

      // If not in cache or expired, fetch from Alpha Vantage
      logger.debug('Cache miss, fetching fresh market data', logContext);
      const params = new URLSearchParams({
        function: functionType,
        symbol,
        apikey: this.ALPHA_VANTAGE_KEY,
        datatype: 'json'
      });

      const response = await exponentialBackoff(
        async () => {
          const res = await fetch(`${this.ALPHA_VANTAGE}?${params}`);
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        },
        3, // maxRetries
        1000, // initialDelay
        (error) => {
          logger.warn('Alpha Vantage API request failed, retrying...', {
            ...logContext,
            error: error.message
          });
          return true; // Always retry on error
        }
      );

      // Check for Alpha Vantage error message
      if (data.Information && data.Information.includes('API call frequency')) {
        const errorMsg = 'Alpha Vantage API rate limit exceeded';
        logger.error(errorMsg, { ...logContext, data });
        throw new Error(errorMsg);
      }
      
      // Cache the result
      const expiresAt = new Date(Date.now() + CACHE_TTL);
      try {
        const { error } = await this.supabase
          .from('market_cache')
          .upsert({
            key: cacheKey,
            data,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        
        logger.debug('Successfully cached market data', {
          ...logContext,
          cacheKey,
          expiresAt: expiresAt.toISOString()
        });
      } catch (error) {
        logger.error('Error caching market data', {
          ...logContext,
          error: error.message,
          stack: error.stack
        });
        // Don't fail the request if caching fails
      }

      return data;
    } catch (error) {
      logger.error('Error in getMarketData:', error);
      throw error;
    }
  }

  async getStockQuote(symbol, options = {}) {
    const requestId = options.requestId || `req_${Date.now()}`;
    const logContext = { symbol, requestId };
    
    logger.debug('Fetching stock quote', logContext);
    
    try {
      const data = await this.getMarketData(
        symbol, 
        'GLOBAL_QUOTE',
        { requestId }
      );
      
      const quote = data['Global Quote'] || null;
      
      if (quote) {
        logger.debug('Successfully fetched stock quote', {
          ...logContext,
          symbol: quote['01. symbol'],
          price: quote['05. price']
        });
      } else {
        logger.warn('No quote data available', logContext);
      }
      
      return quote;
    } catch (error) {
      logger.error('Error getting stock quote:', error);
      throw error;
    }
  }

  async getCompanyOverview(symbol, options = {}) {
    const requestId = options.requestId || `req_${Date.now()}`;
    const logContext = { symbol, requestId };
    
    logger.debug('Fetching company overview', logContext);
    
    try {
      const overview = await this.getMarketData(
        symbol, 
        'OVERVIEW',
        { requestId }
      );
      
      if (overview && overview.Symbol) {
        logger.debug('Successfully fetched company overview', {
          ...logContext,
          name: overview.Name,
          sector: overview.Sector,
          marketCap: formatFinancialNumber(overview.MarketCapitalization, 'currency', 0)
        });
      } else {
        logger.warn('No overview data available', logContext);
      }
      
      return overview;
    } catch (error) {
      logger.error('Error getting company overview:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const dataInsights = new DataInsights(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  process.env.ALPHA_VANTAGE_API_KEY
);
