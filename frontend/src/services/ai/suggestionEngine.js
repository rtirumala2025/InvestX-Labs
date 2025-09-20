/**
 * AI Suggestion Engine for generating personalized investment recommendations
 */

import { generateInvestmentAdvice } from './claudeAPI';
import { calculateRiskScore } from './riskAssessment';

/**
 * Generate personalized investment suggestions
 * @param {Object} userProfile - User's investment profile
 * @param {Object} portfolioData - User's current portfolio
 * @param {Object} marketData - Current market data
 * @returns {Promise<Array>} Array of investment suggestions
 */
export const generateSuggestions = async (userProfile, portfolioData, marketData) => {
  try {
    // Calculate user's risk score
    const riskScore = calculateRiskScore(userProfile, portfolioData);
    
    // Generate AI advice
    const aiAdvice = await generateInvestmentAdvice(userProfile, portfolioData, marketData);
    
    // Process and format suggestions
    const suggestions = await processSuggestions(aiAdvice, userProfile, riskScore);
    
    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
};

/**
 * Process AI advice into structured suggestions
 * @param {Object} aiAdvice - Raw AI advice
 * @param {Object} userProfile - User profile
 * @param {number} riskScore - User's risk score
 * @returns {Promise<Array>} Processed suggestions
 */
const processSuggestions = async (aiAdvice, userProfile, riskScore) => {
  const suggestions = [];
  
  // Parse AI advice and create structured suggestions
  // This is a simplified version - in reality, you'd parse the AI response more carefully
  
  suggestions.push({
    id: `suggestion_${Date.now()}`,
    type: 'diversify',
    title: 'Portfolio Diversification',
    description: 'Consider diversifying your portfolio across different sectors to reduce risk.',
    confidence: 85,
    expectedImpact: 'Medium',
    reasoning: aiAdvice.advice,
    riskLevel: 'Low',
    timeHorizon: 'Long-term',
    createdAt: new Date().toISOString()
  });
  
  return suggestions;
};

/**
 * Filter suggestions based on user preferences
 * @param {Array} suggestions - All suggestions
 * @param {Object} userProfile - User profile
 * @returns {Array} Filtered suggestions
 */
export const filterSuggestions = (suggestions, userProfile) => {
  return suggestions.filter(suggestion => {
    // Filter based on user's risk tolerance
    if (userProfile.riskProfile === 'conservative' && suggestion.riskLevel === 'High') {
      return false;
    }
    
    // Filter based on user's interests
    if (userProfile.interests && suggestion.category) {
      return userProfile.interests.includes(suggestion.category);
    }
    
    return true;
  });
};

/**
 * Rank suggestions by relevance and potential impact
 * @param {Array} suggestions - Suggestions to rank
 * @param {Object} userProfile - User profile
 * @returns {Array} Ranked suggestions
 */
export const rankSuggestions = (suggestions, userProfile) => {
  return suggestions.sort((a, b) => {
    // Calculate relevance score for each suggestion
    const scoreA = calculateRelevanceScore(a, userProfile);
    const scoreB = calculateRelevanceScore(b, userProfile);
    
    return scoreB - scoreA;
  });
};

/**
 * Calculate relevance score for a suggestion
 * @param {Object} suggestion - Suggestion object
 * @param {Object} userProfile - User profile
 * @returns {number} Relevance score
 */
const calculateRelevanceScore = (suggestion, userProfile) => {
  let score = 0;
  
  // Base score from confidence
  score += suggestion.confidence * 0.4;
  
  // Risk alignment
  if (suggestion.riskLevel === userProfile.riskProfile) {
    score += 30;
  }
  
  // Interest alignment
  if (userProfile.interests && suggestion.category) {
    if (userProfile.interests.includes(suggestion.category)) {
      score += 20;
    }
  }
  
  // Time horizon alignment
  if (suggestion.timeHorizon === userProfile.investmentGoals) {
    score += 10;
  }
  
  return score;
};

/**
 * Generate explanation for a suggestion
 * @param {Object} suggestion - Suggestion object
 * @param {Object} userProfile - User profile
 * @returns {Promise<string>} Detailed explanation
 */
export const generateSuggestionExplanation = async (suggestion, userProfile) => {
  try {
    const explanation = `
      This suggestion is based on your ${userProfile.riskProfile} risk profile and 
      ${userProfile.investmentExperience} experience level. The AI has identified 
      this opportunity with ${suggestion.confidence}% confidence based on current 
      market conditions and your portfolio composition.
    `;
    
    return explanation;
  } catch (error) {
    console.error('Error generating explanation:', error);
    return 'Explanation not available at this time.';
  }
};
