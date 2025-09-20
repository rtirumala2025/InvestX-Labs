/**
 * Diversification Analysis service for evaluating portfolio diversification
 */

/**
 * Analyze portfolio diversification
 * @param {Array} holdings - Portfolio holdings
 * @returns {Object} Diversification analysis
 */
export const analyzeDiversification = (holdings) => {
  if (!holdings || holdings.length === 0) {
    return {
      score: 0,
      level: 'Poor',
      recommendations: ['Add investments to improve diversification'],
      sectorAnalysis: {},
      assetTypeAnalysis: {},
      geographicAnalysis: {},
      correlationAnalysis: {}
    };
  }
  
  const sectorAnalysis = analyzeSectorDiversification(holdings);
  const assetTypeAnalysis = analyzeAssetTypeDiversification(holdings);
  const geographicAnalysis = analyzeGeographicDiversification(holdings);
  const correlationAnalysis = analyzeCorrelationDiversification(holdings);
  
  const score = calculateDiversificationScore(sectorAnalysis, assetTypeAnalysis, geographicAnalysis, correlationAnalysis);
  const level = getDiversificationLevel(score);
  const recommendations = generateDiversificationRecommendations(sectorAnalysis, assetTypeAnalysis, geographicAnalysis, correlationAnalysis);
  
  return {
    score,
    level,
    recommendations,
    sectorAnalysis,
    assetTypeAnalysis,
    geographicAnalysis,
    correlationAnalysis,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Analyze sector diversification
 * @param {Array} holdings - Portfolio holdings
 * @returns {Object} Sector analysis
 */
const analyzeSectorDiversification = (holdings) => {
  const totalValue = holdings.reduce((sum, holding) => sum + (holding.shares * holding.currentPrice), 0);
  const sectorValues = {};
  const sectorCounts = {};
  
  holdings.forEach(holding => {
    const sector = holding.sector || 'Unknown';
    const value = holding.shares * holding.currentPrice;
    
    if (sectorValues[sector]) {
      sectorValues[sector] += value;
      sectorCounts[sector] += 1;
    } else {
      sectorValues[sector] = value;
      sectorCounts[sector] = 1;
    }
  });
  
  const sectorAllocation = {};
  Object.keys(sectorValues).forEach(sector => {
    sectorAllocation[sector] = (sectorValues[sector] / totalValue) * 100;
  });
  
  const sectorCount = Object.keys(sectorAllocation).length;
  const maxAllocation = Math.max(...Object.values(sectorAllocation));
  const concentrationRisk = maxAllocation > 40 ? 'High' : maxAllocation > 25 ? 'Medium' : 'Low';
  
  return {
    sectorCount,
    sectorAllocation,
    maxAllocation,
    concentrationRisk,
    score: Math.min(100, sectorCount * 10 + (100 - maxAllocation))
  };
};

/**
 * Analyze asset type diversification
 * @param {Array} holdings - Portfolio holdings
 * @returns {Object} Asset type analysis
 */
const analyzeAssetTypeDiversification = (holdings) => {
  const totalValue = holdings.reduce((sum, holding) => sum + (holding.shares * holding.currentPrice), 0);
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
  
  const assetTypeCount = Object.keys(assetTypeAllocation).length;
  const stockAllocation = assetTypeAllocation['Stock'] || 0;
  const bondAllocation = assetTypeAllocation['Bond'] || 0;
  const alternativeAllocation = 100 - stockAllocation - bondAllocation;
  
  return {
    assetTypeCount,
    assetTypeAllocation,
    stockAllocation,
    bondAllocation,
    alternativeAllocation,
    score: Math.min(100, assetTypeCount * 20 + (100 - Math.abs(60 - stockAllocation)))
  };
};

/**
 * Analyze geographic diversification
 * @param {Array} holdings - Portfolio holdings
 * @returns {Object} Geographic analysis
 */
const analyzeGeographicDiversification = (holdings) => {
  const totalValue = holdings.reduce((sum, holding) => sum + (holding.shares * holding.currentPrice), 0);
  const regionValues = {};
  
  holdings.forEach(holding => {
    const region = holding.region || 'US';
    const value = holding.shares * holding.currentPrice;
    
    if (regionValues[region]) {
      regionValues[region] += value;
    } else {
      regionValues[region] = value;
    }
  });
  
  const regionAllocation = {};
  Object.keys(regionValues).forEach(region => {
    regionAllocation[region] = (regionValues[region] / totalValue) * 100;
  });
  
  const regionCount = Object.keys(regionAllocation).length;
  const usAllocation = regionAllocation['US'] || 0;
  const internationalAllocation = 100 - usAllocation;
  
  return {
    regionCount,
    regionAllocation,
    usAllocation,
    internationalAllocation,
    score: Math.min(100, regionCount * 15 + (100 - Math.abs(70 - usAllocation)))
  };
};

/**
 * Analyze correlation diversification
 * @param {Array} holdings - Portfolio holdings
 * @returns {Object} Correlation analysis
 */
const analyzeCorrelationDiversification = (holdings) => {
  // Simplified correlation analysis
  // In production, you would use actual correlation data
  const correlationScore = Math.min(100, holdings.length * 5);
  
  return {
    correlationScore,
    averageCorrelation: 0.3, // Mock value
    score: correlationScore
  };
};

/**
 * Calculate overall diversification score
 * @param {Object} sectorAnalysis - Sector analysis
 * @param {Object} assetTypeAnalysis - Asset type analysis
 * @param {Object} geographicAnalysis - Geographic analysis
 * @param {Object} correlationAnalysis - Correlation analysis
 * @returns {number} Overall diversification score
 */
const calculateDiversificationScore = (sectorAnalysis, assetTypeAnalysis, geographicAnalysis, correlationAnalysis) => {
  const weights = {
    sector: 0.3,
    assetType: 0.3,
    geographic: 0.2,
    correlation: 0.2
  };
  
  return Math.round(
    sectorAnalysis.score * weights.sector +
    assetTypeAnalysis.score * weights.assetType +
    geographicAnalysis.score * weights.geographic +
    correlationAnalysis.score * weights.correlation
  );
};

/**
 * Get diversification level based on score
 * @param {number} score - Diversification score
 * @returns {string} Diversification level
 */
const getDiversificationLevel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Very Poor';
};

/**
 * Generate diversification recommendations
 * @param {Object} sectorAnalysis - Sector analysis
 * @param {Object} assetTypeAnalysis - Asset type analysis
 * @param {Object} geographicAnalysis - Geographic analysis
 * @param {Object} correlationAnalysis - Correlation analysis
 * @returns {Array} Recommendations
 */
const generateDiversificationRecommendations = (sectorAnalysis, assetTypeAnalysis, geographicAnalysis, correlationAnalysis) => {
  const recommendations = [];
  
  // Sector recommendations
  if (sectorAnalysis.sectorCount < 5) {
    recommendations.push({
      type: 'sector',
      priority: 'High',
      message: `Consider diversifying across more sectors. Currently invested in ${sectorAnalysis.sectorCount} sectors.`,
      action: 'Add investments in underrepresented sectors'
    });
  }
  
  if (sectorAnalysis.maxAllocation > 40) {
    recommendations.push({
      type: 'concentration',
      priority: 'High',
      message: `High concentration in one sector (${sectorAnalysis.maxAllocation.toFixed(1)}%). Consider reducing exposure.`,
      action: 'Rebalance portfolio to reduce concentration risk'
    });
  }
  
  // Asset type recommendations
  if (assetTypeAnalysis.stockAllocation > 80) {
    recommendations.push({
      type: 'asset_type',
      priority: 'Medium',
      message: 'Portfolio is heavily weighted toward stocks. Consider adding bonds or alternative investments.',
      action: 'Add bond funds or alternative investments'
    });
  }
  
  if (assetTypeAnalysis.bondAllocation === 0) {
    recommendations.push({
      type: 'bonds',
      priority: 'Medium',
      message: 'No bond exposure. Consider adding bonds for stability and income.',
      action: 'Add bond funds or ETFs'
    });
  }
  
  // Geographic recommendations
  if (geographicAnalysis.internationalAllocation < 20) {
    recommendations.push({
      type: 'geographic',
      priority: 'Medium',
      message: 'Low international exposure. Consider adding international investments for global diversification.',
      action: 'Add international stocks or funds'
    });
  }
  
  // Correlation recommendations
  if (correlationAnalysis.correlationScore < 50) {
    recommendations.push({
      type: 'correlation',
      priority: 'Low',
      message: 'Consider adding investments with lower correlation to improve diversification.',
      action: 'Add alternative investments or different asset classes'
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

/**
 * Get diversification benchmark
 * @param {string} riskProfile - User's risk profile
 * @returns {Object} Diversification benchmark
 */
export const getDiversificationBenchmark = (riskProfile) => {
  const benchmarks = {
    conservative: {
      stocks: 40,
      bonds: 50,
      alternatives: 10,
      sectors: 8,
      international: 20
    },
    moderate: {
      stocks: 60,
      bonds: 30,
      alternatives: 10,
      sectors: 10,
      international: 25
    },
    balanced: {
      stocks: 70,
      bonds: 20,
      alternatives: 10,
      sectors: 12,
      international: 30
    },
    aggressive: {
      stocks: 80,
      bonds: 10,
      alternatives: 10,
      sectors: 15,
      international: 35
    }
  };
  
  return benchmarks[riskProfile] || benchmarks.moderate;
};

/**
 * Compare portfolio to diversification benchmark
 * @param {Object} diversificationAnalysis - Portfolio diversification analysis
 * @param {Object} benchmark - Diversification benchmark
 * @returns {Object} Comparison results
 */
export const compareToDiversificationBenchmark = (diversificationAnalysis, benchmark) => {
  const comparison = {
    overallScore: diversificationAnalysis.score,
    benchmarkScore: 75, // Mock benchmark score
    performance: diversificationAnalysis.score >= 75 ? 'Above' : 'Below',
    gaps: []
  };
  
  // Check asset type gaps
  const currentStockAllocation = diversificationAnalysis.assetTypeAnalysis.stockAllocation;
  if (Math.abs(currentStockAllocation - benchmark.stocks) > 10) {
    comparison.gaps.push({
      type: 'asset_type',
      current: currentStockAllocation,
      target: benchmark.stocks,
      difference: currentStockAllocation - benchmark.stocks
    });
  }
  
  // Check sector gaps
  const currentSectorCount = diversificationAnalysis.sectorAnalysis.sectorCount;
  if (currentSectorCount < benchmark.sectors) {
    comparison.gaps.push({
      type: 'sectors',
      current: currentSectorCount,
      target: benchmark.sectors,
      difference: currentSectorCount - benchmark.sectors
    });
  }
  
  // Check international gaps
  const currentInternational = diversificationAnalysis.geographicAnalysis.internationalAllocation;
  if (Math.abs(currentInternational - benchmark.international) > 5) {
    comparison.gaps.push({
      type: 'international',
      current: currentInternational,
      target: benchmark.international,
      difference: currentInternational - benchmark.international
    });
  }
  
  return comparison;
};
