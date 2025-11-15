/**
 * Portfolio Calculations service for computing portfolio metrics and analytics
 */

/**
 * Calculate total portfolio value
 * @param {Array} holdings - Portfolio holdings
 * @returns {number} Total portfolio value
 */
export const calculateTotalValue = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  return holdings.reduce((total, holding) => {
    return total + (holding.shares * holding.currentPrice);
  }, 0);
};

/**
 * Calculate total cost basis
 * @param {Array} holdings - Portfolio holdings
 * @returns {number} Total cost basis
 */
export const calculateTotalCostBasis = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  return holdings.reduce((total, holding) => {
    return total + (holding.shares * holding.purchasePrice);
  }, 0);
};

/**
 * Calculate total gain/loss
 * @param {Array} holdings - Portfolio holdings
 * @returns {number} Total gain/loss
 */
export const calculateTotalGainLoss = (holdings) => {
  const totalValue = calculateTotalValue(holdings);
  const totalCostBasis = calculateTotalCostBasis(holdings);
  
  return totalValue - totalCostBasis;
};

/**
 * Calculate total gain/loss percentage
 * @param {Array} holdings - Portfolio holdings
 * @returns {number} Total gain/loss percentage
 */
export const calculateTotalGainLossPercentage = (holdings) => {
  const totalCostBasis = calculateTotalCostBasis(holdings);
  if (totalCostBasis === 0) return 0;
  
  const totalGainLoss = calculateTotalGainLoss(holdings);
  return (totalGainLoss / totalCostBasis) * 100;
};

/**
 * Calculate portfolio allocation by sector
 * @param {Array} holdings - Portfolio holdings
 * @returns {Object} Sector allocation percentages
 */
export const calculateSectorAllocation = (holdings) => {
  if (!holdings || holdings.length === 0) return {};
  
  const totalValue = calculateTotalValue(holdings);
  const sectorValues = {};
  
  holdings.forEach(holding => {
    const sector = holding.sector || 'Unknown';
    const value = holding.shares * holding.currentPrice;
    
    if (sectorValues[sector]) {
      sectorValues[sector] += value;
    } else {
      sectorValues[sector] = value;
    }
  });
  
  const sectorAllocation = {};
  Object.keys(sectorValues).forEach(sector => {
    sectorAllocation[sector] = (sectorValues[sector] / totalValue) * 100;
  });
  
  return sectorAllocation;
};

/**
 * Calculate portfolio allocation by asset type
 * @param {Array} holdings - Portfolio holdings
 * @returns {Object} Asset type allocation percentages
 */
export const calculateAssetTypeAllocation = (holdings) => {
  if (!holdings || holdings.length === 0) return {};
  
  const totalValue = calculateTotalValue(holdings);
  const assetTypeValues = {};
  
  holdings.forEach(holding => {
    const assetType = holding.assetType || 'Stock';
    const value = holding.shares * holding.currentPrice;
    
    if (assetTypeValues[assetType]) {
      assetTypeValues[assetType] += value;
    } else {
      assetTypeValues[assetType] = value;
    }
  });
  
  const assetTypeAllocation = {};
  Object.keys(assetTypeValues).forEach(assetType => {
    assetTypeAllocation[assetType] = (assetTypeValues[assetType] / totalValue) * 100;
  });
  
  return assetTypeAllocation;
};

/**
 * Calculate portfolio beta
 * @param {Array} holdings - Portfolio holdings
 * @param {Object} marketData - Market data with beta values
 * @returns {number} Portfolio beta
 */
export const calculatePortfolioBeta = (holdings, marketData) => {
  if (!holdings || holdings.length === 0) return 1;
  
  const totalValue = calculateTotalValue(holdings);
  let weightedBeta = 0;
  
  holdings.forEach(holding => {
    const weight = (holding.shares * holding.currentPrice) / totalValue;
    const beta = marketData[holding.symbol]?.beta || 1;
    weightedBeta += weight * beta;
  });
  
  return weightedBeta;
};

/**
 * Calculate portfolio Sharpe ratio
 * @param {Array} holdings - Portfolio holdings
 * @param {number} riskFreeRate - Risk-free rate (default 2%)
 * @param {number} timePeriod - Time period in years (default 1)
 * @returns {number} Sharpe ratio
 */
export const calculateSharpeRatio = (holdings, riskFreeRate = 0.02, timePeriod = 1) => {
  if (!holdings || holdings.length === 0) return 0;
  
  const totalReturn = calculateTotalGainLossPercentage(holdings) / 100;
  const portfolioVolatility = calculatePortfolioVolatility(holdings);
  
  if (portfolioVolatility === 0) return 0;
  
  return (totalReturn - riskFreeRate) / portfolioVolatility;
};

/**
 * Calculate portfolio volatility
 * @param {Array} holdings - Portfolio holdings
 * @returns {number} Portfolio volatility
 */
