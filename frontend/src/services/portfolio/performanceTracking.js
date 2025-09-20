/**
 * Performance Tracking service for monitoring portfolio performance over time
 */

/**
 * Track portfolio performance over time
 * @param {Array} holdings - Current portfolio holdings
 * @param {Array} historicalData - Historical portfolio data
 * @returns {Object} Performance tracking data
 */
export const trackPortfolioPerformance = (holdings, historicalData = []) => {
  const currentValue = calculateCurrentValue(holdings);
  const currentDate = new Date().toISOString();
  
  // Add current data point to historical data
  const updatedHistoricalData = [
    ...historicalData,
    {
      date: currentDate,
      value: currentValue,
      holdings: holdings.length
    }
  ];
  
  return {
    currentValue,
    historicalData: updatedHistoricalData,
    performanceMetrics: calculatePerformanceMetrics(updatedHistoricalData),
    lastUpdated: currentDate
  };
};

/**
 * Calculate current portfolio value
 * @param {Array} holdings - Portfolio holdings
 * @returns {number} Current portfolio value
 */
const calculateCurrentValue = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  return holdings.reduce((total, holding) => {
    return total + (holding.shares * holding.currentPrice);
  }, 0);
};

/**
 * Calculate performance metrics from historical data
 * @param {Array} historicalData - Historical portfolio data
 * @returns {Object} Performance metrics
 */
const calculatePerformanceMetrics = (historicalData) => {
  if (historicalData.length < 2) {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      bestMonth: 0,
      worstMonth: 0
    };
  }
  
  const values = historicalData.map(point => point.value);
  const returns = calculateReturns(values);
  
  return {
    totalReturn: calculateTotalReturn(values),
    annualizedReturn: calculateAnnualizedReturn(values),
    volatility: calculateVolatility(returns),
    sharpeRatio: calculateSharpeRatio(returns),
    maxDrawdown: calculateMaxDrawdown(values),
    bestMonth: Math.max(...returns),
    worstMonth: Math.min(...returns)
  };
};

/**
 * Calculate returns from values
 * @param {Array} values - Portfolio values over time
 * @returns {Array} Returns array
 */
const calculateReturns = (values) => {
  const returns = [];
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i - 1]) / values[i - 1]);
  }
  return returns;
};

/**
 * Calculate total return
 * @param {Array} values - Portfolio values over time
 * @returns {number} Total return percentage
 */
const calculateTotalReturn = (values) => {
  if (values.length < 2) return 0;
  
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  
  return ((lastValue - firstValue) / firstValue) * 100;
};

/**
 * Calculate annualized return
 * @param {Array} values - Portfolio values over time
 * @returns {number} Annualized return percentage
 */
