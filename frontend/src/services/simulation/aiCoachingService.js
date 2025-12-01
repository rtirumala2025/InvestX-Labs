/**
 * AI Coaching Service for Simulation Mode
 * Provides contextual trading feedback using LLaMA integration
 */

import { getLlamaResponse } from '../ai/llamaService';

/**
 * Generate AI coaching feedback for a trade
 * @param {Object} tradeData - Trade information
 * @param {Object} portfolioData - Current portfolio state
 * @param {Object} userProfile - User profile and preferences
 * @returns {Promise<string>} AI coaching message
 */
export const getTradeCoaching = async (tradeData, portfolioData, userProfile) => {
  const {
    action, // 'buy' or 'sell'
    symbol,
    shares,
    price,
    companyName
  } = tradeData;

  const {
    holdings = [],
    totalValue = 0,
    virtualBalance = 0,
    riskTolerance = 'moderate',
    goals = []
  } = portfolioData;

  const {
    riskTolerance: userRiskTolerance = riskTolerance,
    investmentGoals = goals
  } = userProfile || {};

  // Build context for AI
  const context = {
    action,
    symbol,
    companyName: companyName || symbol,
    shares,
    price,
    totalTradeValue: shares * price,
    userRiskTolerance: userRiskTolerance,
    userGoals: Array.isArray(investmentGoals) ? investmentGoals.join(', ') : investmentGoals,
    currentHoldings: holdings.map(h => h.symbol).join(', '),
    portfolioValue: totalValue,
    availableCash: virtualBalance,
    holdingsCount: holdings.length,
    isNewPosition: !holdings.find(h => h.symbol === symbol),
    existingPosition: holdings.find(h => h.symbol === symbol)
  };

  // Build AI prompt
  const prompt = `User just made a ${action} trade in their simulation portfolio:

- Action: ${action.toUpperCase()}
- Asset: ${context.symbol} (${context.companyName})
- Quantity: ${shares} shares
- Price: $${price.toFixed(2)}
- Total Value: $${context.totalTradeValue.toFixed(2)}
- User's Risk Tolerance: ${userRiskTolerance}
- User's Goals: ${context.userGoals || 'General investing'}
- Current Portfolio Value: $${totalValue.toFixed(2)}
- Available Cash: $${virtualBalance.toFixed(2)}
- Current Holdings: ${context.currentHoldings || 'None'}
- Holdings Count: ${context.holdingsCount}
- Is New Position: ${context.isNewPosition ? 'Yes' : 'No'}
${context.existingPosition ? `- Existing Position: ${context.existingPosition.shares} shares @ $${context.existingPosition.purchase_price}` : ''}

Provide brief, encouraging feedback (2-3 sentences) that:
1. Acknowledges the trade
2. Offers one educational insight related to this asset or strategy
3. Suggests what to watch for next (educational)

Keep tone positive and educational. This is a simulation for learning.`;

  try {
    const response = await getLlamaResponse(prompt, {
      holdings,
      totalValue,
      diversificationScore: holdings.length * 10 // Simple diversification score
    });

    return response || generateFallbackCoaching(context);
  } catch (error) {
    console.error('Error getting AI coaching:', error);
    return generateFallbackCoaching(context);
  }
};

/**
 * Generate fallback coaching when AI is unavailable
 * @param {Object} context - Trade context
 * @returns {string} Fallback coaching message
 */
const generateFallbackCoaching = (context) => {
  const { action, symbol, isNewPosition, existingPosition } = context;

  if (action === 'buy') {
    if (isNewPosition) {
      return `Great! You've added ${symbol} to your portfolio. Remember to research the company's fundamentals, check its financial health, and consider how it fits with your other holdings for proper diversification.`;
    } else {
      return `You're adding to your existing position in ${symbol}. This is called "averaging down" or "averaging up" depending on the price. Consider your overall allocation to this stock to avoid over-concentration.`;
    }
  } else {
    // sell
    if (existingPosition) {
      const gainLoss = (context.price - existingPosition.purchase_price) * context.shares;
      if (gainLoss > 0) {
        return `Nice trade! You've realized a profit on ${symbol}. Remember that taking profits is part of good portfolio management, but also consider your long-term investment thesis before selling.`;
      } else {
        return `You've sold ${symbol} at a loss. This could be a strategic decision to cut losses or reallocate capital. Consider reviewing what you learned from this position.`;
      }
    }
  }

  return `Trade executed successfully! Keep learning and refining your investment strategy.`;
};

