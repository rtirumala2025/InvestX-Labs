/**
 * Claude API service for AI-powered investment insights
 * This service handles communication with Anthropic's Claude API
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.REACT_APP_CLAUDE_API_KEY;

/**
 * Send a request to Claude API
 * @param {string} message - The message to send to Claude
 * @param {Object} context - Additional context for the request
 * @returns {Promise<Object>} Claude's response
 */
export const sendToClaude = async (message, context = {}) => {
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `${message}\n\nContext: ${JSON.stringify(context)}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
};

/**
 * Generate investment advice based on user profile and market data
 * @param {Object} userProfile - User's investment profile
 * @param {Object} portfolioData - User's portfolio data
 * @param {Object} marketData - Current market data
 * @returns {Promise<Object>} AI-generated investment advice
 */
export const generateInvestmentAdvice = async (userProfile, portfolioData, marketData) => {
  const prompt = `
    As an AI investment advisor, analyze the following information and provide personalized investment advice:
    
    User Profile: ${JSON.stringify(userProfile)}
    Portfolio: ${JSON.stringify(portfolioData)}
    Market Data: ${JSON.stringify(marketData)}
    
    Please provide:
    1. Risk assessment
    2. Portfolio optimization suggestions
    3. Market opportunities
    4. Risk mitigation strategies
  `;

  try {
    const response = await sendToClaude(prompt);
    return {
      advice: response.content[0].text,
      confidence: 0.85,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Explain investment concepts in simple terms
 * @param {string} concept - Investment concept to explain
 * @param {string} userLevel - User's knowledge level (beginner, intermediate, advanced)
 * @returns {Promise<string>} Simplified explanation
 */
export const explainInvestmentConcept = async (concept, userLevel = 'beginner') => {
  const prompt = `
    Explain the investment concept "${concept}" for a ${userLevel} level investor.
    Use simple language, provide examples, and include key takeaways.
  `;

  try {
    const response = await sendToClaude(prompt);
    return response.content[0].text;
  } catch (error) {
    throw error;
  }
};

/**
 * Analyze market sentiment and trends
 * @param {Array} symbols - Stock symbols to analyze
 * @param {Object} marketData - Current market data
 * @returns {Promise<Object>} Market sentiment analysis
 */
export const analyzeMarketSentiment = async (symbols, marketData) => {
  const prompt = `
    Analyze the market sentiment and trends for the following stocks: ${symbols.join(', ')}
    
    Market Data: ${JSON.stringify(marketData)}
    
    Provide:
    1. Overall market sentiment
    2. Individual stock analysis
    3. Trend predictions
    4. Risk factors
  `;

  try {
    const response = await sendToClaude(prompt);
    return {
      sentiment: response.content[0].text,
      confidence: 0.80,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw error;
  }
};
