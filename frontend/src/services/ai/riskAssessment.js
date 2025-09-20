/**
 * Risk Assessment service for evaluating investment risk
 */

/**
 * Calculate overall risk score for a user
 * @param {Object} userProfile - User's investment profile
 * @param {Object} portfolioData - User's portfolio data
 * @returns {number} Risk score (0-100)
 */
export const calculateRiskScore = (userProfile, portfolioData) => {
  let riskScore = 0;
  
  // Age factor (younger = higher risk tolerance)
  if (userProfile.age) {
    if (userProfile.age < 30) riskScore += 20;
    else if (userProfile.age < 50) riskScore += 15;
    else if (userProfile.age < 65) riskScore += 10;
    else riskScore += 5;
  }
  
  // Investment experience
  if (userProfile.investmentExperience) {
    switch (userProfile.investmentExperience) {
      case 'Expert (10+ years)':
        riskScore += 25;
        break;
      case 'Advanced (5-10 years)':
        riskScore += 20;
        break;
      case 'Intermediate (3-5 years)':
        riskScore += 15;
        break;
      case 'Novice (1-3 years)':
        riskScore += 10;
        break;
      case 'Beginner (0-1 years)':
        riskScore += 5;
        break;
    }
  }
  
  // Income level
  if (userProfile.annualIncome) {
    if (userProfile.annualIncome.includes('Over $200,000')) riskScore += 20;
    else if (userProfile.annualIncome.includes('$150,000')) riskScore += 15;
    else if (userProfile.annualIncome.includes('$100,000')) riskScore += 10;
    else if (userProfile.annualIncome.includes('$75,000')) riskScore += 5;
  }
  
  // Portfolio diversification
  if (portfolioData && portfolioData.holdings) {
    const diversificationScore = calculateDiversificationScore(portfolioData.holdings);
    riskScore += diversificationScore * 0.3;
  }
  
  return Math.min(100, Math.max(0, riskScore));
};

/**
 * Calculate diversification score for a portfolio
 * @param {Array} holdings - Portfolio holdings
 * @returns {number} Diversification score (0-100)
 */
export const calculateDiversificationScore = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  // Count unique sectors
  const sectors = new Set(holdings.map(holding => holding.sector));
  const sectorScore = Math.min(50, sectors.size * 10);
  
  // Count unique asset types
  const assetTypes = new Set(holdings.map(holding => holding.assetType));
  const assetTypeScore = Math.min(30, assetTypes.size * 15);
  
  // Geographic diversification
  const regions = new Set(holdings.map(holding => holding.region));
  const regionScore = Math.min(20, regions.size * 10);
  
  return sectorScore + assetTypeScore + regionScore;
};

/**
 * Assess risk level based on score
 * @param {number} riskScore - Risk score (0-100)
 * @returns {string} Risk level
 */
export const assessRiskLevel = (riskScore) => {
  if (riskScore >= 80) return 'Very High';
  if (riskScore >= 60) return 'High';
  if (riskScore >= 40) return 'Medium';
  if (riskScore >= 20) return 'Low';
  return 'Very Low';
};

/**
 * Calculate portfolio volatility
 * @param {Array} holdings - Portfolio holdings
 * @param {Object} marketData - Market data
 * @returns {number} Portfolio volatility
 */
export const calculatePortfolioVolatility = (holdings, marketData) => {
  if (!holdings || holdings.length === 0) return 0;
  
  let totalVolatility = 0;
  let totalWeight = 0;
  
  holdings.forEach(holding => {
    const weight = holding.value / holdings.reduce((sum, h) => sum + h.value, 0);
    const volatility = marketData[holding.symbol]?.volatility || 0.2; // Default 20%
    
    totalVolatility += weight * volatility;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? totalVolatility / totalWeight : 0;
};

/**
 * Calculate Value at Risk (VaR)
 * @param {number} portfolioValue - Total portfolio value
 * @param {number} volatility - Portfolio volatility
 * @param {number} confidenceLevel - Confidence level (default 95%)
 * @returns {number} VaR amount
 */
export const calculateVaR = (portfolioValue, volatility, confidenceLevel = 0.95) => {
  // Simplified VaR calculation using normal distribution
  const zScore = confidenceLevel === 0.95 ? 1.645 : 1.96; // 95% or 99%
  return portfolioValue * volatility * zScore;
};

/**
 * Generate risk recommendations
 * @param {Object} userProfile - User profile
 * @param {Object} portfolioData - Portfolio data
 * @returns {Array} Risk recommendations
 */
export const generateRiskRecommendations = (userProfile, portfolioData) => {
  const recommendations = [];
  const riskScore = calculateRiskScore(userProfile, portfolioData);
  
  if (riskScore < 30) {
    recommendations.push({
      type: 'increase_risk',
      title: 'Consider Increasing Risk Exposure',
      description: 'Your risk score is low. Consider adding growth stocks or international investments.',
      priority: 'Medium'
    });
  } else if (riskScore > 70) {
    recommendations.push({
      type: 'reduce_risk',
      title: 'Consider Reducing Risk Exposure',
      description: 'Your risk score is high. Consider adding bonds or defensive stocks.',
      priority: 'High'
    });
  }
  
  const diversificationScore = calculateDiversificationScore(portfolioData?.holdings || []);
  if (diversificationScore < 50) {
    recommendations.push({
      type: 'diversify',
      title: 'Improve Portfolio Diversification',
      description: 'Your portfolio could benefit from more diversification across sectors and asset types.',
      priority: 'High'
    });
  }
  
  return recommendations;
};
