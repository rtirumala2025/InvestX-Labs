/**
 * Market Data service for aggregating and processing market information
 */

import { getStockQuote, getMultipleStockQuotes, getHistoricalData } from './yahooFinance';

/**
 * Get comprehensive market data for a portfolio
 * @param {Array} symbols - Array of stock symbols
 * @returns {Promise<Object>} Comprehensive market data
 */
export const getPortfolioMarketData = async (symbols) => {
  try {
    const [quotes, historicalData] = await Promise.all([
      getMultipleStockQuotes(symbols),
      Promise.all(symbols.map(symbol => getHistoricalData(symbol, '1y', '1d')))
    ]);
    
    return {
      quotes,
      historicalData,
      marketSummary: generateMarketSummary(quotes),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching portfolio market data:', error);
    throw error;
  }
};

/**
 * Generate market summary from quotes
 * @param {Array} quotes - Array of stock quotes
 * @returns {Object} Market summary
 */
const generateMarketSummary = (quotes) => {
  const totalValue = quotes.reduce((sum, quote) => sum + quote.currentPrice, 0);
  const totalChange = quotes.reduce((sum, quote) => sum + quote.change, 0);
  const averageChangePercent = quotes.reduce((sum, quote) => sum + quote.changePercent, 0) / quotes.length;
  
  return {
    totalValue,
    totalChange,
    averageChangePercent,
    marketSentiment: averageChangePercent > 0 ? 'Bullish' : averageChangePercent < 0 ? 'Bearish' : 'Neutral',
    volatility: calculateMarketVolatility(quotes),
    topGainers: quotes.filter(quote => quote.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 3),
    topLosers: quotes.filter(quote => quote.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 3)
  };
};

/**
 * Calculate market volatility
 * @param {Array} quotes - Array of stock quotes
 * @returns {number} Market volatility
 */
const calculateMarketVolatility = (quotes) => {
  if (quotes.length === 0) return 0;
  
  const changes = quotes.map(quote => Math.abs(quote.changePercent));
  const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  
  return averageChange;
};

/**
 * Get market indices data
 * @returns {Promise<Object>} Market indices data
 */
export const getMarketIndices = async () => {
  try {
    const indices = ['^GSPC', '^DJI', '^IXIC', '^RUT']; // S&P 500, Dow Jones, NASDAQ, Russell 2000
    const quotes = await getMultipleStockQuotes(indices);
    
    return {
      sp500: quotes.find(quote => quote.symbol === '^GSPC'),
      dowJones: quotes.find(quote => quote.symbol === '^DJI'),
      nasdaq: quotes.find(quote => quote.symbol === '^IXIC'),
      russell2000: quotes.find(quote => quote.symbol === '^RUT'),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching market indices:', error);
    throw error;
  }
};

/**
 * Get sector performance data
 * @returns {Promise<Array>} Sector performance data
 */
export const getSectorPerformance = async () => {
  try {
    // Mock sector data - in production, this would come from a real API
    const sectors = [
      { name: 'Technology', symbol: 'XLK', change: 1.2, changePercent: 0.8 },
      { name: 'Healthcare', symbol: 'XLV', change: -0.5, changePercent: -0.3 },
      { name: 'Financial', symbol: 'XLF', change: 0.8, changePercent: 0.5 },
      { name: 'Consumer Discretionary', symbol: 'XLY', change: 0.3, changePercent: 0.2 },
      { name: 'Industrial', symbol: 'XLI', change: -0.2, changePercent: -0.1 },
      { name: 'Energy', symbol: 'XLE', change: 2.1, changePercent: 1.5 },
      { name: 'Materials', symbol: 'XLB', change: 0.6, changePercent: 0.4 },
      { name: 'Utilities', symbol: 'XLU', change: -0.1, changePercent: -0.1 },
      { name: 'Real Estate', symbol: 'XLRE', change: 0.4, changePercent: 0.3 },
      { name: 'Consumer Staples', symbol: 'XLP', change: 0.1, changePercent: 0.1 },
      { name: 'Communication Services', symbol: 'XLC', change: 0.9, changePercent: 0.6 }
    ];
    
    return sectors.sort((a, b) => b.changePercent - a.changePercent);
  } catch (error) {
    console.error('Error fetching sector performance:', error);
    throw error;
  }
};

/**
 * Get market news and sentiment
 * @returns {Promise<Array>} Market news
 */
export const getMarketNews = async () => {
  try {
    // Mock news data - in production, this would come from a news API
    const news = [
      {
        id: 1,
        title: 'Market Opens Higher on Positive Economic Data',
        summary: 'Stocks opened higher today following better-than-expected economic indicators.',
        source: 'Financial Times',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        impact: 'medium'
      },
      {
        id: 2,
        title: 'Tech Stocks Rally on Strong Earnings Reports',
        summary: 'Technology companies report strong quarterly earnings, driving sector gains.',
        source: 'Reuters',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        impact: 'high'
      },
      {
        id: 3,
        title: 'Federal Reserve Hints at Interest Rate Changes',
        summary: 'Fed officials suggest potential policy adjustments in upcoming meetings.',
        source: 'Bloomberg',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        sentiment: 'neutral',
        impact: 'high'
      }
    ];
    
    return news;
  } catch (error) {
    console.error('Error fetching market news:', error);
    throw error;
  }
};

/**
 * Get economic indicators
 * @returns {Promise<Object>} Economic indicators
 */
export const getEconomicIndicators = async () => {
  try {
    // Mock economic data - in production, this would come from a real economic data API
    const indicators = {
      gdp: {
        value: 2.1,
        change: 0.2,
        period: 'Q3 2024',
        trend: 'up'
      },
      inflation: {
        value: 3.2,
        change: -0.1,
        period: 'October 2024',
        trend: 'down'
      },
      unemployment: {
        value: 3.8,
        change: 0.1,
        period: 'October 2024',
        trend: 'up'
      },
      interestRate: {
        value: 5.25,
        change: 0.0,
        period: 'Current',
        trend: 'stable'
      }
    };
    
    return indicators;
  } catch (error) {
    console.error('Error fetching economic indicators:', error);
    throw error;
  }
};