const calculateAnnualizedReturn = (values) => {
  if (values.length < 2) return 0;
  
  const totalReturn = calculateTotalReturn(values) / 100;
  const years = (new Date(values[values.length - 1].date) - new Date(values[0].date)) / (365 * 24 * 60 * 60 * 1000);
  
  if (years <= 0) return 0;
  
  return (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;
};

/**
 * Calculate volatility
 * @param {Array} returns - Returns array
 * @returns {number} Volatility percentage
 */
const calculateVolatility = (returns) => {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * 100;
};

/**
 * Calculate Sharpe ratio
 * @param {Array} returns - Returns array
 * @param {number} riskFreeRate - Risk-free rate (default 2%)
 * @returns {number} Sharpe ratio
 */
const calculateSharpeRatio = (returns, riskFreeRate = 0.02) => {
  if (returns.length < 2) return 0;
  
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const volatility = calculateVolatility(returns) / 100;
  
  if (volatility === 0) return 0;
  
  return (meanReturn - riskFreeRate) / volatility;
};

/**
 * Calculate maximum drawdown
 * @param {Array} values - Portfolio values over time
 * @returns {number} Maximum drawdown percentage
 */
const calculateMaxDrawdown = (values) => {
  if (values.length < 2) return 0;
  
  let maxDrawdown = 0;
  let peak = values[0];
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) {
      peak = values[i];
    } else {
      const drawdown = (peak - values[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown * 100;
};

/**
 * Compare portfolio performance to benchmark
 * @param {Array} portfolioData - Portfolio historical data
 * @param {Array} benchmarkData - Benchmark historical data
 * @returns {Object} Performance comparison
 */
export const compareToBenchmark = (portfolioData, benchmarkData) => {
  if (portfolioData.length < 2 || benchmarkData.length < 2) {
    return {
      portfolioReturn: 0,
      benchmarkReturn: 0,
      alpha: 0,
      beta: 0,
      trackingError: 0
    };
  }
  
  const portfolioReturns = calculateReturns(portfolioData.map(point => point.value));
  const benchmarkReturns = calculateReturns(benchmarkData.map(point => point.value));
  
  const portfolioReturn = calculateTotalReturn(portfolioData.map(point => point.value));
  const benchmarkReturn = calculateTotalReturn(benchmarkData.map(point => point.value));
  
  const beta = calculateBeta(portfolioReturns, benchmarkReturns);
  const alpha = portfolioReturn - (benchmarkReturn * beta);
  const trackingError = calculateTrackingError(portfolioReturns, benchmarkReturns);
  
  return {
    portfolioReturn,
    benchmarkReturn,
    alpha,
    beta,
    trackingError
  };
};

/**
 * Calculate beta
 * @param {Array} portfolioReturns - Portfolio returns
 * @param {Array} benchmarkReturns - Benchmark returns
 * @returns {number} Beta value
 */
const calculateBeta = (portfolioReturns, benchmarkReturns) => {
  if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 2) return 1;
  
  const portfolioMean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
  const benchmarkMean = benchmarkReturns.reduce((sum, ret) => sum + ret, 0) / benchmarkReturns.length;
  
  let covariance = 0;
  let benchmarkVariance = 0;
  
  for (let i = 0; i < portfolioReturns.length; i++) {
    covariance += (portfolioReturns[i] - portfolioMean) * (benchmarkReturns[i] - benchmarkMean);
    benchmarkVariance += Math.pow(benchmarkReturns[i] - benchmarkMean, 2);
  }
  
  return benchmarkVariance === 0 ? 1 : covariance / benchmarkVariance;
};

/**
 * Calculate tracking error
 * @param {Array} portfolioReturns - Portfolio returns
 * @param {Array} benchmarkReturns - Benchmark returns
 * @returns {number} Tracking error
 */
const calculateTrackingError = (portfolioReturns, benchmarkReturns) => {
  if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 2) return 0;
  
  const differences = portfolioReturns.map((ret, index) => ret - benchmarkReturns[index]);
  const meanDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  
  const variance = differences.reduce((sum, diff) => sum + Math.pow(diff - meanDifference, 2), 0) / differences.length;
  
  return Math.sqrt(variance) * 100;
};

/**
 * Generate performance report
 * @param {Object} performanceData - Performance tracking data
 * @param {Object} benchmarkData - Benchmark comparison data
 * @returns {Object} Performance report
 */
export const generatePerformanceReport = (performanceData, benchmarkData = null) => {
  const report = {
    summary: {
      totalReturn: performanceData.performanceMetrics.totalReturn,
      annualizedReturn: performanceData.performanceMetrics.annualizedReturn,
      volatility: performanceData.performanceMetrics.volatility,
      sharpeRatio: performanceData.performanceMetrics.sharpeRatio,
      maxDrawdown: performanceData.performanceMetrics.maxDrawdown
    },
    riskMetrics: {
      volatility: performanceData.performanceMetrics.volatility,
      sharpeRatio: performanceData.performanceMetrics.sharpeRatio,
      maxDrawdown: performanceData.performanceMetrics.maxDrawdown
    },
    generatedAt: new Date().toISOString()
  };
  
  if (benchmarkData) {
    report.benchmarkComparison = benchmarkData;
  }
  
  return report;
};
