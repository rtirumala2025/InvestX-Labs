import api from '../api/apiConfig';

/**
 * Get AI investment recommendations based on user profile and preferences
 * @param {Object} params - User preferences and filters
 * @param {string} params.userId - User ID
 * @param {string} [params.riskTolerance] - User's risk tolerance (low, medium, high)
 * @param {number} [params.investmentHorizon] - Investment horizon in years
 * @param {number} [params.amount] - Investment amount
 * @returns {Promise<Array>} - Array of investment recommendations
 */
export const getAIRecommendations = async (params) => {
  try {
    const response = await api.get('/ai/recommendations', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    throw error;
  }
};

/**
 * Get explanation for an investment recommendation
 * @param {string} recommendationId - ID of the recommendation
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Explanation details
 */
export const getRecommendationExplanation = async (recommendationId, userId) => {
  try {
    const response = await api.get(`/ai/recommendations/${recommendationId}/explanation`, {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendation explanation:', error);
    throw error;
  }
};

/**
 * Get personalized investment insights
 * @param {string} userId - User ID
 * @param {Object} options - Additional options
 * @param {string} [options.timeRange='1y'] - Time range for insights
 * @returns {Promise<Object>} - Investment insights
 */
export const getInvestmentInsights = async (userId, options = {}) => {
  try {
    const response = await api.get(`/ai/insights/${userId}`, { params: options });
    return response.data;
  } catch (error) {
    console.error('Error fetching investment insights:', error);
    throw error;
  }
};

/**
 * Get AI-generated educational content
 * @param {string} topic - Topic of interest
 * @param {string} [complexity='beginner'] - Complexity level (beginner, intermediate, advanced)
 * @returns {Promise<Object>} - Educational content
 */
export const getEducationalContent = async (topic, complexity = 'beginner') => {
  try {
    const response = await api.get('/ai/education', {
      params: { topic, complexity }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching educational content:', error);
    throw error;
  }
};

/**
 * Get AI analysis of a specific stock or asset
 * @param {string} symbol - Stock/asset symbol
 * @param {Object} options - Analysis options
 * @param {string} [options.timeframe='1y'] - Timeframe for analysis
 * @returns {Promise<Object>} - Analysis results
 */
export const getAssetAnalysis = async (symbol, options = {}) => {
  try {
    const response = await api.get(`/ai/analyze/${symbol}`, {
      params: options
    });
    return response.data;
  } catch (error) {
    console.error(`Error analyzing asset ${symbol}:`, error);
    throw error;
  }
};
