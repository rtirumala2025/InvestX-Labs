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
export const calculatePerformanceMetrics = (holdings, marketData = {}) => {
  const totalValue = calculateTotalValue(holdings);
  const totalCostBasis = calculateTotalCostBasis(holdings);
  const totalGainLoss = calculateTotalGainLoss(holdings);
  const totalGainLossPercentage = calculateTotalGainLossPercentage(holdings);
  
  return {
    totalValue,
    totalCostBasis,
    totalGainLoss,
    totalGainLossPercentage,
    sectorAllocation: calculateSectorAllocation(holdings),
    assetTypeAllocation: calculateAssetTypeAllocation(holdings),
    portfolioBeta: calculatePortfolioBeta(holdings, marketData),
    sharpeRatio: calculateSharpeRatio(holdings),
    volatility: calculatePortfolioVolatility(holdings),
    diversificationScore: calculateDiversificationScore(holdings),
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
