/**
 * AI Explanation Generator for investment concepts and recommendations
 */

import { explainInvestmentConcept } from './claudeAPI';

/**
 * Generate explanation for investment recommendation
 * @param {Object} recommendation - Investment recommendation
 * @param {Object} userProfile - User profile
 * @returns {Promise<string>} Detailed explanation
 */
export const generateRecommendationExplanation = async (recommendation, userProfile) => {
  try {
    const explanation = `
      Based on your ${userProfile.riskProfile} risk profile and ${userProfile.investmentExperience} 
      experience level, this ${recommendation.type} recommendation for ${recommendation.symbol} 
      is suggested with ${recommendation.confidence}% confidence.
      
      The reasoning behind this recommendation includes:
      - Market analysis showing ${recommendation.marketFactors?.join(', ')}
      - Risk assessment indicating ${recommendation.riskLevel} risk level
      - Expected impact: ${recommendation.expectedImpact}
      
      This aligns with your investment goals of ${userProfile.investmentGoals?.join(', ')}.
    `;
    
    return explanation;
  } catch (error) {
    console.error('Error generating recommendation explanation:', error);
    return 'Detailed explanation not available at this time.';
  }
};

/**
 * Generate educational explanation for investment concept
 * @param {string} concept - Investment concept
 * @param {string} userLevel - User's knowledge level
 * @returns {Promise<string>} Educational explanation
 */
export const generateEducationalExplanation = async (concept, userLevel = 'beginner') => {
  try {
    return await explainInvestmentConcept(concept, userLevel);
  } catch (error) {
    console.error('Error generating educational explanation:', error);
    return `Here's a simple explanation of ${concept}: This is an important investment concept that helps you make better financial decisions.`;
  }
};

/**
 * Generate market analysis explanation
 * @param {Object} marketData - Market data
 * @param {Array} symbols - Stock symbols
 * @returns {Promise<string>} Market analysis explanation
 */
export const generateMarketAnalysisExplanation = async (marketData, symbols) => {
  try {
    const explanation = `
      Current market analysis for ${symbols.join(', ')}:
      
      Market Trends:
      - Overall market sentiment: ${marketData.sentiment || 'Neutral'}
      - Volatility levels: ${marketData.volatility || 'Moderate'}
      - Key factors: ${marketData.factors?.join(', ') || 'Economic indicators, earnings reports'}
      
      Individual Stock Analysis:
      ${symbols.map(symbol => `
        ${symbol}: ${marketData[symbol]?.trend || 'Stable'} trend, 
        ${marketData[symbol]?.recommendation || 'Hold'} recommendation
      `).join('')}
      
      Risk Factors:
      - Market volatility: ${marketData.riskFactors?.join(', ') || 'General market risks'}
      - Economic conditions: ${marketData.economicConditions || 'Stable'}
    `;
    
    return explanation;
  } catch (error) {
    console.error('Error generating market analysis explanation:', error);
    return 'Market analysis explanation not available at this time.';
  }
};

/**
 * Generate portfolio performance explanation
 * @param {Object} portfolioData - Portfolio data
 * @param {Object} performanceMetrics - Performance metrics
 * @returns {Promise<string>} Portfolio performance explanation
 */
export const generatePortfolioPerformanceExplanation = async (portfolioData, performanceMetrics) => {
  try {
    const explanation = `
      Your portfolio performance analysis:
      
      Overall Performance:
      - Total return: ${performanceMetrics.totalReturn || '0%'}
      - Annualized return: ${performanceMetrics.annualizedReturn || '0%'}
      - Sharpe ratio: ${performanceMetrics.sharpeRatio || 'N/A'}
      
      Portfolio Composition:
      - Total value: $${portfolioData.totalValue || 0}
      - Number of holdings: ${portfolioData.holdings?.length || 0}
      - Diversification score: ${portfolioData.diversificationScore || 'N/A'}
      
      Key Insights:
      - Your portfolio is ${performanceMetrics.totalReturn > 0 ? 'performing well' : 'underperforming'}
      - Risk level: ${portfolioData.riskScore || 'Moderate'}
      - Top performing asset: ${performanceMetrics.topPerformer || 'N/A'}
      
      Recommendations:
      - Consider ${performanceMetrics.recommendations?.join(', ') || 'maintaining current strategy'}
    `;
    
    return explanation;
  } catch (error) {
    console.error('Error generating portfolio performance explanation:', error);
    return 'Portfolio performance explanation not available at this time.';
  }
};

/**
 * Generate risk explanation
 * @param {Object} riskAssessment - Risk assessment data
 * @param {Object} userProfile - User profile
 * @returns {Promise<string>} Risk explanation
 */
export const generateRiskExplanation = async (riskAssessment, userProfile) => {
  try {
    const explanation = `
      Your risk assessment results:
      
      Risk Profile: ${userProfile.riskProfile || 'Not assessed'}
      Risk Score: ${riskAssessment.riskScore || 'N/A'}/100
      Risk Level: ${riskAssessment.riskLevel || 'Moderate'}
      
      Risk Factors:
      - Age factor: ${riskAssessment.ageFactor || 'Neutral'}
      - Experience factor: ${riskAssessment.experienceFactor || 'Neutral'}
      - Income factor: ${riskAssessment.incomeFactor || 'Neutral'}
      - Portfolio diversification: ${riskAssessment.diversificationScore || 'N/A'}
      
      Risk Recommendations:
      ${riskAssessment.recommendations?.map(rec => `- ${rec.title}: ${rec.description}`).join('\n') || 'No specific recommendations at this time.'}
      
      This assessment helps us provide personalized investment suggestions that match your risk tolerance.
    `;
    
    return explanation;
  } catch (error) {
    console.error('Error generating risk explanation:', error);
    return 'Risk assessment explanation not available at this time.';
  }
};
