import { 
  getDocument, 
  getDocuments, 
  addDocument, 
  updateDocument 
} from './firestore';

/**
 * Market Data Service
 * Manages market data and stock information
 */

/**
 * Get current market data
 * @returns {Promise<Object|null>} Current market data
 */
export const getCurrentMarketData = async () => {
  try {
    return await getDocument('market_data', 'current');
  } catch (error) {
    console.error('Error getting current market data:', error);
    throw error;
  }
};

/**
 * Get stock data by symbol
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object|null>} Stock data
 */
export const getStockData = async (symbol) => {
  try {
    const marketData = await getCurrentMarketData();
    return marketData?.stocks?.[symbol] || null;
  } catch (error) {
    console.error('Error getting stock data:', error);
    throw error;
  }
};

/**
 * Get multiple stocks data
 * @param {Array<string>} symbols - Array of stock symbols
 * @returns {Promise<Object>} Object with stock data
 */
export const getMultipleStocksData = async (symbols) => {
  try {
    const marketData = await getCurrentMarketData();
    const stocks = marketData?.stocks || {};
    
    const result = {};
    symbols.forEach(symbol => {
      result[symbol] = stocks[symbol] || null;
    });
    
    return result;
  } catch (error) {
    console.error('Error getting multiple stocks data:', error);
    throw error;
  }
};

/**
 * Search stocks by name or symbol
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching stocks
 */
export const searchStocks = async (query) => {
  try {
    const marketData = await getCurrentMarketData();
    const stocks = marketData?.stocks || {};
    
    const searchTerm = query.toLowerCase();
    const results = [];
    
    Object.values(stocks).forEach(stock => {
      if (
        stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm)
      ) {
        results.push(stock);
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw error;
  }
};

/**
 * Get market indices data
 * @returns {Promise<Object|null>} Market indices data
 */
export const getMarketIndices = async () => {
  try {
    const marketData = await getCurrentMarketData();
    return marketData?.indices || null;
  } catch (error) {
    console.error('Error getting market indices:', error);
    throw error;
  }
};

/**
 * Get market news
 * @param {number} limit - Number of news items to return
 * @returns {Promise<Array>} Array of news items
 */
export const getMarketNews = async (limit = 10) => {
  try {
    const news = await getDocuments('market_news');
    return news
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting market news:', error);
    throw error;
  }
};

/**
 * Get stock price history
 * @param {string} symbol - Stock symbol
 * @param {string} period - Time period (1d, 1w, 1m, 3m, 1y)
 * @returns {Promise<Array>} Array of price data points
 */
export const getStockPriceHistory = async (symbol, period = '1m') => {
  try {
    const history = await getDocument('price_history', `${symbol}_${period}`);
    return history?.data || [];
  } catch (error) {
    console.error('Error getting stock price history:', error);
    throw error;
  }
};

/**
 * Get trending stocks
 * @param {number} limit - Number of trending stocks to return
 * @returns {Promise<Array>} Array of trending stocks
 */
export const getTrendingStocks = async (limit = 10) => {
  try {
    const marketData = await getCurrentMarketData();
    const stocks = marketData?.stocks || {};
    
    // Sort by volume and return top stocks
    const trending = Object.values(stocks)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
    
    return trending;
  } catch (error) {
    console.error('Error getting trending stocks:', error);
    throw error;
  }
};
