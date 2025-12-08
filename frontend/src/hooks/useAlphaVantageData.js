import { useState, useEffect, useCallback, useMemo } from 'react';
import { getQuote, getMultipleQuotes, calculateLivePortfolioMetrics } from '../services/market/marketService';
import { getBatchMarketData } from '../services/api/marketService';
import { useApp } from '../contexts/AppContext';

/**
 * useAlphaVantageData
 *
 * Handles retrieval of live market pricing for a set of holdings using the Alpha Vantage API,
 * automatically falls back to cached Supabase batch quotes when the upstream API is unavailable,
 * and derives portfolio-level metrics so dashboard/portfolio views stay reactive.
 *
 * @param {Array} holdings - Portfolio holdings used to determine which symbols to quote.
 * @returns {Object} Market data, computed metrics, loading/error state, and refresh helpers.
 */
export const useAlphaVantageData = (holdings = []) => {
  console.log('🚀 [useAlphaVantageData] Hook initialized with', holdings.length, 'holdings');
  
  const { queueToast } = useApp();

  const [marketData, setMarketData] = useState({});
  const [portfolioMetrics, setPortfolioMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const uniqueSymbols = useMemo(() => {
    const symbols = holdings.map((holding) => holding.symbol).filter(Boolean);
    const deduped = [...new Set(symbols)];
    console.log('🚀 [useAlphaVantageData] Extracted symbols:', deduped);
    return deduped;
  }, [holdings]);

  console.log('🚀 [useAlphaVantageData] Holdings snapshot:', holdings.length);

  // Fetch market data for portfolio symbols
  const fetchMarketData = useCallback(async () => {
    console.log('🚀 [useAlphaVantageData] fetchMarketData triggered for', uniqueSymbols.length, 'symbols');
    
    if (uniqueSymbols.length === 0) {
      console.log('🚀 [useAlphaVantageData] ⚠️ No symbols to fetch - empty portfolio detected');
      setMarketData({});
      setPortfolioMetrics(calculateLivePortfolioMetrics([], {}));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 [useAlphaVantageData] 📶 Fetching market data for symbols:', uniqueSymbols);

      const quotes = await getMultipleQuotes(uniqueSymbols);
      
      console.log('🚀 [useAlphaVantageData] 📥 Market data received:', Object.keys(quotes).length, 'quotes');
      console.log('🚀 [useAlphaVantageData] 📊 Quote summary:', Object.entries(quotes).map(([symbol, quote]) => 
        `${symbol}: $${quote?.price || 'N/A'}`
      ));
      
      setMarketData(quotes);

      // Calculate portfolio metrics with live data
      console.log('🚀 [useAlphaVantageData] 🧮 Calculating live portfolio metrics...');
      const metrics = calculateLivePortfolioMetrics(holdings, quotes);
      
      console.log('🚀 [useAlphaVantageData] ✅ Live metrics calculated:', {
        totalValue: metrics.totalValue,
        totalGainLoss: metrics.totalGainLoss,
        dayChange: metrics.dayChange,
        holdingsCount: metrics.holdings.length
      });
      
      setPortfolioMetrics(metrics);
      setLastUpdated(new Date().toISOString());

    } catch (err) {
      console.error('🚀 [useAlphaVantageData] ❌ Error fetching market data:', err);
      
      // Provide better error messages for network errors
      let errorMessage = err.message || 'Failed to fetch market data';
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        errorMessage = 'Network error: Unable to fetch market data. Using cached data if available.';
      } else if (err.message?.includes('API key')) {
        errorMessage = 'API key error: Please check your Alpha Vantage API key configuration.';
      }
      
      setError(errorMessage);

      try {
        console.log('🚀 [useAlphaVantageData] 🔄 Attempting Supabase fallback for market data.');
        const fallbackQuotes = await getBatchMarketData(uniqueSymbols);

        if (fallbackQuotes && Object.keys(fallbackQuotes).length > 0) {
          setMarketData(fallbackQuotes);
          const fallbackMetrics = calculateLivePortfolioMetrics(holdings, fallbackQuotes);
          setPortfolioMetrics(fallbackMetrics);
          setLastUpdated(new Date().toISOString());
          queueToast('Live price feed unavailable. Showing cached market data.', 'warning');
          return;
        }
      } catch (fallbackError) {
        console.error('🚀 [useAlphaVantageData] ❌ Supabase fallback failed:', fallbackError);
      }

      console.log('🚀 [useAlphaVantageData] 🔄 Using static portfolio calculations due to market data failure');
      const fallbackMetrics = calculateLivePortfolioMetrics(holdings, {});
      setPortfolioMetrics(fallbackMetrics);
    } finally {
      setLoading(false);
    }
  }, [uniqueSymbols, holdings, queueToast]);

  // Fetch single quote
  const fetchQuote = useCallback(async (symbol) => {
    try {
      setLoading(true);
      setError(null);

      const quote = await getQuote(symbol);
      if (quote) {
        setMarketData(prev => ({
          ...prev,
          [symbol]: quote
        }));
      }
      return quote;
    } catch (err) {
      console.error('Error fetching quote for', symbol, ':', err);
      setError(err.message || `Failed to fetch quote for ${symbol}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch data when holdings change
  useEffect(() => {
    console.log('🚀 [useAlphaVantageData] 🔄 Holdings changed, triggering market data fetch');
    fetchMarketData();
  }, [fetchMarketData]);

  // Refresh data manually
  const refreshData = useCallback(() => {
    return fetchMarketData();
  }, [fetchMarketData]);

  // Get quote for specific symbol
  const getQuoteBySymbol = useCallback((symbol) => {
    return marketData[symbol] || null;
  }, [marketData]);

  // Check if data is stale (older than 5 minutes)
  const isDataStale = useCallback(() => {
    if (!lastUpdated) return true;
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const stale = new Date(lastUpdated).getTime() < fiveMinutesAgo;
    if (stale) {
      console.log('🚀 [useAlphaVantageData] ⏰ Data is stale - last updated:', lastUpdated);
    }
    return stale;
  }, [lastUpdated]);

  return {
    marketData,
    portfolioMetrics,
    loading,
    error,
    lastUpdated,
    fetchMarketData,
    fetchQuote,
    refreshData,
    getQuoteBySymbol,
    isDataStale,
    hasData: Object.keys(marketData).length > 0
  };
};
