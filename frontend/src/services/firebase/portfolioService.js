import { 
  addDocument, 
  getDocument, 
  getDocuments, 
  updateDocument, 
  deleteDocument 
} from './firestore';

/**
 * Portfolio Service
 * Manages user portfolios and holdings in Firestore
 */

/**
 * Create a new portfolio
 * @param {string} userId - User ID
 * @param {Object} portfolioData - Portfolio data
 * @returns {Promise<string>} Portfolio ID
 */
export const createPortfolio = async (userId, portfolioData) => {
  try {
    const portfolio = {
      ...portfolioData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Default portfolio settings
      totalValue: 0,
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      holdings: [],
      performance: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0
      }
    };
    
    return await addDocument('portfolios', portfolio);
  } catch (error) {
    console.error('Error creating portfolio:', error);
    throw error;
  }
};

/**
 * Get user's portfolios
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of portfolios
 */
export const getUserPortfolios = async (userId) => {
  try {
    const portfolios = await getDocuments('portfolios');
    return portfolios.filter(portfolio => portfolio.userId === userId);
  } catch (error) {
    console.error('Error getting user portfolios:', error);
    throw error;
  }
};

/**
 * Get portfolio by ID
 * @param {string} portfolioId - Portfolio ID
 * @returns {Promise<Object|null>} Portfolio data
 */
export const getPortfolio = async (portfolioId) => {
  try {
    return await getDocument('portfolios', portfolioId);
  } catch (error) {
    console.error('Error getting portfolio:', error);
    throw error;
  }
};

/**
 * Add holding to portfolio
 * @param {string} portfolioId - Portfolio ID
 * @param {Object} holding - Holding data
 * @returns {Promise<void>}
 */
export const addHolding = async (portfolioId, holding) => {
  try {
    const portfolio = await getPortfolio(portfolioId);
    if (!portfolio) throw new Error('Portfolio not found');
    
    const newHolding = {
      id: Date.now().toString(),
      ...holding,
      addedAt: new Date()
    };
    
    const updatedHoldings = [...(portfolio.holdings || []), newHolding];
    
    await updateDocument('portfolios', portfolioId, {
      holdings: updatedHoldings,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error adding holding:', error);
    throw error;
  }
};

/**
 * Update holding in portfolio
 * @param {string} portfolioId - Portfolio ID
 * @param {string} holdingId - Holding ID
 * @param {Object} updates - Holding updates
 * @returns {Promise<void>}
 */
export const updateHolding = async (portfolioId, holdingId, updates) => {
  try {
    const portfolio = await getPortfolio(portfolioId);
    if (!portfolio) throw new Error('Portfolio not found');
    
    const holdings = portfolio.holdings || [];
    const holdingIndex = holdings.findIndex(h => h.id === holdingId);
    
    if (holdingIndex === -1) throw new Error('Holding not found');
    
    holdings[holdingIndex] = {
      ...holdings[holdingIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    await updateDocument('portfolios', portfolioId, {
      holdings,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating holding:', error);
    throw error;
  }
};

/**
 * Remove holding from portfolio
 * @param {string} portfolioId - Portfolio ID
 * @param {string} holdingId - Holding ID
 * @returns {Promise<void>}
 */
export const removeHolding = async (portfolioId, holdingId) => {
  try {
    const portfolio = await getPortfolio(portfolioId);
    if (!portfolio) throw new Error('Portfolio not found');
    
    const holdings = portfolio.holdings || [];
    const updatedHoldings = holdings.filter(h => h.id !== holdingId);
    
    await updateDocument('portfolios', portfolioId, {
      holdings: updatedHoldings,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error removing holding:', error);
    throw error;
  }
};

/**
 * Update portfolio performance metrics
 * @param {string} portfolioId - Portfolio ID
 * @param {Object} performance - Performance data
 * @returns {Promise<void>}
 */
export const updatePortfolioPerformance = async (portfolioId, performance) => {
  try {
    await updateDocument('portfolios', portfolioId, {
      performance,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating portfolio performance:', error);
    throw error;
  }
};
