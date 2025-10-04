/**
 * LLaMA 4 Scout AI Service for InvestX Labs
 * Provides intelligent investment insights and portfolio analysis
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = process.env.REACT_APP_LLAMA_API_KEY;
const MODEL = 'meta-llama/llama-3.2-90b-vision-instruct';

// Cache for AI responses to avoid excessive calls
const responseCache = new Map();
const CACHE_DURATION = 300000; // 5 minutes cache for AI responses

/**
 * Generate investment system prompt based on user portfolio
 * @param {Object} portfolioData - User's portfolio information
 * @returns {string} System prompt for LLaMA
 */
const generateSystemPrompt = (portfolioData) => {
  const { holdings = [], totalValue = 0, diversificationScore = 0 } = portfolioData;
  
  return `You are Finley, an expert AI investment advisor for InvestX Labs. You provide personalized, actionable investment advice based on real portfolio data.

PORTFOLIO CONTEXT:
- Total Portfolio Value: $${totalValue.toLocaleString()}
- Number of Holdings: ${holdings.length}
- Diversification Score: ${diversificationScore}/100
- Current Holdings: ${holdings.map(h => `${h.symbol} (${h.shares} shares, $${h.currentPrice || h.purchasePrice})`).join(', ') || 'None'}

GUIDELINES:
1. Provide specific, actionable advice based on the actual portfolio
2. Consider risk tolerance, diversification, and market conditions
3. Suggest concrete next steps (buy/sell/hold recommendations)
4. Explain reasoning clearly for educational value
5. Keep responses concise but informative (2-3 paragraphs max)
6. Always consider the user's current holdings when making suggestions
7. If portfolio is empty, focus on beginner-friendly investment strategies

TONE: Professional yet approachable, educational, confident but not pushy.`;
};

/**
 * Call LLaMA 4 Scout via OpenRouter API
 * @param {string} userMessage - User's question or request
 * @param {Object} portfolioData - User's portfolio context
 * @returns {Promise<string>} AI response
 */
export const getLlamaResponse = async (userMessage, portfolioData = {}) => {
  console.log('🤖 [LlamaService] getLlamaResponse called');
  console.log('🤖 [LlamaService] User message:', userMessage);
  console.log('🤖 [LlamaService] Portfolio context:', {
    holdingsCount: portfolioData.holdings?.length || 0,
    totalValue: portfolioData.totalValue || 0
  });

  if (!userMessage?.trim()) {
    console.warn('🤖 [LlamaService] ⚠️ No user message provided');
    return null;
  }

  if (!API_KEY) {
    console.warn('🤖 [LlamaService] ⚠️ LLaMA API key not found in environment variables');
    throw new Error('AI service is not configured. Please check your API key.');
  }

  // Check cache first
  const cacheKey = `${userMessage.trim()}_${JSON.stringify(portfolioData)}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('🤖 [LlamaService] 🎯 Cache HIT - returning cached response');
    return cached.response;
  }

  try {
    const systemPrompt = generateSystemPrompt(portfolioData);
    
    const requestBody = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    };

    console.log('🤖 [LlamaService] 🌐 Sending request to OpenRouter API');
    console.log('🤖 [LlamaService] Model:', MODEL);
    console.log('🤖 [LlamaService] Request body:', {
      model: requestBody.model,
      messagesCount: requestBody.messages.length,
      maxTokens: requestBody.max_tokens
    });

    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'InvestX Labs'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('🤖 [LlamaService] 📥 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('🤖 [LlamaService] ❌ API Error:', response.status, errorData);
      
      if (response.status === 429) {
        throw new Error('AI service is temporarily busy. Please try again in a moment.');
      } else if (response.status === 401) {
        throw new Error('AI service authentication failed. Please check configuration.');
      } else if (response.status >= 500) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error('Failed to get AI response. Please try again.');
      }
    }

    const data = await response.json();
    console.log('🤖 [LlamaService] 📊 Raw API response:', {
      id: data.id,
      model: data.model,
      usage: data.usage,
      choicesCount: data.choices?.length
    });

    if (!data.choices || data.choices.length === 0) {
      console.error('🤖 [LlamaService] ❌ No choices in API response');
      throw new Error('AI service returned an invalid response.');
    }

    const aiResponse = data.choices[0].message.content;
    console.log('🤖 [LlamaService] ✅ AI response received:', aiResponse.substring(0, 100) + '...');
    console.log('🤖 [LlamaService] 📊 Token usage:', data.usage);

    // Cache the response
    responseCache.set(cacheKey, {
      response: aiResponse,
      timestamp: Date.now()
    });
    console.log('🤖 [LlamaService] 💾 Response cached - cache size:', responseCache.size);

    return aiResponse;

  } catch (error) {
    console.error('🤖 [LlamaService] ❌ Error calling LLaMA API:', error);
    
    // Try to return cached response as fallback
    const cached = responseCache.get(cacheKey);
    if (cached) {
      console.log('🤖 [LlamaService] 🔄 Returning stale cached response as fallback');
      return cached.response;
    }
    
    throw error;
  }
};

/**
 * Generate portfolio analysis using AI
 * @param {Object} portfolioData - Complete portfolio data
 * @returns {Promise<string>} AI analysis
 */
export const getPortfolioAnalysis = async (portfolioData) => {
  console.log('🤖 [LlamaService] getPortfolioAnalysis called');
  
  const analysisPrompt = `Please analyze my current investment portfolio and provide:
1. Overall portfolio health assessment
2. Diversification analysis
3. Risk evaluation
4. Specific recommendations for improvement
5. Suggested next actions

Focus on actionable insights based on my current holdings and market conditions.`;

  return await getLlamaResponse(analysisPrompt, portfolioData);
};

/**
 * Get investment suggestions for a specific amount
 * @param {number} amount - Investment amount
 * @param {Object} portfolioData - Current portfolio context
 * @returns {Promise<string>} AI suggestions
 */
export const getInvestmentSuggestions = async (amount, portfolioData) => {
  console.log('🤖 [LlamaService] getInvestmentSuggestions called for amount:', amount);
  
  const suggestionPrompt = `I have $${amount} to invest. Based on my current portfolio, what specific investments would you recommend? Please provide:
1. 2-3 specific stock or ETF recommendations
2. Reasoning for each recommendation
3. How these fit with my current holdings
4. Risk considerations
5. Suggested allocation percentages

Be specific with ticker symbols and rationale.`;

  return await getLlamaResponse(suggestionPrompt, portfolioData);
};

/**
 * Get market insights and commentary
 * @param {Object} portfolioData - Portfolio context
 * @returns {Promise<string>} Market insights
 */
export const getMarketInsights = async (portfolioData) => {
  console.log('🤖 [LlamaService] getMarketInsights called');
  
  const insightsPrompt = `Given my current portfolio composition, what are the key market trends and developments I should be aware of? Please provide:
1. Relevant market trends affecting my holdings
2. Upcoming events or earnings that might impact my investments
3. Sector-specific insights
4. Risk factors to monitor
5. Opportunities to consider

Keep it focused on what's most relevant to my specific investments.`;

  return await getLlamaResponse(insightsPrompt, portfolioData);
};

/**
 * Clear the AI response cache
 */
export const clearAICache = () => {
  responseCache.clear();
  console.log('🤖 [LlamaService] 🧹 AI response cache cleared');
};

/**
 * Get cache statistics
 */
export const getAICacheStats = () => {
  return {
    size: responseCache.size,
    entries: Array.from(responseCache.keys()).map(key => ({
      key: key.substring(0, 50) + '...',
      age: Date.now() - responseCache.get(key).timestamp
    }))
  };
};
