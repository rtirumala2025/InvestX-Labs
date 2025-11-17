/**
 * Stock Prices service for real-time and historical price data
 */

import { getStockQuote, getHistoricalData } from './yahooFinance';

/**
 * Get real-time stock price
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Real-time price data
 */
export const getRealTimePrice = async (symbol) => {
  try {
    const quote = await getStockQuote(symbol);
    
    return {
      symbol: quote.symbol,
      price: quote.currentPrice,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: quote.volume,
      timestamp: quote.timestamp
    };
  } catch (error) {
    console.error('Error fetching real-time price:', error);
    throw error;
  }
};

/**
 * Get price history for a stock
 * @param {string} symbol - Stock symbol
 * @param {string} period - Time period
 * @param {string} interval - Data interval
 * @returns {Promise<Array>} Price history data
 */
export const getPriceHistory = async (symbol, period = '1y', interval = '1d') => {
  try {
    const historicalData = await getHistoricalData(symbol, period, interval);
    
    return historicalData.data.map(point => ({
      timestamp: point.timestamp,
      price: point.close,
      open: point.open,
      high: point.high,
      low: point.low,
      volume: point.volume
    }));
  } catch (error) {
    console.error('Error fetching price history:', error);
    throw error;
  }
};

/**
 * Calculate price change over a period
 * @param {string} symbol - Stock symbol
 * @param {string} period - Time period
 * @returns {Promise<Object>} Price change data
 */
export const getPriceChange = async (symbol, period = '1y') => {
  try {
    const [currentQuote, historicalData] = await Promise.all([
      getStockQuote(symbol),
      getHistoricalData(symbol, period, '1d')
    ]);
    
    const firstPrice = historicalData.data[0]?.close || currentQuote.currentPrice;
    const lastPrice = currentQuote.currentPrice;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    
    return {
      symbol,
      period,
      firstPrice,
      lastPrice,
      change,
      changePercent,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error calculating price change:', error);
    throw error;
  }
};

/**
 * Get price alerts for a stock
 * @param {string} symbol - Stock symbol
 * @param {number} targetPrice - Target price
 * @param {string} condition - Alert condition ('above', 'below', 'equals')
 * @returns {Promise<Object>} Price alert data
 */
export const createPriceAlert = async (symbol, targetPrice, condition = 'above') => {
  try {
    const currentPrice = await getRealTimePrice(symbol);
    
    const alert = {
      id: `alert_${Date.now()}`,
      symbol,
      targetPrice,
      currentPrice: currentPrice.price,
      condition,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    // In production, this would be saved to a database
    return alert;
  } catch (error) {
    console.error('Error creating price alert:', error);
    throw error;
  }
};

/**
 * Check if price alerts are triggered
 * @param {Array} alerts - Array of price alerts
 * @returns {Promise<Array>} Triggered alerts
 */
export const checkPriceAlerts = async (alerts) => {
  try {
    const triggeredAlerts = [];
    
    for (const alert of alerts) {
      if (alert.status !== 'active') continue;
      
      const currentPrice = await getRealTimePrice(alert.symbol);
      
      let isTriggered = false;
      switch (alert.condition) {
        case 'above':
          isTriggered = currentPrice.price > alert.targetPrice;
          break;
        case 'below':
          isTriggered = currentPrice.price < alert.targetPrice;
          break;
        case 'equals':
          isTriggered = Math.abs(currentPrice.price - alert.targetPrice) < 0.01;
          break;
        default:
          isTriggered = false;
          break;
      }
      
      if (isTriggered) {
        triggeredAlerts.push({
          ...alert,
          triggeredAt: new Date().toISOString(),
          triggeredPrice: currentPrice.price
        });
      }
    }
    
    return triggeredAlerts;
  } catch (error) {
    console.error('Error checking price alerts:', error);
    throw error;
  }
};

/**
 * Get price statistics for a stock
 * @param {string} symbol - Stock symbol
 * @param {string} period - Time period
 * @returns {Promise<Object>} Price statistics
 */
export const getPriceStatistics = async (symbol, period = '1y') => {
  try {
    const historicalData = await getHistoricalData(symbol, period, '1d');
    const prices = historicalData.data.map(point => point.close);
    
    const stats = {
      symbol,
      period,
      currentPrice: prices[prices.length - 1],
      high: Math.max(...prices),
      low: Math.min(...prices),
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      volatility: calculateVolatility(prices),
      trend: calculateTrend(prices),
      timestamp: new Date().toISOString()
    };
    
    return stats;
  } catch (error) {
    console.error('Error calculating price statistics:', error);
    throw error;
  }
};

/**
 * Calculate price volatility
 * @param {Array} prices - Array of prices
 * @returns {number} Volatility percentage
 */
const calculateVolatility = (prices) => {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const averageReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * 100; // Convert to percentage
};

/**
 * Calculate price trend
 * @param {Array} prices - Array of prices
 * @returns {string} Trend direction
 */
const calculateTrend = (prices) => {
  if (prices.length < 2) return 'stable';
  
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  if (changePercent > 5) return 'upward';
  if (changePercent < -5) return 'downward';
  return 'stable';
};
