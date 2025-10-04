import { useState, useEffect, useCallback } from 'react';
import { getQuote, getMultipleQuotes, calculateLivePortfolioMetrics } from '../services/market/marketService';

/**
 * Custom hook for Alpha Vantage market data integration
 * @param {Array} holdings - User's portfolio holdings
 * @returns {Object} Market data and portfolio calculations
 */
export const useAlphaVantageData = (holdings = []) => {
  console.log('🚀 [useAlphaVantageData] Hook initialized with', holdings.length, 'holdings');
  
  const [marketData, setMarketData] = useState({});
  const [portfolioMetrics, setPortfolioMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Extract unique symbols from holdings
  const symbols = holdings.map(holding => holding.symbol).filter(Boolean);
  const uniqueSymbols = [...new Set(symbols)];
  
  console.log('🚀 [useAlphaVantageData] Extracted symbols:', uniqueSymbols);

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
      setError(err.message || 'Failed to fetch market data');
      
      // Fallback to static calculations if API fails
      console.log('🚀 [useAlphaVantageData] 🔄 Using fallback static calculations due to API error');
      const fallbackMetrics = calculateLivePortfolioMetrics(holdings, {});
      setPortfolioMetrics(fallbackMetrics);
    } finally {
      setLoading(false);
    }
  }, [uniqueSymbols.join(','), holdings.length]);

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