/**
 * Generate AI coaching for portfolio review
 * @param {Object} portfolioData - Current portfolio state
 * @param {Object} userProfile - User profile
 * @returns {Promise<string>} AI coaching message
 */
export const getPortfolioReviewCoaching = async (portfolioData, userProfile) => {
  const {
    holdings = [],
    totalValue = 0,
    totalReturn = 0,
    totalReturnPercent = 0,
    assetAllocation = {},
    sectorAllocation = {}
  } = portfolioData;

  const prompt = `User is reviewing their simulation portfolio:

- Total Portfolio Value: $${totalValue.toFixed(2)}
- Total Return: $${totalReturn.toFixed(2)} (${totalReturnPercent.toFixed(2)}%)
- Number of Holdings: ${holdings.length}
- Holdings: ${holdings.map(h => `${h.symbol} (${h.shares} shares)`).join(', ') || 'None'}
- Asset Allocation: ${Object.keys(assetAllocation).length} different assets
- Sector Allocation: ${Object.keys(sectorAllocation).length} sectors

Provide 2-3 sentences of educational feedback about:
1. Portfolio diversification
2. Performance insights
3. Suggestions for improvement (educational, not prescriptive)

Keep tone positive and educational.`;

  try {
    const response = await getLlamaResponse(prompt, {
      holdings,
      totalValue,
      diversificationScore: holdings.length * 10
    });

    return response || generateFallbackPortfolioReview(portfolioData);
  } catch (error) {
    console.error('Error getting portfolio review coaching:', error);
    return generateFallbackPortfolioReview(portfolioData);
  }
};

/**
 * Generate fallback portfolio review
 * @param {Object} portfolioData - Portfolio data
 * @returns {string} Fallback message
 */
const generateFallbackPortfolioReview = (portfolioData) => {
  const { holdings = [], totalReturnPercent = 0 } = portfolioData;

  if (holdings.length === 0) {
    return `Your portfolio is empty. Consider starting with a few well-researched stocks across different sectors to build a diversified portfolio.`;
  }

  if (totalReturnPercent > 0) {
    return `Great job! Your portfolio is up ${totalReturnPercent.toFixed(2)}%. Remember that past performance doesn't guarantee future results. Continue learning and stay disciplined with your strategy.`;
  } else {
    return `Your portfolio is currently down ${Math.abs(totalReturnPercent).toFixed(2)}%. This is normal in investing. Use this as a learning opportunity to understand market volatility and the importance of long-term thinking.`;
  }
};

/**
 * Generate AI coaching for achievement unlock
 * @param {Object} achievement - Achievement data
 * @param {Object} portfolioData - Portfolio data
 * @returns {Promise<string>} AI coaching message
 */
export const getAchievementCoaching = async (achievement, portfolioData) => {
  const prompt = `User just unlocked an achievement in the simulation:

- Achievement: ${achievement.badge_name || achievement.type}
- Description: ${achievement.badge_description || achievement.description || 'Great progress!'}
- Portfolio Value: $${portfolioData.totalValue?.toFixed(2) || '0.00'}

Provide a brief, encouraging message (1-2 sentences) celebrating this milestone and encouraging continued learning.`;

  try {
    const response = await getLlamaResponse(prompt, portfolioData);
    return response || `Congratulations on unlocking ${achievement.badge_name || 'this achievement'}! Keep up the great work and continue learning about investing.`;
  } catch (error) {
    console.error('Error getting achievement coaching:', error);
    return `Congratulations on unlocking ${achievement.badge_name || 'this achievement'}! Keep up the great work!`;
  }
};

