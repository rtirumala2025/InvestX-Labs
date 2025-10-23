import apiClient from './apiClient';
import { getSession } from './auth';
import { logError, logInfo } from '../../utils/logger';

const { get, withRetry } = apiClient;

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
 * @param {string} [options.interval] - Time interval for data points
 * @param {string} [options.range] - Time range for data
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @returns {Promise<Object>} Market data for the specified symbol
 */
/**
 * Get current market data for a specific symbol
 * @param {string} symbol - Stock/asset symbol (e.g., 'AAPL')
 * @param {Object} [options] - Additional options
 * @param {string} [options.interval] - Time interval for data points
 * @param {string} [options.range] - Time range for data
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @param {number} [options.retries=2] - Number of retry attempts
 * @returns {Promise<Object>} Market data for the specified symbol
 */
export const getMarketData = async (symbol, options = {}) => {
  const { 
    useCache = true, 
    retries = 2, 
    ...params 
  } = options;
  
  const cacheKey = generateCacheKey('getMarketData', symbol, params);
  
  // Return cached data if available and cache is enabled
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Returning cached market data');
      return cached;
    }
  }
  
  try {
    logInfo(`Fetching market data for ${symbol}`);
    
    const response = await withRetry(
      () => get(
        `/api/market/${symbol}`,
        params,
        {
          headers: {
            'Authorization': `Bearer ${getSession()?.accessToken || ''}`,
            'X-Request-ID': `mkt-${symbol}-${Date.now()}`
          }
        }
      ),
      { retries, delay: 1000 }
    );
    
    const data = response?.data || {};
    
    // Cache the response if successful
    if (useCache) {
      setCachedData(cacheKey, data, CACHE_TTL.REALTIME);
    }
    
    logInfo(`Successfully fetched market data for ${symbol}`);
    return data;
  } catch (error) {
    logError(`Error fetching market data for ${symbol}:`, error);
    
    // Return mock data in development if API fails
    if (process.env.NODE_ENV !== 'production') {
      logInfo('Using mock market data due to error');
      return {
        symbol,
        price: Math.random() * 100 + 100, // Random price between 100-200
        change: (Math.random() * 5 - 2.5).toFixed(2),
        changePercent: (Math.random() * 3 - 1.5).toFixed(2),
        timestamp: new Date().toISOString(),
        _mock: true
      };
    }
    
    throw error;
  }
};

/**
 * Search for stocks/assets by symbol or company name
 * @param {string} query - Search query (symbol or company name)
 * @param {Object} options - Additional options
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @returns {Promise<Array>} List of matching stocks/assets
 */
/**
 * Search for stocks/assets by symbol or company name
 * @param {string} query - Search query (symbol or company name)
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.useCache=true] - Whether to use cache
 * @param {number} [options.retries=1] - Number of retry attempts
 * @returns {Promise<Array>} List of matching stocks/assets
 */
export const searchStocks = async (query, options = {}) => {
  const { 
    useCache = true, 
    retries = 1 
  } = options;
  
  if (!query?.trim()) {
    return [];
  }
  
  const cacheKey = generateCacheKey('searchStocks', query);
  
  // Return cached data if available and cache is enabled
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Returning cached stock search results');
      return cached;
    }
  }
  
  try {
    logInfo(`Searching for stocks matching: ${query}`);
    
    const response = await withRetry(
      () => get(
        '/api/market/search',
        { q: query },
        {
          headers: {
            'Authorization': `Bearer ${getSession()?.accessToken || ''}`
          }
        }
      ),
      { retries, delay: 1000 }
    );
    
    const data = response?.data || [];
    
    // Cache the response if successful
    if (useCache) {
      setCachedData(cacheKey, data, CACHE_TTL.DAILY);
    }
    
    logInfo(`Found ${data.length} matching stocks`);
    return data;
  } catch (error) {
    logError('Error searching stocks:', error);
    
    // In development, return mock data if the API fails
    if (process.env.NODE_ENV !== 'production') {
      logInfo('Using mock stock search results due to error');
      return [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          type: 'Equity',
          region: 'US',
          currency: 'USD',
          _mock: true
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          type: 'Equity',
          region: 'US',
          currency: 'USD',
          _mock: true
        }
      ];
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
export const getHistoricalData = async (symbol, options = {}) => {
  const { useCache = true, ...params } = options;
  
  try {
    const response = await get(
      `/market/${symbol}/history`,
      params,
      { 
        useCache,
        cacheTtl: CACHE_TTL.HISTORICAL,
        retry: 1
      }
    );
    
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
export const getMarketNews = async (options = {}) => {
  const { useCache = true, ...params } = options;
  
  try {
    const response = await get(
      '/market/news',
      { limit: 10, ...params },
      { 
        useCache,
        cacheTtl: CACHE_TTL.NEWS,
        retry: 1
      }
    );
    
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
 * @returns {Promise<Object>} Market data for all requested symbols
 */
export const getBatchMarketData = async (symbols = [], options = {}) => {
  if (!symbols.length) return {};
  
  try {
    const response = await get(
      '/market/batch',
      { symbols: symbols.join(',') },
      { 
        useCache: options.useCache !== false,
        cacheTtl: CACHE_TTL.REALTIME,
        retry: 1
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching batch market data:', error);
    
    // Return empty object in case of error
    return {};
  }
};
