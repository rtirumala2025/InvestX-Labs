import { 
  addDocument, 
  getDocument, 
  getDocuments, 
  updateDocument, 
  deleteDocument, 
  subscribeToCollection
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
      // Default portfolio meta (no embedded holdings here)
      totalValue: 0,
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      performance: { daily: 0, weekly: 0, monthly: 0, yearly: 0 }
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

// Holdings subcollection API under users/{uid}/portfolio
export const addHolding = async (userId, holding) => {
  try {
    return await addDocument(`users/${userId}/portfolio`, {
      ...holding,
      addedAt: new Date()
    });
  } catch (error) {
    console.error('Error adding holding:', error);
    throw error;
  }
};

export const updateHolding = async (userId, holdingId, updates) => {
  try {
    await updateDocument(`users/${userId}/portfolio`, holdingId, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating holding:', error);
    throw error;
  }
};

export const removeHolding = async (userId, holdingId) => {
  try {
    await deleteDocument(`users/${userId}/portfolio`, holdingId);
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

/**
 * Get user holdings (real-time subscription)
 * @param {string} userId
 * @param {(items: Array) => void} callback
 * @returns {Function} unsubscribe
 */
export const subscribeToUserHoldings = (userId, callback) => {
  return subscribeToCollection(`users/${userId}/portfolio`, [], callback);
};
