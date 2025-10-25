import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getBatchMarketData } from '../services/api/marketService';
import { useErrorBoundary } from 'react-error-boundary';

const MarketContext = createContext();

// Default watchlist symbols
const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NFLX', 'NVDA'];

// Refresh interval in milliseconds (5 minutes)
const REFRESH_INTERVAL = 5 * 60 * 1000;

export const MarketProvider = ({ children }) => {
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
  const { showBoundary } = useErrorBoundary();

  const fetchMarketData = useCallback(async (symbols = watchlist) => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have symbols to fetch
      const symbolsToFetch = symbols.length > 0 ? symbols : DEFAULT_WATCHLIST;
      
      const data = await getBatchMarketData(symbolsToFetch, {
        useCache: true,
        cacheTtl: REFRESH_INTERVAL / 2 // Cache for half the refresh interval
      });
      
      setMarketData(prev => ({
        ...prev,
        ...data
      }));
      
      setLastUpdated(new Date().toISOString());
      return data;
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err.message || 'Failed to fetch market data');
      showBoundary(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [watchlist, showBoundary]);

  // Initial data fetch
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Set up auto-refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchMarketData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchMarketData]);

  // Add a symbol to the watchlist
  const addToWatchlist = useCallback((symbol) => {
    const upperSymbol = symbol.toUpperCase();
    if (!watchlist.includes(upperSymbol)) {
      const newWatchlist = [...watchlist, upperSymbol];
      setWatchlist(newWatchlist);
      fetchMarketData(newWatchlist);
    }
  }, [watchlist, fetchMarketData]);

  // Remove a symbol from the watchlist
  const removeFromWatchlist = useCallback((symbol) => {
    const newWatchlist = watchlist.filter(s => s !== symbol);
    if (newWatchlist.length > 0) {
      setWatchlist(newWatchlist);
      fetchMarketData(newWatchlist);
    }
  }, [watchlist, fetchMarketData]);

  // Get data for a specific symbol
  const getSymbolData = useCallback((symbol) => {
    return marketData[symbol] || null;
  }, [marketData]);

  return (
    <MarketContext.Provider
      value={{
        marketData,
        loading,
        error,
        lastUpdated,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        getSymbolData,
        refresh: fetchMarketData,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarketData = () => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarketData must be used within a MarketProvider');
  }
  return context;
};

export default MarketContext;
