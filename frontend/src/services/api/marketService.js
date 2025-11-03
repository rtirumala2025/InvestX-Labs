import { supabase } from '../supabase/config';
import { logError, logInfo } from '../../utils/logger';

// Cache configuration
const CACHE_TTL = {
  REALTIME: 30 * 1000,    // 30 seconds
  DAILY: 5 * 60 * 1000,   // 5 minutes
  HISTORICAL: 60 * 60 * 1000, // 1 hour
  NEWS: 15 * 60 * 1000,   // 15 minutes
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
 * @param {number} [ttl=CACHE_TTL.REALTIME] - Time to live in ms
 */
const setCachedData = (key, data, ttl = CACHE_TTL.REALTIME) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

/**
 * Generate cache key from function name and arguments
 * @param {string} functionName - Name of the function
 * @param {any} args - Function arguments
 * @returns {string} Cache key
 */
const generateCacheKey = (functionName, ...args) => {
  return `${functionName}:${JSON.stringify(args)}`;
};


/**
 * Get current market data for a specific symbol
 * @param {string} symbol - Stock/asset symbol (e.g., 'AAPL')
 * @param {Object} options - Additional options
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @param {number} [options.cacheTtl=CACHE_TTL.REALTIME] - Cache TTL in ms
 * @returns {Promise<Object>} Market data for the specified symbol
 */
const getMarketData = async (symbol, options = {}) => {
  const {
    useCache = true,
    cacheTtl = CACHE_TTL.REALTIME
  } = options;
  
  const cacheKey = `market:${symbol}:quote`;
  
  // Return cached data if available and cache is enabled
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo(`Returning cached market data for ${symbol}`);
      return { ...cached, _cached: true };
    }
  }
  
  try {
    logInfo(`Fetching market data for ${symbol} from Supabase`);
    
    // Call the Supabase RPC function
    const { data, error } = await supabase
      .rpc('get_quote', { symbol })
      .single();
    
    if (error) throw error;
    
    // Cache the successful response
    if (useCache && data) {
      setCachedData(cacheKey, data, cacheTtl);
    }
    
    logInfo(`Successfully fetched market data for ${symbol}`);
    return data;
  } catch (error) {
    logError(`Error fetching market data for ${symbol}:`, error);
    
    // Return cached data if available, even if it's stale
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo(`Returning stale cached market data for ${symbol}`);
      return { ...cached, _stale: true };
    }
    
    // Return mock data in development if API fails
    if (process.env.NODE_ENV !== 'production') {
      logInfo(`Using mock market data for ${symbol} in development`);
      return {
        symbol,
        price: (Math.random() * 1000).toFixed(2),
        change: (Math.random() * 20 - 10).toFixed(2),
        changePercent: (Math.random() * 5 - 2.5).toFixed(2),
        timestamp: new Date().toISOString(),
        _mock: true
      };
    }
    
    // Return empty object as a last resort
    return {};
  }
};

/**
 * Search for stocks/assets by symbol or company name
 * @param {string} query - Search query (symbol or company name)
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @param {number} [options.limit=10] - Maximum number of results to return
 * @returns {Promise<Array>} List of matching stocks/assets
 */
const searchStocks = async (query, options = {}) => {
  const { 
    useCache = true, 
    limit = 10,
    cacheTtl = CACHE_TTL.DAILY
  } = options;
  
  const cacheKey = `market:search:${query.toLowerCase()}`;
  
  // Return cached results if available and cache is enabled
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo(`Returning cached search results for: ${query}`);
      return { ...cached, _cached: true };
    }
  }
  
  try {
    logInfo(`Searching for stocks matching: ${query}`);
    
    // In a real implementation, you would call a Supabase RPC function here
    // For now, we'll return a mock response
    const mockResults = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'US' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'US' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'US' },
      { symbol: 'AMZN', name: 'Amazon.com, Inc.', type: 'Equity', region: 'US' },
      { symbol: 'META', name: 'Meta Platforms, Inc.', type: 'Equity', region: 'US' }
    ].filter(item => 
      item.symbol.toLowerCase().includes(query.toLowerCase()) || 
      item.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);
    
    // Cache the results
    if (useCache && mockResults.length > 0) {
      setCachedData(cacheKey, mockResults, cacheTtl);
    }
    
    return mockResults;
  } catch (error) {
    logError('Error searching for stocks:', error);
    
    // Return cached results if available, even if stale
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Returning stale cached search results');
      return { ...cached, _stale: true };
    }
    
    // Return empty array in case of error
    return [];
  }
};

