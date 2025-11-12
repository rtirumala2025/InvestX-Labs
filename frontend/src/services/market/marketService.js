/**
 * Alpha Vantage Market Data Service
 * Provides real-time stock market data integration for InvestX Labs
 */

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;

// Cache for API responses to avoid excessive calls
const priceCache = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

// LocalStorage cache key
const STORAGE_CACHE_KEY = 'investx_market_cache';
const STORAGE_CACHE_DURATION = 300000; // 5 minutes for localStorage cache

/**
 * Get current stock quote from Alpha Vantage
 * @param {string} symbol - Stock symbol (e.g., 'AAPL')
 * @returns {Promise<Object|null>} Quote data or null on failure
 */
export const getQuote = async (symbol) => {
  console.log('📈 [MarketService] getQuote() called for symbol:', symbol);
  
  if (!symbol) {
    console.warn('📈 [MarketService] ❌ No symbol provided');
    return null;
  }

  if (!API_KEY) {
    console.warn('📈 [MarketService] ❌ Alpha Vantage API key not found in environment variables');
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
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
    
    console.log('📈 [MarketService] 🌐 Sending API request to Alpha Vantage:', url.replace(API_KEY, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📈 [MarketService] 📥 Raw API response received for', symbol, ':', Object.keys(data));
    
    // Check for API errors
    if (data['Error Message']) {
      console.error('📈 [MarketService] ❌ Alpha Vantage API Error:', data['Error Message']);
      return null;
    }

    if (data['Note']) {
      console.warn('📈 [MarketService] ⚠️ Alpha Vantage API Note (rate limit):', data['Note']);
      return null;
    }

    const quote = data['Global Quote'];
    if (!quote) {
      console.error('📈 [MarketService] ❌ No quote data found for symbol:', symbol);
      return null;
    }
    
    console.log('📈 [MarketService] 📊 Raw quote data for', symbol, ':', quote);

    // Transform the response to a more usable format
    const transformedQuote = {
      symbol: quote['01. symbol'],
      open: parseFloat(quote['02. open']) || 0,
      high: parseFloat(quote['03. high']) || 0,
      low: parseFloat(quote['04. low']) || 0,
      price: parseFloat(quote['05. price']) || 0,
      volume: parseInt(quote['06. volume']) || 0,
      latestTradingDay: quote['07. latest trading day'],
      previousClose: parseFloat(quote['08. previous close']) || 0,
      change: parseFloat(quote['09. change']) || 0,
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0
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

  // Limit concurrent requests to respect API rate limits
  const BATCH_SIZE = 5; // Alpha Vantage free tier: 5 calls per minute
  const results = {};
  
  console.log('📈 [MarketService] 🔄 Processing', symbols.length, 'symbols in batches of', BATCH_SIZE);
  
  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(symbols.length / BATCH_SIZE);
    
    console.log('📈 [MarketService] 📦 Processing batch', batchNumber, 'of', totalBatches, ':', batch);
    
    try {
      const promises = batch.map(symbol => getQuote(symbol));
      const batchResults = await Promise.all(promises);
      
      console.log('📈 [MarketService] ✅ Batch', batchNumber, 'completed - received', batchResults.filter(r => r !== null).length, 'valid quotes');
      
      batch.forEach((symbol, index) => {
        results[symbol] = batchResults[index];
      });

      // Add delay between batches to respect rate limits
      if (i + BATCH_SIZE < symbols.length) {
        console.log('📈 [MarketService] ⏳ Waiting 12 seconds before next batch to respect rate limits...');
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 second delay
        console.log('📈 [MarketService] ⏰ Delay complete, proceeding to next batch');
      }
    } catch (error) {
      console.error('📈 [MarketService] ❌ Error fetching batch', batchNumber, ':', error);
      // Continue with remaining batches
    }
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
    const currentPrice = quote?.price || holding.purchasePrice || 0;
    const previousClose = quote?.previousClose || holding.purchasePrice || 0;
    
    const value = holding.shares * currentPrice;
    const costBasis = holding.shares * holding.purchasePrice;
    const gainLoss = value - costBasis;
    const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    
    const dayChange = holding.shares * (currentPrice - previousClose);
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
  const dayChangePercentage = (totalValue - totalDayChange) > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0;

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
