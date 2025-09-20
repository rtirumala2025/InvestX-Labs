import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

/**
 * Call a Firebase Cloud Function
 * @param {string} functionName - Name of the cloud function
 * @param {Object} data - Data to pass to the function
 * @returns {Promise<Object>} Function response
 */
export const callFunction = async (functionName, data = {}) => {
  try {
    const callable = httpsCallable(functions, functionName);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Generate AI investment suggestions
 * @param {Object} userData - User profile and portfolio data
 * @returns {Promise<Array>} Array of AI suggestions
 */
export const generateAISuggestions = async (userData) => {
  try {
    return await callFunction('generateAISuggestions', userData);
  } catch (error) {
    throw error;
  }
};

/**
 * Analyze portfolio performance
 * @param {Object} portfolioData - Portfolio holdings and data
 * @returns {Promise<Object>} Portfolio analysis results
 */
export const analyzePortfolio = async (portfolioData) => {
  try {
    return await callFunction('analyzePortfolio', portfolioData);
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate risk assessment
 * @param {Object} userProfile - User profile data
 * @param {Object} portfolioData - Portfolio data
 * @returns {Promise<Object>} Risk assessment results
 */
export const calculateRiskAssessment = async (userProfile, portfolioData) => {
  try {
    return await callFunction('calculateRiskAssessment', { userProfile, portfolioData });
  } catch (error) {
    throw error;
  }
};

/**
 * Generate market insights
 * @param {Array} symbols - Stock symbols to analyze
 * @returns {Promise<Object>} Market insights data
 */
export const generateMarketInsights = async (symbols) => {
  try {
    return await callFunction('generateMarketInsights', { symbols });
  } catch (error) {
    throw error;
  }
};
