/**
 * Yahoo Finance API service for market data
 * Note: This is a placeholder implementation. In production, you would use
 * a proper financial data API like Alpha Vantage, IEX Cloud, or Yahoo Finance API
 */

const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

/**
 * Get stock quote data from Yahoo Finance
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Stock quote data
 */
export const getStockQuote = async (symbol) => {
  try {
    // This is a mock implementation
    // In production, you would make actual API calls to Yahoo Finance or another data provider
    
    const mockData = {
      symbol: symbol,
      companyName: `${symbol} Inc.`,
      currentPrice: Math.random() * 200 + 50,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
      marketCap: Math.floor(Math.random() * 1000000000),
      pe: Math.random() * 30 + 10,
      high52Week: Math.random() * 250 + 100,
      low52Week: Math.random() * 100 + 20,
      timestamp: new Date().toISOString()
    };
    
    return mockData;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    throw error;
  }
};

/**
 * Get multiple stock quotes
 * @param {Array} symbols - Array of stock symbols
 * @returns {Promise<Array>} Array of stock quote data
 */
export const getMultipleStockQuotes = async (symbols) => {
  try {
    const promises = symbols.map(symbol => getStockQuote(symbol));
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('Error fetching multiple stock quotes:', error);
    throw error;
  }
};

/**
 * Get historical stock data
 * @param {string} symbol - Stock symbol
 * @param {string} period - Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
 * @param {string} interval - Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
 * @returns {Promise<Object>} Historical data
 */
export const getHistoricalData = async (symbol, period = '1y', interval = '1d') => {
  try {
    // Mock historical data
    const mockData = {
      symbol: symbol,
      period: period,
      interval: interval,
      data: generateMockHistoricalData(period, interval)
    };
    
    return mockData;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

/**
 * Generate mock historical data
 * @param {string} period - Time period
 * @param {string} interval - Data interval
 * @returns {Array} Mock historical data points
 */
const generateMockHistoricalData = (period, interval) => {
  const dataPoints = [];
  const basePrice = 100;
  let currentPrice = basePrice;
  
  // Calculate number of data points based on period and interval
  const intervalsPerDay = getIntervalsPerDay(interval);
  const days = getDaysFromPeriod(period);
  const totalPoints = days * intervalsPerDay;
  
  for (let i = 0; i < totalPoints; i++) {
    const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
    currentPrice += change;
    
    dataPoints.push({
      timestamp: new Date(Date.now() - (totalPoints - i) * getIntervalMs(interval)).toISOString(),
      open: currentPrice,
      high: currentPrice + Math.random() * 2,
      low: currentPrice - Math.random() * 2,
      close: currentPrice,
      volume: Math.floor(Math.random() * 1000000)
    });
  }
  
  return dataPoints;
};

/**
 * Get intervals per day based on interval
 * @param {string} interval - Data interval
 * @returns {number} Intervals per day
 */
const getIntervalsPerDay = (interval) => {
  const intervals = {
    '1m': 1440,
    '2m': 720,
    '5m': 288,
    '15m': 96,
    '30m': 48,
    '60m': 24,
    '90m': 16,
    '1h': 24,
    '1d': 1,
    '5d': 0.2,
    '1wk': 0.14,
    '1mo': 0.033
  };
  
  return intervals[interval] || 1;
};

/**
 * Get days from period
 * @param {string} period - Time period
 * @returns {number} Number of days
 */
const getDaysFromPeriod = (period) => {
  const periods = {
    '1d': 1,
    '5d': 5,
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825,
    '10y': 3650,
    'ytd': 365,
    'max': 3650
  };
  
  return periods[period] || 365;
};

/**
 * Get interval in milliseconds
 * @param {string} interval - Data interval
 * @returns {number} Interval in milliseconds
 */
const getIntervalMs = (interval) => {
  const intervals = {
    '1m': 60 * 1000,
    '2m': 2 * 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '60m': 60 * 60 * 1000,
    '90m': 90 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '5d': 5 * 24 * 60 * 60 * 1000,
    '1wk': 7 * 24 * 60 * 60 * 1000,
    '1mo': 30 * 24 * 60 * 60 * 1000
  };
  
  return intervals[interval] || 24 * 60 * 60 * 1000;
};

/**
 * Search for stocks by symbol or company name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
export const searchStocks = async (query) => {
  try {
    // Mock search results
    const mockResults = [
      {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        exchange: 'NASDAQ',
        type: 'EQUITY'
      },
      {
        symbol: 'GOOGL',
        companyName: 'Alphabet Inc.',
        exchange: 'NASDAQ',
        type: 'EQUITY'
      },
      {
        symbol: 'MSFT',
        companyName: 'Microsoft Corporation',
        exchange: 'NASDAQ',
        type: 'EQUITY'
      }
    ];
    
    // Filter results based on query
    const filteredResults = mockResults.filter(result =>
      result.symbol.toLowerCase().includes(query.toLowerCase()) ||
      result.companyName.toLowerCase().includes(query.toLowerCase())
    );
    
    return filteredResults;
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw error;
  }
};
