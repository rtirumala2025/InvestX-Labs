/**
 * Generates dynamic system prompts based on user context and query type
 */

const BASE_SYSTEM_PROMPT = `You are InvestIQ, an AI assistant that helps teenagers (ages 13-18) learn about personal finance and investing in a safe, educational way. Your role is to be a knowledgeable but approachable guide who explains financial concepts clearly and simply.

GUIDELINES:
1. Always maintain an encouraging, patient, and non-judgmental tone
2. Break down complex topics into simple, digestible explanations
3. Use analogies and examples relevant to teenagers
4. Never provide specific financial advice - only general education
5. Always include disclaimers about consulting parents/guardians
6. Keep responses concise but thorough (2-3 paragraphs max)
7. Use emojis sparingly to enhance readability
8. Format responses with clear section headers and bullet points`;

const QUERY_TYPE_PROMPTS = {
  education: {
    description: 'General financial education questions',
    instructions: `Focus on explaining concepts clearly with simple examples. Break down complex topics into steps. Use analogies that teenagers can relate to.`,
    example: 'What is compound interest?'
  },
  suggestion: {
    description: 'Requests for investment suggestions',
    instructions: `Provide educational examples of investment strategies, not specific recommendations. Explain the pros and cons of different approaches. Always emphasize diversification and risk management.`,
    example: 'What should I invest in?'
  },
  portfolio: {
    description: 'Portfolio analysis and feedback',
    instructions: `Analyze the portfolio in an educational way. Explain diversification, risk factors, and potential improvements without making specific recommendations.`,
    example: 'How is my portfolio doing?'
  },
  calculation: {
    description: 'Financial calculations',
    instructions: `Perform calculations and explain each step clearly. Show the formula and walk through an example.`,
    example: 'How much will I have if I save $50 per month for 5 years?'
  },
  general: {
    description: 'General conversation',
    instructions: `Be friendly and engaging. Relate financial concepts to their interests when possible.`,
    example: 'Hi, how are you?'
  }
};

const SAFETY_DISCLAIMERS = `

IMPORTANT DISCLAIMERS:
1. I am an AI assistant providing educational information only, not financial advice.
2. Investing involves risk, including potential loss of principal.
3. Past performance is not indicative of future results.
4. Always consult with a parent/guardian or financial advisor before making investment decisions.
5. Examples provided are for educational purposes only.`;

/**
 * Generates a system prompt based on user context and query type
 * @param {Object} params - Parameters for prompt generation
 * @returns {string} Formatted system prompt
 */
export function generateSystemPrompt({
  queryType = 'general',
  age = 16,
  experience_level = 'beginner',
  risk_tolerance = 'moderate',
  investment_goals = [],
  portfolio_value = 0,
  conversationHistory = [],
  conversationSummary = ''
} = {}) {
  // Get query type specific instructions
  const queryInfo = QUERY_TYPE_PROMPTS[queryType] || QUERY_TYPE_PROMPTS.general;
  
  // Build user context string
  const userContext = [
    `User is ${age} years old`,
    `Experience level: ${experience_level}`,
    `Risk tolerance: ${risk_tolerance}`
  ];
  
  if (investment_goals.length > 0) {
    userContext.push(`Investment goals: ${investment_goals.join(', ')}`);
  }
  
  if (portfolio_value > 0) {
    userContext.push(`Portfolio value: $${portfolio_value.toLocaleString()}`);
  }
  
  // Build conversation context
  let conversationContext = '';
  if (conversationHistory.length > 0) {
    conversationContext = '\n\nCONVERSATION HISTORY:\n' + 
      conversationHistory.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
  }
  
  if (conversationSummary) {
    conversationContext += `\n\nCONVERSATION SUMMARY: ${conversationSummary}`;
  }
  
  // Combine all parts
  return `${BASE_SYSTEM_PROMPT}

USER CONTEXT:
${userContext.join('\n')}

CURRENT QUERY TYPE: ${queryType.toUpperCase()}
${queryInfo.instructions}

EXAMPLE QUESTION: "${queryInfo.example}"

${conversationContext}

${SAFETY_DISCLAIMERS}`;
}

/**
 * Generates a summary of the conversation for context
 */
export function generateConversationSummary(conversation) {
  // Simple implementation - can be enhanced with LLM summarization
  const keyPoints = [];
  
  // Extract topics discussed
  const topics = new Set();
  conversation.forEach(msg => {
    if (msg.role === 'user') {
      // Simple keyword extraction (can be enhanced)
      const words = msg.content.toLowerCase().split(/\s+/);
      const financeTerms = words.filter(w => 
        ['invest', 'stock', 'save', 'money', 'portfolio', 'crypto'].includes(w)
      );
      financeTerms.forEach(term => topics.add(term));
    }
  });
  
  if (topics.size > 0) {
    keyPoints.push(`Topics discussed: ${Array.from(topics).join(', ')}`);
  }
  
  // Extract user interests/goals if mentioned
  const goals = [];
  conversation.forEach(msg => {
    if (msg.content.toLowerCase().includes('i want to') || 
        msg.content.toLowerCase().includes('my goal is')) {
      goals.push(msg.content);
    }
  });
  
  if (goals.length > 0) {
    keyPoints.push(`User goals: ${goals.join('; ')}`);
  }
  
  return keyPoints.join('\n') || 'General financial education discussion';
}
