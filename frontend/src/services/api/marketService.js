import { get } from './apiClient';

// Cache time constants (in milliseconds)
const CACHE_TTL = {
  REALTIME: 30 * 1000,    // 30 seconds
  DAILY: 5 * 60 * 1000,   // 5 minutes
  HISTORICAL: 60 * 60 * 1000, // 1 hour
  NEWS: 15 * 60 * 1000,   // 15 minutes
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
export const getMarketData = async (symbol, options = {}) => {
  const { useCache = true, ...params } = options;
  
  try {
    const response = await get(
      `/market/${symbol}`,
      params,
      { 
        useCache,
        cacheTtl: CACHE_TTL.REALTIME,
        retry: 2, // Retry up to 2 times on failure
        retryDelay: 1000 // 1 second between retries
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    
    // Return mock data in development if API fails
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock market data due to error');
      return {
        symbol,
        price: Math.random() * 100 + 100, // Random price between 100-200
        change: (Math.random() * 5 - 2.5).toFixed(2),
        changePercent: (Math.random() * 3 - 1.5).toFixed(2),
        timestamp: new Date().toISOString(),
        isMock: true
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
export const searchStocks = async (query, options = {}) => {
  const { useCache = true } = options;
  
  if (!query?.trim()) {
    return [];
  }
  
  try {
    const response = await get(
      '/market/search',
      { q: query },
      { 
        useCache,
        cacheTtl: CACHE_TTL.DAILY,
        retry: 1
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error searching stocks:', error);
    
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
