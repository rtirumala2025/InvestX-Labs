/**
 * Market Data Service
 * Provides real-time stock market data integration for InvestX Labs
 * Uses backend API which handles Alpha Vantage integration
 */

// Backend API base URL
const getApiBaseUrl = () => {
  const explicit = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5001';
  }
  return '';
};

const API_BASE_URL = getApiBaseUrl();

// Cache for API responses to avoid excessive calls
const priceCache = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

// LocalStorage cache key
const STORAGE_CACHE_KEY = 'investx_market_cache';
const STORAGE_CACHE_DURATION = 300000; // 5 minutes for localStorage cache

/**
 * Get current stock quote from backend API
 * @param {string} symbol - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<Object|null>} Quote data or null on failure
 */
export const getQuote = async (symbol) => {
  console.log('📈 [MarketService] getQuote() called for symbol:', symbol);
  
  if (!symbol) {
    console.warn('📈 [MarketService] ❌ No symbol provided');
    return null;
  }

  // Check in-memory cache first
  const cacheKey = symbol.toUpperCase();
  const cached = priceCache.get(cacheKey);
  const cacheAge = cached ? Date.now() - cached.timestamp : null;
  
  if (cached && cacheAge < CACHE_DURATION) {
    console.log('📈 [MarketService] 🎯 Cache HIT for', symbol, '- age:', Math.round(cacheAge / 1000), 'seconds');
    return cached.data;
  } else if (cached) {
    console.log('📈 [MarketService] ⏰ Cache MISS for', symbol, '- stale data, age:', Math.round(cacheAge / 1000), 'seconds');
  } else {
    console.log('📈 [MarketService] 🆕 Cache MISS for', symbol, '- no cached data');
  }

  // Check localStorage cache as fallback
  try {
    const storedCache = localStorage.getItem(STORAGE_CACHE_KEY);
    if (storedCache) {
      const cacheData = JSON.parse(storedCache);
      const cachedQuote = cacheData[cacheKey];
      if (cachedQuote && (Date.now() - cachedQuote.timestamp) < STORAGE_CACHE_DURATION) {
        console.log('📈 [MarketService] 💾 localStorage Cache HIT for', symbol);
        // Restore to in-memory cache
        priceCache.set(cacheKey, cachedQuote);
        return cachedQuote.data;
      }
    }
  } catch (storageError) {
    console.warn('📈 [MarketService] Error reading localStorage cache:', storageError);
  }

  try {
    const url = `${API_BASE_URL}/api/market/quote/${encodeURIComponent(symbol)}`;
    
    console.log('📈 [MarketService] 🌐 Sending API request to backend:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('📈 [MarketService] 📥 API response received for', symbol);
    
    // Check for API errors
    if (!result.success || !result.data) {
      console.error('📈 [MarketService] ❌ API Error:', result.message || 'Unknown error');
      return null;
    }

    const quoteData = result.data;
    
    // Transform the response to match expected format
    const transformedQuote = {
      symbol: quoteData.symbol || symbol.toUpperCase(),
      open: parseFloat(quoteData.open) || 0,
      high: parseFloat(quoteData.high) || 0,
      low: parseFloat(quoteData.low) || 0,
      price: parseFloat(quoteData.price) || 0,
      volume: parseInt(quoteData.volume) || 0,
      latestTradingDay: quoteData.latestTradingDay,
      previousClose: parseFloat(quoteData.previousClose) || 0,
      change: parseFloat(quoteData.change) || 0,
      changePercent: parseFloat(quoteData.changePercent) || 0
    };
    
    console.log('📈 [MarketService] ✅ Transformed quote for', symbol, ':', {
      price: transformedQuote.price,
      change: transformedQuote.change,
      changePercent: transformedQuote.changePercent,
      previousClose: transformedQuote.previousClose
    });

    // Cache the result in memory
    const cacheEntry = {
      data: transformedQuote,
      timestamp: Date.now()
    };
    priceCache.set(cacheKey, cacheEntry);
    
    // Also cache in localStorage
    try {
      const storedCache = localStorage.getItem(STORAGE_CACHE_KEY);
      const cacheData = storedCache ? JSON.parse(storedCache) : {};
      cacheData[cacheKey] = cacheEntry;
      // Keep only last 50 entries to avoid storage bloat
      const keys = Object.keys(cacheData);
      if (keys.length > 50) {
        // Remove oldest entries
        const sortedKeys = keys.sort((a, b) => (cacheData[a].timestamp || 0) - (cacheData[b].timestamp || 0));
        sortedKeys.slice(0, keys.length - 50).forEach(key => delete cacheData[key]);
      }
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (storageError) {
      console.warn('📈 [MarketService] Error writing to localStorage cache:', storageError);
    }
    
    console.log('📈 [MarketService] 💾 Cached quote for', symbol, '- cache size:', priceCache.size);

    return transformedQuote;
  } catch (error) {
    console.error('📈 [MarketService] ❌ Error fetching quote for', symbol, ':', error);
    
    // Try to return cached data as fallback (in-memory first)
    const cached = priceCache.get(cacheKey);
    if (cached) {
      console.log('📈 [MarketService] 🔄 Returning stale in-memory cached data as fallback for', symbol);
      return cached.data;
    }
    
    // Try localStorage cache as last resort
    try {
      const storedCache = localStorage.getItem(STORAGE_CACHE_KEY);
      if (storedCache) {
        const cacheData = JSON.parse(storedCache);
        const cachedQuote = cacheData[cacheKey];
        if (cachedQuote) {
          console.log('📈 [MarketService] 🔄 Returning stale localStorage cached data as fallback for', symbol, '(may be outdated)');
          // Add warning that data may be stale
          return {
            ...cachedQuote.data,
            _stale: true,
            _staleWarning: 'Market data may be outdated. Please refresh.'
          };
        }
      }
    } catch (storageError) {
      console.warn('📈 [MarketService] Error reading localStorage cache on error fallback:', storageError);
    }
    
    return null;
  }
};

/**
 * Get multiple stock quotes efficiently
 * @param {string[]} symbols - Array of stock symbols
 * @returns {Promise<Object>} Object with symbol as key and quote data as value
 */
export const getMultipleQuotes = async (symbols) => {
  console.log('📈 [MarketService] getMultipleQuotes() called for', symbols.length, 'symbols:', symbols);
  
  if (!symbols || symbols.length === 0) {
    console.log('📈 [MarketService] ⚠️ No symbols provided to getMultipleQuotes');
    return {};
  }

  // Fetch all quotes in parallel (backend handles rate limiting)
  const results = {};
  
  console.log('📈 [MarketService] 🔄 Fetching', symbols.length, 'symbols from backend API');
  
  try {
    // Fetch all quotes in parallel - backend handles caching and rate limiting
    const promises = symbols.map(symbol => 
      getQuote(symbol).catch(err => {
        console.warn('📈 [MarketService] ⚠️ Failed to fetch quote for', symbol, ':', err.message);
        return null;
      })
    );
    
    const batchResults = await Promise.all(promises);
    
    symbols.forEach((symbol, index) => {
      results[symbol] = batchResults[index];
    });
    
    console.log('📈 [MarketService] ✅ Completed - received', batchResults.filter(r => r !== null).length, 'valid quotes out of', symbols.length, 'requested');
  } catch (error) {
    console.error('📈 [MarketService] ❌ Error fetching quotes:', error);
  }
  
  const successCount = Object.values(results).filter(r => r !== null).length;
  console.log('📈 [MarketService] 🎯 getMultipleQuotes completed:', successCount, 'successful out of', symbols.length, 'requested');

  return results;
};

/**
 * Calculate portfolio metrics with live market data
 * @param {Array} holdings - User's portfolio holdings
 * @param {Object} marketData - Market data from getMultipleQuotes
 * @returns {Object} Calculated portfolio metrics
 */
export const calculateLivePortfolioMetrics = (holdings, marketData) => {
  if (!holdings || holdings.length === 0) {
    return {
      totalValue: 0,
      totalCostBasis: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      dayChange: 0,
      dayChangePercentage: 0,
      holdings: []
    };
  }

  let totalValue = 0;
  let totalCostBasis = 0;
  let totalDayChange = 0;

  const enrichedHoldings = holdings.map(holding => {
    const quote = marketData[holding.symbol];
    const shares = Number(holding.shares) || 0;
    const purchasePrice = Number(holding.purchasePrice || holding.purchase_price || 0);
    const currentPrice = quote?.price || purchasePrice || 0;
    const previousClose = quote?.previousClose || purchasePrice || 0;
    
    const value = shares * currentPrice;
    const costBasis = shares * purchasePrice;
    const gainLoss = value - costBasis;
    const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    
    const dayChange = shares * (currentPrice - previousClose);
    const dayChangePercentage = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

    totalValue += value;
    totalCostBasis += costBasis;
    totalDayChange += dayChange;

    return {
      ...holding,
      currentPrice,
      previousClose,
      value,
      gainLoss,
      gainLossPercentage,
      dayChange,
      dayChangePercentage,
      lastUpdated: new Date().toISOString()
    };
  });

  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPercentage = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;
  // Calculate day change percentage as percentage of total portfolio value
  const previousTotalValue = totalValue - totalDayChange;
  const dayChangePercentage = previousTotalValue > 0 ? (totalDayChange / previousTotalValue) * 100 : 0;

  return {
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercentage,
    dayChange: totalDayChange,
    dayChangePercentage,
    holdings: enrichedHoldings,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Clear the price cache (useful for testing or manual refresh)
 */
export const clearPriceCache = () => {
  priceCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: priceCache.size,
    entries: Array.from(priceCache.keys())
  };
};
