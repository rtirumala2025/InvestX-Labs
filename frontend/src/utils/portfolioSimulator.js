/**
 * Portfolio Simulator for AI Testing
 * Generates realistic portfolio data for testing LLaMA integration
 */

/**
 * Generate a realistic test portfolio for AI testing
 * @param {string} portfolioType - 'beginner', 'balanced', 'aggressive'
 * @returns {Object} Simulated portfolio data
 */
export const generateTestPortfolio = (portfolioType = 'balanced') => {
  console.log('🧪 [PortfolioSimulator] Generating test portfolio:', portfolioType);
  
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 6); // 6 months ago
  
  const portfolioTemplates = {
    beginner: {
      totalInvestment: 5000,
      holdings: [
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', shares: 15, purchasePrice: 220.50, sector: 'ETF', assetType: 'ETF' },
        { symbol: 'AAPL', name: 'Apple Inc.', shares: 5, purchasePrice: 175.25, sector: 'Technology', assetType: 'Stock' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', shares: 3, purchasePrice: 338.50, sector: 'Technology', assetType: 'Stock' },
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', shares: 12, purchasePrice: 78.90, sector: 'Bonds', assetType: 'ETF' }
      ]
    },
    balanced: {
      totalInvestment: 25000,
      holdings: [
        { symbol: 'SPY', name: 'SPDR S&P 500 ETF', shares: 25, purchasePrice: 420.75, sector: 'ETF', assetType: 'ETF' },
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', shares: 15, purchasePrice: 365.20, sector: 'ETF', assetType: 'ETF' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 8, purchasePrice: 138.45, sector: 'Technology', assetType: 'Stock' },
        { symbol: 'TSLA', name: 'Tesla Inc.', shares: 12, purchasePrice: 248.75, sector: 'Automotive', assetType: 'Stock' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', shares: 6, purchasePrice: 445.30, sector: 'Technology', assetType: 'Stock' },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.', shares: 10, purchasePrice: 155.80, sector: 'Financial', assetType: 'Stock' },
        { symbol: 'JNJ', name: 'Johnson & Johnson', shares: 8, purchasePrice: 162.25, sector: 'Healthcare', assetType: 'Stock' }
      ]
    },
    aggressive: {
      totalInvestment: 50000,
      holdings: [
        { symbol: 'TSLA', name: 'Tesla Inc.', shares: 25, purchasePrice: 248.75, sector: 'Automotive', assetType: 'Stock' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', shares: 15, purchasePrice: 445.30, sector: 'Technology', assetType: 'Stock' },
        { symbol: 'AMD', name: 'Advanced Micro Devices', shares: 20, purchasePrice: 112.85, sector: 'Technology', assetType: 'Stock' },
        { symbol: 'ARKK', name: 'ARK Innovation ETF', shares: 30, purchasePrice: 48.90, sector: 'ETF', assetType: 'ETF' },
        { symbol: 'COIN', name: 'Coinbase Global Inc.', shares: 15, purchasePrice: 165.40, sector: 'Financial', assetType: 'Stock' },
        { symbol: 'PLTR', name: 'Palantir Technologies', shares: 50, purchasePrice: 18.75, sector: 'Technology', assetType: 'Stock' },
        { symbol: 'SQ', name: 'Block Inc.', shares: 18, purchasePrice: 78.20, sector: 'Financial', assetType: 'Stock' },
        { symbol: 'ROKU', name: 'Roku Inc.', shares: 25, purchasePrice: 68.45, sector: 'Technology', assetType: 'Stock' }
      ]
    }
  };
  
  const template = portfolioTemplates[portfolioType];
  if (!template) {
    console.error('🧪 [PortfolioSimulator] ❌ Invalid portfolio type:', portfolioType);
    return null;
  }
  
  // Add realistic current prices (simulate market movement)
  const enrichedHoldings = template.holdings.map((holding, index) => {
    // Simulate price movement between -15% to +25%
    const priceMovement = (Math.random() * 0.4 - 0.15); // -15% to +25%
    const currentPrice = holding.purchasePrice * (1 + priceMovement);
    const previousClose = currentPrice * (1 + (Math.random() * 0.04 - 0.02)); // -2% to +2% daily
    
    const value = holding.shares * currentPrice;
    const costBasis = holding.shares * holding.purchasePrice;
    const gainLoss = value - costBasis;
    const gainLossPercentage = (gainLoss / costBasis) * 100;
    const dayChange = holding.shares * (currentPrice - previousClose);
    const dayChangePercentage = ((currentPrice - previousClose) / previousClose) * 100;
    
    return {
      ...holding,
      id: `test_holding_${index}`,
      currentPrice: Math.round(currentPrice * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      value: Math.round(value * 100) / 100,
      gainLoss: Math.round(gainLoss * 100) / 100,
      gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
      dayChange: Math.round(dayChange * 100) / 100,
      dayChangePercentage: Math.round(dayChangePercentage * 100) / 100,
      purchaseDate: new Date(baseDate.getTime() + (index * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      createdAt: new Date().toISOString()
    };
  });
  
  // Calculate portfolio totals
  const totalValue = enrichedHoldings.reduce((sum, holding) => sum + holding.value, 0);
  const totalCostBasis = enrichedHoldings.reduce((sum, holding) => sum + (holding.shares * holding.purchasePrice), 0);
  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPercentage = (totalGainLoss / totalCostBasis) * 100;
  const totalDayChange = enrichedHoldings.reduce((sum, holding) => sum + holding.dayChange, 0);
  const dayChangePercentage = (totalDayChange / (totalValue - totalDayChange)) * 100;
  
  // Calculate diversification score
  const sectors = [...new Set(enrichedHoldings.map(h => h.sector))];
  const assetTypes = [...new Set(enrichedHoldings.map(h => h.assetType))];
  const diversificationScore = Math.min(100, (sectors.length * 15) + (assetTypes.length * 10) + (enrichedHoldings.length * 5));
  
  const simulatedPortfolio = {
    id: 'test_portfolio_' + Date.now(),
    userId: 'test_user',
    holdings: enrichedHoldings,
    totalValue: Math.round(totalValue * 100) / 100,
    totalCostBasis: Math.round(totalCostBasis * 100) / 100,
    totalGainLoss: Math.round(totalGainLoss * 100) / 100,
    totalGainLossPercentage: Math.round(totalGainLossPercentage * 100) / 100,
    dayChange: Math.round(totalDayChange * 100) / 100,
    dayChangePercentage: Math.round(dayChangePercentage * 100) / 100,
    diversificationScore,
    sectorAllocation: calculateSectorAllocation(enrichedHoldings),
    assetTypeAllocation: calculateAssetTypeAllocation(enrichedHoldings),
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isSimulated: true
  };
  
  console.log('🧪 [PortfolioSimulator] ✅ Test portfolio generated:', {
    type: portfolioType,
    totalValue: simulatedPortfolio.totalValue,
    holdingsCount: simulatedPortfolio.holdings.length,
    diversificationScore: simulatedPortfolio.diversificationScore
  });
  
  return simulatedPortfolio;
};

/**
 * Calculate sector allocation percentages
 * @param {Array} holdings - Portfolio holdings
 * @returns {Object} Sector allocation percentages
 */
const calculateSectorAllocation = (holdings) => {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const sectorTotals = {};
  
  holdings.forEach(holding => {
    const sector = holding.sector || 'Other';
    sectorTotals[sector] = (sectorTotals[sector] || 0) + holding.value;
  });
  
  const sectorAllocation = {};
  Object.entries(sectorTotals).forEach(([sector, value]) => {
    sectorAllocation[sector] = Math.round((value / totalValue) * 100 * 100) / 100;
  });
  
  return sectorAllocation;
};

/**
 * Calculate asset type allocation percentages
 * @param {Array} holdings - Portfolio holdings
 * @returns {Object} Asset type allocation percentages
 */
const calculateAssetTypeAllocation = (holdings) => {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const assetTypeTotals = {};
  
  holdings.forEach(holding => {
    const assetType = holding.assetType || 'Other';
    assetTypeTotals[assetType] = (assetTypeTotals[assetType] || 0) + holding.value;
  });
  
  const assetTypeAllocation = {};
  Object.entries(assetTypeTotals).forEach(([assetType, value]) => {
    assetTypeAllocation[assetType] = Math.round((value / totalValue) * 100 * 100) / 100;
  });
  
  return assetTypeAllocation;
};

/**
 * Clean up test portfolio data
 * @param {string} portfolioId - ID of test portfolio to clean up
 */
export const cleanupTestPortfolio = (portfolioId) => {
  console.log('🧪 [PortfolioSimulator] 🧹 Cleaning up test portfolio:', portfolioId);
  // In a real implementation, this would delete from Firestore
  // For now, we just log the cleanup
  console.log('🧪 [PortfolioSimulator] ✅ Test portfolio cleanup completed');
};

/**
 * Run AI integration test with simulated portfolio
 * @param {string} portfolioType - Type of portfolio to simulate
 * @returns {Promise<Object>} Test results
 */
export const runAIIntegrationTest = async (portfolioType = 'balanced') => {
  console.log('🧪 [PortfolioSimulator] 🚀 Starting AI integration test...');
  
  try {
    // Generate test portfolio
    const testPortfolio = generateTestPortfolio(portfolioType);
    
    if (!testPortfolio) {
      throw new Error('Failed to generate test portfolio');
    }
    
    console.log('🧪 [PortfolioSimulator] 📊 Test portfolio created:', {
      holdings: testPortfolio.holdings.length,
      totalValue: testPortfolio.totalValue,
      diversificationScore: testPortfolio.diversificationScore
    });
    
    // Import AI service for testing
    const { getPortfolioAnalysis, getInvestmentSuggestions } = await import('../services/ai/llamaService');
    
    // Test portfolio analysis
    console.log('🧪 [PortfolioSimulator] 🤖 Testing portfolio analysis...');
    const analysis = await getPortfolioAnalysis(testPortfolio);
    
    // Test investment suggestions
    console.log('🧪 [PortfolioSimulator] 🤖 Testing investment suggestions...');
    const suggestions = await getInvestmentSuggestions(1000, testPortfolio);
    
    const testResults = {
      success: true,
      portfolioType,
      testPortfolio: {
        id: testPortfolio.id,
        totalValue: testPortfolio.totalValue,
        holdingsCount: testPortfolio.holdings.length,
        diversificationScore: testPortfolio.diversificationScore
      },
      aiResponses: {
        analysis: analysis ? 'Success' : 'Failed',
        suggestions: suggestions ? 'Success' : 'Failed',
        analysisLength: analysis?.length || 0,
        suggestionsLength: suggestions?.length || 0
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('🧪 [PortfolioSimulator] ✅ AI integration test completed:', testResults);
    
    // Cleanup
    cleanupTestPortfolio(testPortfolio.id);
    
    return testResults;
    
  } catch (error) {
    console.error('🧪 [PortfolioSimulator] ❌ AI integration test failed:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};