export const calculatePortfolioVolatility = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  // Simplified volatility calculation
  // In production, you would use historical returns data
  const totalValue = calculateTotalValue(holdings);
  let weightedVolatility = 0;
  
  holdings.forEach(holding => {
    const weight = (holding.shares * holding.currentPrice) / totalValue;
    const volatility = holding.volatility || 0.2; // Default 20% volatility
    weightedVolatility += weight * volatility;
  });
  
  return weightedVolatility;
};

/**
 * Calculate portfolio correlation
 * @param {Array} holdings - Portfolio holdings
 * @param {Object} correlationMatrix - Correlation matrix data
 * @returns {number} Average portfolio correlation
 */
export const calculatePortfolioCorrelation = (holdings, correlationMatrix) => {
  if (!holdings || holdings.length < 2) return 0;
  
  let totalCorrelation = 0;
  let correlationCount = 0;
  
  for (let i = 0; i < holdings.length; i++) {
    for (let j = i + 1; j < holdings.length; j++) {
      const symbol1 = holdings[i].symbol;
      const symbol2 = holdings[j].symbol;
      
      if (correlationMatrix[symbol1] && correlationMatrix[symbol1][symbol2]) {
        totalCorrelation += correlationMatrix[symbol1][symbol2];
        correlationCount++;
      }
    }
  }
  
  return correlationCount > 0 ? totalCorrelation / correlationCount : 0;
};

/**
 * Calculate portfolio performance metrics
 * @param {Array} holdings - Portfolio holdings
 * @param {Object} marketData - Market data
 * @returns {Object} Performance metrics
 */
