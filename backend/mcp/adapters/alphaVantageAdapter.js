import { logger } from '../../utils/logger.js';
import { exponentialBackoff } from '../../ai-services/utils.js';

/**
 * Adapter for Alpha Vantage API to work with Model Context Protocol
 */
class AlphaVantageAdapter {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://www.alphavantage.co/query';
    this.cache = new Map();
    this.cacheTtl = 5 * 60 * 1000; // 5 minutes cache TTL
  }

  /**
   * Make a request to Alpha Vantage API with retry logic
   * @private
   */
  async _makeRequest(params) {
    const url = new URL(this.baseUrl);
    url.search = new URLSearchParams({
      ...params,
      apikey: this.apiKey,
      datatype: 'json',
    }).toString();

    const cacheKey = url.toString();
    const cached = this.cache.get(cacheKey);
    
    // Return cached response if available and not expired
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      logger.debug('Returning cached response for:', cacheKey);
      return cached.data;
    }

    try {
      const response = await exponentialBackoff(
        async () => {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'InvestX-Labs/1.0',
            },
          });
          
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          
          return res.json();
        },
        3, // max retries
        1000, // initial delay
        (error) => {
          // Only retry on network errors or 5xx/429 status codes
          const isNetworkError = !error.status;
          const isRateLimit = error.status === 429;
          const isServerError = error.status >= 500 && error.status < 600;
          return isNetworkError || isRateLimit || isServerError;
        }
      );

      // Cache the successful response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      logger.error('Alpha Vantage API request failed:', {
        url: url.toString(),
        error: error.message,
      });
      throw new Error(`Failed to fetch data from Alpha Vantage: ${error.message}`);
    }
  }

  /**
   * Get real-time stock quote
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} - Stock quote data
   */
  async getQuote(symbol) {
    const params = {
      function: 'GLOBAL_QUOTE',
      symbol: symbol.toUpperCase(),
    };

    const data = await this._makeRequest(params);
    return data['Global Quote'] || null;
  }

  /**
   * Get company overview
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} - Company overview data
   */
  async getCompanyOverview(symbol) {
    const params = {
      function: 'OVERVIEW',
      symbol: symbol.toUpperCase(),
    };

    return this._makeRequest(params);
  }

  /**
   * Get time series data (daily, weekly, monthly)
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Time interval (daily, weekly, monthly)
   * @param {boolean} full - Whether to return full data or compact (last 100 data points)
   * @returns {Promise<Object>} - Time series data
   */
  async getTimeSeries(symbol, interval = 'daily', full = false) {
    const functionMap = {
      'intraday': 'TIME_SERIES_INTRADAY',
      'daily': 'TIME_SERIES_DAILY',
      'weekly': 'TIME_SERIES_WEEKLY',
      'monthly': 'TIME_SERIES_MONTHLY',
    };

    const functionName = functionMap[interval.toLowerCase()] || 'TIME_SERIES_DAILY';
    const outputSize = full ? 'full' : 'compact';

    const params = {
      function: functionName,
      symbol: symbol.toUpperCase(),
      outputsize: outputSize,
    };

    // Add interval for intraday data
    if (functionName === 'TIME_SERIES_INTRADAY') {
      params.interval = '5min'; // Default to 5-minute intervals
    }

    const data = await this._makeRequest(params);
    
    // The response key varies based on the function called
    const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
    return timeSeriesKey ? data[timeSeriesKey] : null;
  }

  /**
   * Search for stocks by keyword
   * @param {string} keywords - Search keywords
   * @returns {Promise<Array>} - List of matching stocks
   */
  async searchSymbols(keywords) {
    const params = {
      function: 'SYMBOL_SEARCH',
      keywords: keywords,
    };

    const data = await this._makeRequest(params);
    return data.bestMatches || [];
  }

  /**
   * Get technical indicators
   * @param {string} symbol - Stock symbol
   * @param {string} indicator - Indicator name (e.g., 'SMA', 'RSI', 'MACD')
   * @param {Object} options - Indicator-specific options
   * @returns {Promise<Object>} - Indicator data
   */
  async getIndicator(symbol, indicator, options = {}) {
    // Map common indicator names to Alpha Vantage function names
    const indicatorMap = {
      'sma': 'SMA',
      'ema': 'EMA',
      'rsi': 'RSI',
      'macd': 'MACD',
      'bbands': 'BBANDS',
      'stoch': 'STOCH',
      'adx': 'ADX',
      'obv': 'OBV',
    };

    const functionName = indicatorMap[indicator.toLowerCase()] || indicator.toUpperCase();
    
    const params = {
      function: functionName,
      symbol: symbol.toUpperCase(),
      ...options,
    };

    return this._makeRequest(params);
  }

  /**
   * Get batch stock quotes
   * @param {Array<string>} symbols - Array of stock symbols
   * @returns {Promise<Array>} - Array of stock quotes
   */
  async getBatchQuotes(symbols) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return [];
    }

    // Alpha Vantage's BATCH_QUOTES endpoint is only available on premium plans
    // For simplicity, we'll make individual requests for each symbol
    const quotes = await Promise.all(
      symbols.slice(0, 5).map(symbol => this.getQuote(symbol).catch(() => null))
    );

    return quotes.filter(quote => quote !== null);
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Alpha Vantage cache cleared');
  }
}

export { AlphaVantageAdapter };
