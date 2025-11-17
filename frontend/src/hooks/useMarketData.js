import { useState, useEffect, useCallback, useRef } from 'react';
import { useErrorHandler } from 'react-error-boundary';
import { 
  getHistoricalData, 
  searchStocks, 
  getMarketNews,
  getBatchMarketData
} from '../services/api/marketService';

// Default symbols to track
const DEFAULT_SYMBOLS = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX'];

/**
 * Custom hook for market data with caching and retry logic
 * @param {Array} symbols - Array of stock symbols to track
 * @param {Object} options - Additional options
 * @param {boolean} [options.autoFetch=true] - Whether to fetch data on mount
 * @param {boolean} [options.useCache=true] - Whether to use cached data
 * @returns {Object} Market data and operations
 */
export const useMarketData = (symbols = DEFAULT_SYMBOLS, options = {}) => {
  const { autoFetch = true, useCache = true } = options;
  const [marketData, setMarketData] = useState({});
  const [historicalData, setHistoricalData] = useState({});
  const [marketNews, setMarketNews] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const handleError = useErrorHandler();
  
  // Keep track of pending requests to avoid duplicate calls
  const pendingRequests = useRef(new Map());
  
  // Fetch market data for all symbols
  const fetchMarketData = useCallback(async (symbolsToFetch = symbols, options = {}) => {
    const { forceRefresh = false } = options;
    const cacheKey = symbolsToFetch.sort().join(',');
    
    // Skip if already loading these symbols
    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey);
    }
    
    const fetchPromise = (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch batch data for all symbols
        const batchData = await getBatchMarketData(symbolsToFetch, { 
          useCache: useCache && !forceRefresh 
        });
        
        // Update market data state
        setMarketData(prev => ({
          ...prev,
          ...batchData
        }));
        
        setLastUpdated(new Date().toISOString());
        return batchData;
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError(err.message || 'Failed to fetch market data');
        handleError(err);
        throw err;
      } finally {
        pendingRequests.current.delete(cacheKey);
        if (pendingRequests.current.size === 0) {
          setLoading(false);
        }
      }
    })();
    
    pendingRequests.current.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, [symbols, useCache, handleError]);
  
  // Fetch historical data for a symbol
  const fetchHistoricalData = useCallback(async (symbol, options = {}) => {
    const { period = '1y', interval = '1d', forceRefresh = false } = options;
    const cacheKey = `${symbol}-${period}-${interval}`;
    
    // Return cached data if available
    if (!forceRefresh && historicalData[cacheKey]) {
      return historicalData[cacheKey];
    }
    
    try {
      setLoading(true);
      
      const data = await getHistoricalData(symbol, { 
        period, 
        interval,
        useCache: useCache && !forceRefresh
      });
      
      // Update historical data state
      setHistoricalData(prev => ({
        ...prev,
        [cacheKey]: data
      }));
      
      return data;
    } catch (err) {
      console.error(`Error fetching historical data for ${symbol}:`, err);
      setError(`Failed to fetch historical data for ${symbol}`);
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [historicalData, useCache, handleError]);
  
  // Fetch market news
  const fetchMarketNews = useCallback(async (options = {}) => {
    const { limit = 10, forceRefresh = false } = options;
    
    try {
      setLoading(true);
      
      const news = await getMarketNews({ 
        limit,
        useCache: useCache && !forceRefresh
      });
      
      setMarketNews(news);
      return news;
    } catch (err) {
      console.error('Error fetching market news:', err);
      setError('Failed to fetch market news');
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [useCache, handleError]);
  
  // Search for stocks
  const searchForStocks = useCallback(async (query, options = {}) => {
    const { useCache: useCacheOption = true } = options;
    
    if (!query?.trim()) {
      return [];
    }
    
    try {
      setLoading(true);
      
      const results = await searchStocks(query, { 
        useCache: useCache && useCacheOption 
      });
      
      return results;
    } catch (err) {
      console.error('Error searching stocks:', err);
      setError('Failed to search for stocks');
      handleError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [useCache, handleError]);
  
  // Get quote for a single symbol
  const getQuote = useCallback((symbol) => {
    return marketData[symbol] || null;
  }, [marketData]);
  
  // Get quotes for multiple symbols
  const getQuotes = useCallback((symbols = []) => {
    return symbols.map(symbol => marketData[symbol] || null).filter(Boolean);
  }, [marketData]);
  
  // Get market summary
  const getMarketSummary = useCallback(() => {
    const indices = getQuotes(['^GSPC', '^DJI', '^IXIC']);
    
    if (indices.length === 0) return null;
    
    const totalChange = indices.reduce((sum, index) => sum + (index?.change || 0), 0);
    const averageChange = totalChange / indices.length;
    
    return {
      overallSentiment: averageChange > 0 ? 'Bullish' : averageChange < 0 ? 'Bearish' : 'Neutral',
      averageChange,
      indices
    };
  }, [getQuotes]);
  
  // Get top gainers
  const getTopGainers = useCallback((limit = 5) => {
    return Object.values(marketData)
      .filter(stock => stock.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, limit);
  }, [marketData]);
  
  // Get top losers
  const getTopLosers = useCallback((limit = 5) => {
    return Object.values(marketData)
      .filter(stock => stock.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, limit);
  }, [marketData]);
  
  // Get latest news
  const getLatestNews = useCallback((limit = 5) => {
    return marketNews
      .slice(0, limit)
      .map(news => ({
        ...news,
        publishedAt: new Date(news.publishedAt).toLocaleDateString()
      }));
  }, [marketNews]);
  
  // Refresh all data
  const refreshData = useCallback(async () => {
    return Promise.all([
      fetchMarketData(symbols, { forceRefresh: true }),
      fetchMarketNews({ forceRefresh: true })
    ]);
  }, [symbols, fetchMarketData, fetchMarketNews]);
  
  // Initial data fetch
  useEffect(() => {
    if (autoFetch) {
      fetchMarketData();
      fetchMarketNews();
    }
  }, [autoFetch, fetchMarketData, fetchMarketNews]);
  
  // Set up auto-refresh interval
  useEffect(() => {
    if (!autoFetch) return;
    
    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, [autoFetch, refreshData]);
  
  return {
    // State
    marketData,
    historicalData,
    marketNews,
    loading,
    error,
    lastUpdated,
    
    // Actions
    fetchMarketData,
    fetchHistoricalData,
    fetchMarketNews,
    searchForStocks,
    refreshData,
    
    // Selectors
    getQuote,
    getQuotes,
    getMarketSummary,
    getTopGainers,
    getTopLosers,
    getLatestNews,
    
    // For backward compatibility
    quotes: getQuotes(symbols),
    getQuoteBySymbol: getQuote,
    getHistoricalDataBySymbol: (symbol) => {
      const cacheKey = `${symbol}-1y-1d`;
      return historicalData[cacheKey] || null;
    },
    getTopSectors: () => [], // Not implemented in this version
    getWorstSectors: () => [], // Not implemented in this version
    getNewsBySentiment: () => [], // Not implemented in this version
    fetchQuotes: () => fetchMarketData(symbols),
    fetchStockQuote: (symbol) => fetchMarketData([symbol]).then(() => getQuote(symbol))
  };
};
