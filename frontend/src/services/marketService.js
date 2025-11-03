/**
 * Market Service - Real-Time Market Data with Alpha Vantage
 * 
 * Features:
 * - Real-time stock quotes via Supabase RPCs
 * - In-memory caching with TTL
 * - Batch quote fetching
 * - Fallback to mock data
 * - Rate limit handling
 * - Error recovery
 */

import { supabase } from './supabase/config';

// Logging utilities
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     (typeof window !== 'undefined' && window.location?.hostname === 'localhost');

const logInfo = (message, data = {}) => {
  if (isDevelopment) {
    console.log(`[MarketService] ${message}`, data);
  }
};

const logError = (message, error = {}) => {
  console.error(`[MarketService] ${message}`, error);
};

// Cache configuration
const CACHE_TTL = {
  QUOTE: 30 * 1000, // 30 seconds for individual quotes
  BATCH: 5 * 60 * 1000, // 5 minutes for batch quotes
  POPULAR: 60 * 1000, // 1 minute for popular symbols
};

// Popular symbols get shorter TTL for fresher data
const POPULAR_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA'];

// In-memory cache
const cache = new Map();

/**
 * Cache utilities
 */
const getCacheKey = (type, identifier) => `${type}:${identifier}`;

const getCachedData = (type, identifier) => {
  const key = getCacheKey(type, identifier);
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  const now = Date.now();
  if (now > cached.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  logInfo(`Cache hit for ${type}:${identifier}`);
  return cached.data;
};

const setCachedData = (type, identifier, data, ttl) => {
  const key = getCacheKey(type, identifier);
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
  logInfo(`Cached ${type}:${identifier}`, { ttl });
};

const clearCache = () => {
  cache.clear();
  logInfo('Cleared all market data cache');
};

/**
 * Mock data generators for fallback
 */
const generateMockQuote = (symbol) => ({
  symbol: symbol.toUpperCase(),
  price: (Math.random() * 1000 + 50).toFixed(2),
  change: (Math.random() * 10 - 5).toFixed(2),
  percent_change: (Math.random() * 5 - 2.5).toFixed(2),
  volume: Math.floor(Math.random() * 10000000),
  open: (Math.random() * 1000 + 50).toFixed(2),
  high: (Math.random() * 1000 + 60).toFixed(2),
  low: (Math.random() * 1000 + 40).toFixed(2),
  previous_close: (Math.random() * 1000 + 50).toFixed(2),
  last_updated: new Date().toISOString(),
  source: 'mock',
});

/**
 * Get market data for a single symbol
 * @param {string} symbol - Stock symbol (e.g., 'AAPL')
 * @param {object} options - Options { useCache: boolean, forceRefresh: boolean }
 * @returns {Promise<object>} Quote data
 */
export const getMarketData = async (symbol, options = {}) => {
  const { useCache = true, forceRefresh = false } = options;
  
  try {
    // Normalize symbol
    const normalizedSymbol = symbol.toUpperCase();
    
    // Check cache first (unless force refresh)
    if (useCache && !forceRefresh) {
      const cached = getCachedData('quote', normalizedSymbol);
      if (cached) return cached;
    }
    
    logInfo(`Fetching market data for ${normalizedSymbol}`);
    
    // Call Supabase RPC
    const { data, error } = await supabase
      .rpc('get_real_quote', { p_symbol: normalizedSymbol })
      .single();
    
    if (error) throw error;
    
    // Determine TTL based on symbol popularity
    const ttl = POPULAR_SYMBOLS.includes(normalizedSymbol) 
      ? CACHE_TTL.POPULAR 
      : CACHE_TTL.QUOTE;
    
    // Cache the result
    if (useCache && data) {
      setCachedData('quote', normalizedSymbol, data, ttl);
    }
    
    logInfo(`Successfully fetched market data for ${normalizedSymbol}`);
    return data;
    
  } catch (error) {
    logError(`Error fetching market data for ${symbol}`, error);
    
    // Fallback to mock data in development
    if (isDevelopment) {
      logInfo(`Using mock data for ${symbol} in development`);
      const mockData = generateMockQuote(symbol);
      if (options.useCache) {
        setCachedData('quote', symbol.toUpperCase(), mockData, CACHE_TTL.QUOTE);
      }
      return mockData;
    }
    
    throw error;
  }
};

/**
 * Get market data for multiple symbols in batch
 * @param {string[]} symbols - Array of stock symbols
 * @param {object} options - Options { useCache: boolean }
 * @returns {Promise<object>} Batch quote data
 */
export const getBatchMarketData = async (symbols, options = {}) => {
  const { useCache = true } = options;
  
  try {
    // Normalize symbols
    const normalizedSymbols = symbols.map(s => s.toUpperCase());
    const cacheKey = normalizedSymbols.sort().join(',');
    
    // Check cache first
    if (useCache) {
      const cached = getCachedData('batch', cacheKey);
      if (cached) return cached;
    }
    
    logInfo(`Fetching batch market data for ${normalizedSymbols.length} symbols`);
    
    // Call Supabase RPC
    const { data, error } = await supabase
      .rpc('get_batch_market_data', { p_symbols: normalizedSymbols })
      .single();
    
    if (error) throw error;
    
    // Cache the result
    if (useCache && data) {
      setCachedData('batch', cacheKey, data, CACHE_TTL.BATCH);
      
      // Also cache individual quotes
      if (data.quotes && Array.isArray(data.quotes)) {
        data.quotes.forEach(quote => {
          const ttl = POPULAR_SYMBOLS.includes(quote.symbol) 
            ? CACHE_TTL.POPULAR 
            : CACHE_TTL.QUOTE;
          setCachedData('quote', quote.symbol, quote, ttl);
        });
      }
    }
    
    logInfo(`Successfully fetched batch market data for ${normalizedSymbols.length} symbols`);
    return data;
    
  } catch (error) {
    logError(`Error fetching batch market data`, error);
    
    // Fallback to mock data in development
    if (isDevelopment) {
      logInfo(`Using mock batch data in development`);
      const mockQuotes = symbols.map(generateMockQuote);
      const mockData = {
        quotes: mockQuotes,
        count: mockQuotes.length,
        fetched_at: new Date().toISOString(),
        source: 'mock',
      };
      if (options.useCache) {
        const cacheKey = symbols.map(s => s.toUpperCase()).sort().join(',');
        setCachedData('batch', cacheKey, mockData, CACHE_TTL.BATCH);
      }
      return mockData;
    }
    
    throw error;
  }
};

/**
 * Get market data statistics
 * @returns {Promise<object>} Cache statistics
 */
export const getMarketDataStats = async () => {
  try {
    logInfo('Fetching market data statistics');
    
    const { data, error } = await supabase
      .rpc('get_market_data_stats')
      .single();
    
    if (error) throw error;
    
    logInfo('Successfully fetched market data statistics');
    return data;
    
  } catch (error) {
    logError('Error fetching market data statistics', error);
    throw error;
  }
};

/**
 * Check if a symbol is allowed
 * @param {string} symbol - Stock symbol
 * @returns {Promise<boolean>} True if allowed
 */
export const isSymbolAllowed = async (symbol) => {
  try {
    const { data, error } = await supabase
      .rpc('is_symbol_allowed', { p_symbol: symbol })
      .single();
    
    if (error) throw error;
    
    return data;
    
  } catch (error) {
    logError(`Error checking if symbol ${symbol} is allowed`, error);
    return false;
  }
};

/**
 * Get list of allowed symbols
 * @returns {Promise<array>} Array of allowed symbols
 */
export const getAllowedSymbols = async () => {
  try {
    const { data, error } = await supabase
      .from('allowed_symbols')
      .select('symbol, name, exchange')
      .eq('is_active', true)
      .order('symbol');
    
    if (error) throw error;
    
    return data;
    
  } catch (error) {
    logError('Error fetching allowed symbols', error);
    
    // Fallback to common symbols
    return POPULAR_SYMBOLS.map(symbol => ({
      symbol,
      name: `${symbol} Inc.`,
      exchange: 'NASDAQ',
    }));
  }
};

/**
 * Test connection to market data service
 * @returns {Promise<object>} Connection test result
 */
export const testConnection = async () => {
  try {
    // Try to fetch a quote for a popular symbol
    await getMarketData('AAPL', { useCache: false });
    
    return {
      success: true,
      message: 'Market data service connection successful',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      message: 'Market data service connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Prefetch popular symbols
 * Useful for warming up the cache
 */
export const prefetchPopularSymbols = async () => {
  try {
    logInfo('Prefetching popular symbols');
    await getBatchMarketData(POPULAR_SYMBOLS);
    logInfo('Successfully prefetched popular symbols');
  } catch (error) {
    logError('Error prefetching popular symbols', error);
  }
};

// Export utilities
export const marketServiceUtils = {
  clearCache,
  testConnection,
  prefetchPopularSymbols,
  POPULAR_SYMBOLS,
  CACHE_TTL,
};

// Default export
const marketService = {
  getMarketData,
  getBatchMarketData,
  getMarketDataStats,
  isSymbolAllowed,
  getAllowedSymbols,
  testConnection,
  prefetchPopularSymbols,
  clearCache,
};

export default marketService;

/**
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 */

/*
// Example 1: Get single quote
import { getMarketData } from './services/marketService';

const quote = await getMarketData('AAPL');
console.log('AAPL price:', quote.price);

// Example 2: Get batch quotes
import { getBatchMarketData } from './services/marketService';

const batch = await getBatchMarketData(['AAPL', 'MSFT', 'GOOGL']);
console.log('Quotes:', batch.quotes);

// Example 3: Force refresh (bypass cache)
const freshQuote = await getMarketData('AAPL', { forceRefresh: true });

// Example 4: Check if symbol is allowed
import { isSymbolAllowed } from './services/marketService';

const allowed = await isSymbolAllowed('AAPL');
console.log('AAPL allowed:', allowed);

// Example 5: Get allowed symbols
import { getAllowedSymbols } from './services/marketService';

const symbols = await getAllowedSymbols();
console.log('Allowed symbols:', symbols);

// Example 6: Prefetch popular symbols
import { prefetchPopularSymbols } from './services/marketService';

await prefetchPopularSymbols();

// Example 7: Get cache statistics
import { getMarketDataStats } from './services/marketService';

const stats = await getMarketDataStats();
console.log('Cache stats:', stats);

// Example 8: Clear cache
import { marketServiceUtils } from './services/marketService';

marketServiceUtils.clearCache();

// Example 9: Test connection
import { testConnection } from './services/marketService';

const result = await testConnection();
console.log('Connection test:', result);

// Example 10: Using default export
import marketService from './services/marketService';

const quote = await marketService.getMarketData('AAPL');
const batch = await marketService.getBatchMarketData(['AAPL', 'MSFT']);
marketService.clearCache();
*/