export const calculatePerformanceMetrics = (holdings, marketData = {}, transactions = [], historicalData = []) => {
  const totalValue = calculateTotalValue(holdings);
  const totalCostBasis = calculateTotalCostBasis(holdings);
  const totalGainLoss = calculateTotalGainLoss(holdings);
  const totalGainLossPercentage = calculateTotalGainLossPercentage(holdings);
  
  // Calculate ROI
  const roi = calculateROI(holdings, transactions);
  
  // Calculate benchmark comparison
  const benchmarkComparison = compareToBenchmark(holdings, totalGainLossPercentage);
  
  // Calculate historical performance if data available
  const historicalPerformance = calculateHistoricalPerformance(historicalData);
  
  // Generate sector allocation chart data
  const sectorAllocation = calculateSectorAllocation(holdings);
  const sectorChartData = generateSectorAllocationChartData(sectorAllocation);
  
  return {
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercentage,
    roi: roi.roi,
    roiPercentage: roi.roiPercentage,
    annualizedReturn: roi.annualizedReturn,
    sectorAllocation,
    sectorChartData,
    assetTypeAllocation: calculateAssetTypeAllocation(holdings),
    portfolioBeta: calculatePortfolioBeta(holdings, marketData),
    sharpeRatio: calculateSharpeRatio(holdings),
    volatility: calculatePortfolioVolatility(holdings),
    diversificationScore: calculateDiversificationScore(holdings),
    benchmarkComparison,
    historicalPerformance,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Calculate diversification score
 * @param {Array} holdings - Portfolio holdings
 * @returns {number} Diversification score (0-100)
 */
export const calculateDiversificationScore = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  const sectors = new Set(holdings.map(holding => holding.sector));
  const assetTypes = new Set(holdings.map(holding => holding.assetType));
  
  const sectorScore = Math.min(50, sectors.size * 10);
  const assetTypeScore = Math.min(30, assetTypes.size * 15);
  const holdingCountScore = Math.min(20, holdings.length * 2);
  
  return sectorScore + assetTypeScore + holdingCountScore;
};

/**
 * Calculate ROI (Return on Investment) with time-weighted returns
 * @param {Array} holdings - Portfolio holdings
 * @param {Array} transactions - Transaction history
 * @param {Date} startDate - Start date for ROI calculation
 * @returns {Object} ROI metrics
 */
export const calculateROI = (holdings, transactions = [], startDate = null) => {
  if (!holdings || holdings.length === 0) {
    return {
      roi: 0,
      roiPercentage: 0,
      timeWeightedReturn: 0,
      annualizedReturn: 0
    };
  }

  const totalValue = calculateTotalValue(holdings);
  const totalCostBasis = calculateTotalCostBasis(holdings);
  const totalGainLoss = totalValue - totalCostBasis;
  const roiPercentage = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  // Calculate time-weighted return if we have transaction history
  let timeWeightedReturn = 0;
  let annualizedReturn = 0;

  if (transactions.length > 0 && startDate) {
    const sortedTransactions = [...transactions]
      .filter(tx => tx.transaction_date)
      .sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

    if (sortedTransactions.length > 0) {
      const firstDate = new Date(sortedTransactions[0].transaction_date);
      const lastDate = new Date();
      const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
      const years = daysDiff / 365;

      if (years > 0 && totalCostBasis > 0) {
        // Simple annualized return calculation
        const totalReturn = totalValue / totalCostBasis;
        annualizedReturn = (Math.pow(totalReturn, 1 / years) - 1) * 100;
        timeWeightedReturn = roiPercentage;
      }
    }
  }

  return {
    roi: totalGainLoss,
    roiPercentage,
    timeWeightedReturn,
    annualizedReturn: annualizedReturn || roiPercentage
  };
};

/**
 * Compare portfolio to benchmark (S&P 500)
 * @param {Array} holdings - Portfolio holdings
 * @param {number} portfolioReturn - Portfolio return percentage
 * @param {number} benchmarkReturn - Benchmark return percentage (default S&P 500 ~10% annual)
 * @returns {Object} Benchmark comparison
 */
export const compareToBenchmark = (holdings, portfolioReturn, benchmarkReturn = 10) => {
  if (!holdings || holdings.length === 0) {
    return {
      portfolioReturn: 0,
      benchmarkReturn,
      outperformance: 0,
      alpha: 0,
      relativePerformance: 'neutral'
    };
  }

  const outperformance = portfolioReturn - benchmarkReturn;
  const alpha = outperformance; // Simplified alpha calculation
  const relativePerformance = outperformance > 2 ? 'outperforming' : outperformance < -2 ? 'underperforming' : 'neutral';

  return {
    portfolioReturn,
    benchmarkReturn,
    outperformance,
    alpha,
    relativePerformance,
    benchmarkName: 'S&P 500'
  };
};

/**
 * Calculate historical performance metrics
 * @param {Array} historicalData - Historical portfolio value data points
 * @returns {Object} Historical performance metrics
 */
export const calculateHistoricalPerformance = (historicalData = []) => {
  if (!historicalData || historicalData.length < 2) {
    return {
      totalReturn: 0,
      bestMonth: 0,
      worstMonth: 0,
      averageMonthlyReturn: 0,
      volatility: 0,
      maxDrawdown: 0
    };
  }

  const sortedData = [...historicalData]
    .filter(point => point.date && point.value)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sortedData.length < 2) {
    return {
      totalReturn: 0,
      bestMonth: 0,
      worstMonth: 0,
      averageMonthlyReturn: 0,
      volatility: 0,
      maxDrawdown: 0
    };
  }

  const firstValue = sortedData[0].value;
  const lastValue = sortedData[sortedData.length - 1].value;
  const totalReturn = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  // Calculate monthly returns
  const monthlyReturns = [];
  let peak = firstValue;
  let maxDrawdown = 0;

  for (let i = 1; i < sortedData.length; i++) {
    const prevValue = sortedData[i - 1].value;
    const currValue = sortedData[i].value;
    const monthlyReturn = prevValue > 0 ? ((currValue - prevValue) / prevValue) * 100 : 0;
    monthlyReturns.push(monthlyReturn);

    // Track peak and drawdown
    if (currValue > peak) {
      peak = currValue;
    }
    const drawdown = peak > 0 ? ((currValue - peak) / peak) * 100 : 0;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const bestMonth = monthlyReturns.length > 0 ? Math.max(...monthlyReturns) : 0;
  const worstMonth = monthlyReturns.length > 0 ? Math.min(...monthlyReturns) : 0;
  const averageMonthlyReturn = monthlyReturns.length > 0
    ? monthlyReturns.reduce((sum, ret) => sum + ret, 0) / monthlyReturns.length
    : 0;

  // Calculate volatility (standard deviation of returns)
  const variance = monthlyReturns.length > 0
    ? monthlyReturns.reduce((sum, ret) => sum + Math.pow(ret - averageMonthlyReturn, 2), 0) / monthlyReturns.length
    : 0;
  const volatility = Math.sqrt(variance);

  return {
    totalReturn,
    bestMonth,
    worstMonth,
    averageMonthlyReturn,
    volatility,
    maxDrawdown: Math.abs(maxDrawdown)
  };
};

/**
 * Generate sector allocation chart data
 * @param {Object} sectorAllocation - Sector allocation percentages
 * @returns {Array} Chart data for sector allocation
 */
export const generateSectorAllocationChartData = (sectorAllocation) => {
  if (!sectorAllocation || Object.keys(sectorAllocation).length === 0) {
    return [];
  }

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  return Object.entries(sectorAllocation)
    .sort((a, b) => b[1] - a[1])
    .map(([sector, percentage], index) => ({
      name: sector,
      value: percentage,
      color: colors[index % colors.length]
    }));
};

/**
 * Calculate rebalancing recommendations
 * @param {Array} holdings - Portfolio holdings
 * @param {Object} targetAllocation - Target allocation percentages
 * @returns {Array} Rebalancing recommendations
 */
export const calculateRebalancingRecommendations = (holdings, targetAllocation) => {
  if (!holdings || holdings.length === 0) return [];
  
  const currentAllocation = calculateSectorAllocation(holdings);
  const recommendations = [];
  
  Object.keys(targetAllocation).forEach(sector => {
    const current = currentAllocation[sector] || 0;
    const target = targetAllocation[sector];
    const difference = current - target;
    
    if (Math.abs(difference) > 5) { // 5% threshold
      recommendations.push({
        sector,
        currentAllocation: current,
        targetAllocation: target,
        difference,
        action: difference > 0 ? 'reduce' : 'increase',
        priority: Math.abs(difference) > 10 ? 'high' : 'medium'
      });
    }
  });
  
  return recommendations.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
};
