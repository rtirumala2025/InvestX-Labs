import { useState, useEffect } from 'react';
import { getStockQuote, getMultipleStockQuotes, getHistoricalData, searchStocks } from '../services/market/yahooFinance';
import { getMarketIndices, getSectorPerformance, getMarketNews, getEconomicIndicators } from '../services/market/marketData';

/**
 * Custom hook for market data
 * @param {Array} symbols - Array of stock symbols to track
 * @returns {Object} Market data and operations
 */
export const useMarketData = (symbols = []) => {
  const [quotes, setQuotes] = useState([]);
  const [historicalData, setHistoricalData] = useState({});
  const [marketIndices, setMarketIndices] = useState(null);
  const [sectorPerformance, setSectorPerformance] = useState([]);
  const [marketNews, setMarketNews] = useState([]);
  const [economicIndicators, setEconomicIndicators] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch quotes for specified symbols
  useEffect(() => {
    if (symbols.length > 0) {
      fetchQuotes();
    }
  }, [symbols]);

  // Fetch market data on component mount
  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const quotesData = await getMultipleStockQuotes(symbols);
      setQuotes(quotesData);
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [indices, sectors, news, indicators] = await Promise.all([
        getMarketIndices(),
        getSectorPerformance(),
        getMarketNews(),
        getEconomicIndicators()
      ]);
      
      setMarketIndices(indices);
      setSectorPerformance(sectors);
      setMarketNews(news);
      setEconomicIndicators(indicators);
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching market data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async (symbol, period = '1y', interval = '1d') => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getHistoricalData(symbol, period, interval);
      setHistoricalData(prev => ({
        ...prev,
        [symbol]: data
      }));
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchStockQuote = async (symbol) => {
    try {
      setLoading(true);
      setError(null);
      
      const quote = await getStockQuote(symbol);
      
      // Update quotes array
      setQuotes(prev => {
        const existingIndex = prev.findIndex(q => q.symbol === symbol);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = quote;
          return updated;
        } else {
          return [...prev, quote];
        }
      });
      
      return quote;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchForStocks = async (query) => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await searchStocks(query);
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getQuoteBySymbol = (symbol) => {
    return quotes.find(quote => quote.symbol === symbol);
  };

  const getHistoricalDataBySymbol = (symbol) => {
    return historicalData[symbol] || null;
  };

  const refreshData = async () => {
    await Promise.all([
      fetchQuotes(),
      fetchMarketData()
    ]);
  };

  const getMarketSummary = () => {
    if (!marketIndices) return null;
    
    const indices = [marketIndices.sp500, marketIndices.dowJones, marketIndices.nasdaq];
    const totalChange = indices.reduce((sum, index) => sum + (index?.change || 0), 0);
    const averageChange = totalChange / indices.length;
    
    return {
      overallSentiment: averageChange > 0 ? 'Bullish' : averageChange < 0 ? 'Bearish' : 'Neutral',
      averageChange,
      indices
    };
  };

  const getTopSectors = (limit = 5) => {
    return sectorPerformance
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, limit);
  };

  const getWorstSectors = (limit = 5) => {
    return sectorPerformance
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, limit);
  };

  const getLatestNews = (limit = 5) => {
    return marketNews
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  };

  const getNewsBySentiment = (sentiment) => {
    return marketNews.filter(news => news.sentiment === sentiment);
  };

  return {
    quotes,
    historicalData,
    marketIndices,
    sectorPerformance,
    marketNews,
    economicIndicators,
    loading,
    error,
    fetchQuotes,
    fetchMarketData,
    fetchHistoricalData,
    fetchStockQuote,
    searchForStocks,
    getQuoteBySymbol,
    getHistoricalDataBySymbol,
    refreshData,
    getMarketSummary,
    getTopSectors,
    getWorstSectors,
    getLatestNews,
    getNewsBySentiment
  };
};