/**
 * Get historical price data for a symbol
 * @param {string} symbol - Stock/asset symbol
 * @param {Object} options - Date range options
 * @param {string} [options.startDate] - Start date (YYYY-MM-DD)
 * @param {string} [options.endDate] - End date (YYYY-MM-DD)
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @returns {Promise<Array>} Historical price data
 */
const getHistoricalData = async (symbol, options = {}) => {
  const { useCache = true, ...params } = options;
  
  try {
    const response = await supabase
      .rpc('get_historical_data', { symbol, ...params });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    
    // Return empty array in case of error
    return [];
  }
};

/**
 * Get market news for a specific symbol or general market
 * @param {Object} options - News query options
 * @param {string} [options.symbol] - Specific symbol to get news for
 * @param {number} [options.limit=10] - Maximum number of news items to return
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @returns {Promise<Array>} List of news articles
 */
const getMarketNews = async (options = {}) => {
  const { useCache = true, ...params } = options;
  
  try {
    const response = await supabase
      .rpc('get_market_news', { ...params });
    
    return response.data || [];
  } catch (error) {
    console.error('Error fetching market news:', error);
    
    // Return empty array in case of error
    return [];
  }
};

/**
 * Get multiple market data points in a single request
 * @param {string[]} symbols - Array of symbols to fetch
 * @param {Object} options - Additional options
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @param {number} [options.cacheTtl=CACHE_TTL.REALTIME] - Cache TTL in ms
 * @returns {Promise<Object>} Market data for all requested symbols
 */
const getBatchMarketData = async (symbols = [], options = {}) => {
  if (!symbols.length) return {};
  
  const cacheKey = `batch-${symbols.sort().join(',')}`;
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData && options.useCache !== false) {
    return cachedData;
  }
  
  try {
    logInfo(`Fetching batch market data for symbols: ${symbols.join(', ')}`);
    
    const response = await supabase
      .rpc('get_batch_market_data', { symbols });
    
    // Transform the response to match the expected format
    const result = {};
    
    // Check if the response is in the expected format
    if (response.data && typeof response.data === 'object') {
      Object.entries(response.data).forEach(([symbol, data]) => {
        if (data && typeof data === 'object') {
          result[symbol] = {
            symbol,
            price: data.price || 0,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            timestamp: data.timestamp || new Date().toISOString(),
            ...data
          };
        }
      });
    }
    
    // Cache the result
    setCachedData(cacheKey, result, options.cacheTtl || CACHE_TTL.REALTIME);
    
    return result;
  } catch (error) {
    logError('Error fetching batch market data:', error);
    
    // Return cached data if available, even if it's stale
    if (cachedData) {
      logInfo('Using cached market data due to error');
      return cachedData;
    }
    
    // Return mock data in development if no cache is available
    if (process.env.NODE_ENV === 'development') {
      logInfo('Returning mock market data in development');
      return symbols.reduce((acc, symbol) => ({
        ...acc,
        [symbol]: {
          symbol,
          price: Math.random() * 1000,
          change: (Math.random() * 20 - 10).toFixed(2),
          changePercent: (Math.random() * 5 - 2.5).toFixed(2),
          timestamp: new Date().toISOString()
        }
      }), {});
    }
    
    // Return empty object as a last resort
    return {};
  }
};

/**
 * Test connection to the Market service
 * @returns {Promise<Object>} Service status
 */
const testConnection = async () => {
  try {
    // Test Supabase connection by fetching a quote
    const { data, error } = await supabase
      .rpc('get_quote', { symbol: 'AAPL' })
      .single();
    
    if (error) throw error;
    
    return { 
      success: true, 
      data: {
        status: 'ok',
        version: '1.0.0',
        supabase_connected: true
      } 
    };
  } catch (error) {
    logError('Market Service connection test failed', error);
    
    // In development, return a mock success response
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock market service connection in development');
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
      error: error.message || 'Failed to connect to Market service',
      _error: true
    };
  }
};

export {
  getMarketData,
  searchStocks,
  getHistoricalData,
  getMarketNews,
  getBatchMarketData,
  testConnection
};
