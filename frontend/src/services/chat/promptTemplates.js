const BASE_SYSTEM_PROMPT = `You are InvestIQ, an AI financial education assistant designed specifically for teenagers (ages 13-18). Your mission is to make personal finance and investing accessible, engaging, and safe for young learners.

CORE PRINCIPLES:
1. Educational First: Always teach concepts, never give specific financial advice
2. Age-Appropriate: Use language and examples relevant to teenagers
3. Safety-Focused: Emphasize parental involvement and risk awareness
4. Encouraging: Build confidence while maintaining realistic expectations
5. Practical: Connect concepts to real-world scenarios teens understand

COMMUNICATION STYLE:
- Clear, conversational tone without being condescending
- Break complex topics into digestible chunks
- Use relatable analogies (gaming, social media, streaming services)
- Minimal emoji use (1-2 per response max) for emphasis only
- Structured formatting with headers and bullet points`;

const QUERY_TYPE_PROMPTS = {
  education: {
    description: 'Financial education and concept explanation',
    instructions: `Explain the concept clearly using the following structure:
1. Simple definition in one sentence
2. Why it matters for teenagers
3. Real-world example they can relate to
4. Key takeaways (2-3 bullet points)
5. Next steps or related concepts to explore

Use analogies to gaming, subscriptions, or part-time jobs. Keep explanations under 200 words unless complexity requires more detail.`,
    example: 'What is compound interest?',
    responseLength: 'medium',
    includeExamples: true,
    includeActionItems: true
  },
  suggestion: {
    description: 'Investment suggestions and strategy guidance',
    instructions: `Provide educational guidance without specific recommendations:
1. Acknowledge their interest and redirect to learning
2. Explain general strategies (diversification, long-term thinking)
3. Present 2-3 example approaches with pros/cons
4. Emphasize the importance of research and parental guidance
5. Suggest beginner-friendly platforms (Acorns, Greenlight, Fidelity Youth)

Frame everything as "here's how people typically approach this" rather than "you should do this."`,
    example: 'What should I invest in?',
    responseLength: 'long',
    includeExamples: true,
    includeActionItems: true,
    requiresDisclaimer: true
  },
  portfolio: {
    description: 'Portfolio analysis and performance feedback',
    instructions: `Analyze their portfolio educationally:
1. Acknowledge what they're doing well
2. Explain diversification and risk in their context
3. Identify learning opportunities (not mistakes)
4. Suggest educational resources for improvement
5. Encourage tracking and learning from results

Focus on the learning journey, not performance metrics. Celebrate their engagement with investing.`,
    example: 'How is my portfolio doing?',
    responseLength: 'long',
    includeExamples: true,
    includeActionItems: true,
    requiresDisclaimer: true
  },
  calculation: {
    description: 'Financial calculations and projections',
    instructions: `Perform calculations with full transparency:
1. State the formula clearly
2. Show step-by-step calculation
3. Explain what each variable means
4. Present the result with context
5. Note assumptions and limitations

Use realistic numbers for teenagers (allowance, part-time job income). Explain how changing variables affects outcomes.`,
    example: 'How much will I have if I save $50 per month for 5 years?',
    responseLength: 'medium',
    includeExamples: true,
    includeActionItems: false
  },
  general: {
    description: 'General conversation and greetings',
    instructions: `Be friendly and helpful:
1. Respond warmly to greetings
2. Offer to help with financial questions
3. Suggest popular topics if they seem unsure
4. Keep it brief and inviting

Maintain the educational assistant persona while being approachable.`,
    example: 'Hi, how are you?',
    responseLength: 'short',
    includeExamples: false,
    includeActionItems: false
  }
};

const EXPERIENCE_LEVEL_ADJUSTMENTS = {
  beginner: {
    tone: 'patient and foundational',
    complexity: 'basic concepts only',
    jargon: 'minimal, always explained',
    examples: 'everyday scenarios'
  },
  intermediate: {
    tone: 'encouraging and informative',
    complexity: 'moderate depth with connections',
    jargon: 'some technical terms with context',
    examples: 'mix of basic and real market examples'
  },
  advanced: {
    tone: 'collaborative and detailed',
    complexity: 'in-depth analysis and strategies',
    jargon: 'appropriate technical language',
    examples: 'real market scenarios and case studies'
  }
};

const AGE_SPECIFIC_GUIDANCE = {
  '13-14': {
    focus: 'Building foundational knowledge and savings habits',
    platforms: 'Greenlight, GoHenry (with parental control)',
    examples: 'Allowance management, birthday money, small savings goals'
  },
  '15-16': {
    focus: 'Understanding investment basics and goal setting',
    platforms: 'Greenlight Invest, Fidelity Youth Account',
    examples: 'Part-time job income, saving for car/college, first investments'
  },
  '17-18': {
    focus: 'Preparing for financial independence and college',
    platforms: 'Acorns, Robinhood (18+), Fidelity, Charles Schwab',
    examples: 'College savings, first job 401k, emergency fund building'
  }
};

export function getPromptTemplate(type) {
  if (type && QUERY_TYPE_PROMPTS[type]) {
    return {
      ...QUERY_TYPE_PROMPTS[type],
      systemPrompt: BASE_SYSTEM_PROMPT
    };
  }
  return null;
}

export const PROMPT_CONSTANTS = {
  BASE_SYSTEM_PROMPT,
  QUERY_TYPE_PROMPTS
};

export function generateSystemPrompt({
  queryType = 'general',
  age = 16,
  experience_level = 'beginner',
  risk_tolerance = 'moderate',
  investment_goals = [],
  portfolio_value = 0,
  budget = null,
  interests = [],
  conversationHistory = [],
  conversationSummary = '',
  userPreferences = {}
} = {}) {
  const template = getPromptTemplate(queryType) || getPromptTemplate('general');
  const experienceAdjustment = EXPERIENCE_LEVEL_ADJUSTMENTS[experience_level] || EXPERIENCE_LEVEL_ADJUSTMENTS.beginner;
  
  // Determine age group
  let ageGroup = '15-16';
  if (age <= 14) ageGroup = '13-14';
  else if (age >= 17) ageGroup = '17-18';
  const ageGuidance = AGE_SPECIFIC_GUIDANCE[ageGroup];
  
  // Build personalized context
  const userContext = [];
  userContext.push(`Age: ${age} years old`);
  userContext.push(`Experience Level: ${experience_level} (${experienceAdjustment.tone})`);
  userContext.push(`Risk Tolerance: ${risk_tolerance}`);
  
  if (budget) {
    userContext.push(`Monthly Budget: $${budget}`);
  }
  
  if (portfolio_value > 0) {
    userContext.push(`Current Portfolio Value: $${portfolio_value.toLocaleString()}`);
  }
  
  if (investment_goals && investment_goals.length > 0) {
    userContext.push(`Goals: ${investment_goals.join(', ')}`);
  }
  
  if (interests && interests.length > 0) {
    userContext.push(`Interests: ${interests.join(', ')}`);
  }
  
  // Build response guidance
  const responseGuidance = [];
  responseGuidance.push(`Response Length: ${template.responseLength || 'medium'}`);
  responseGuidance.push(`Complexity: ${experienceAdjustment.complexity}`);
  responseGuidance.push(`Jargon Level: ${experienceAdjustment.jargon}`);
  responseGuidance.push(`Example Style: ${experienceAdjustment.examples}`);
  
  if (template.includeExamples) {
    responseGuidance.push(`Include practical examples using: ${ageGuidance.examples}`);
  }
  
  if (template.includeActionItems) {
    responseGuidance.push('Include actionable next steps');
  }
  
  // Build age-specific guidance
  const ageSpecificInfo = `
AGE-SPECIFIC CONTEXT (${ageGroup} years):
- Focus Area: ${ageGuidance.focus}
- Recommended Platforms: ${ageGuidance.platforms}
- Relevant Examples: ${ageGuidance.examples}`;
  
  // Add conversation context if available
  let conversationContext = '';
  if (conversationSummary) {
    conversationContext = `\n\nCONVERSATION CONTEXT:\n${conversationSummary}`;
  }
  
  // Build disclaimer if required
  let disclaimer = '';
  if (template.requiresDisclaimer) {
    disclaimer = `\n\nIMPORTANT DISCLAIMERS:
- This is educational information only, not financial advice
- Always consult with a parent/guardian before making financial decisions
- Past performance doesn't guarantee future results
- All investments carry risk, including potential loss of principal`;
  }
  
  return `${BASE_SYSTEM_PROMPT}

QUERY TYPE: ${queryType.toUpperCase()}
${template.instructions}

USER PROFILE:
${userContext.join('\n')}

RESPONSE GUIDANCE:
${responseGuidance.join('\n')}
${ageSpecificInfo}${conversationContext}${disclaimer}`;
}

export function generateConversationSummary(conversation, options = {}) {
  if (!conversation || !conversation.length) return '';
  
  const {
    maxMessages = 10,
    maxTokens = 500,
    includeMetadata = false,
    semanticCompression = false
  } = options;
  
  // For long conversations, use compression
  if (conversation.length > maxMessages && semanticCompression) {
    return compressConversationSemantically(conversation, maxTokens);
  }
  
  // Get recent messages
  const recentMessages = conversation.slice(-maxMessages);
  
  // Extract key topics and themes
  const topics = extractConversationTopics(recentMessages);
  const userGoals = extractUserGoals(recentMessages);
  
  // Build structured summary
  const summaryParts = [];
  
  if (topics.length > 0) {
    summaryParts.push(`Topics Discussed: ${topics.join(', ')}`);
  }
  
  if (userGoals.length > 0) {
    summaryParts.push(`User Goals: ${userGoals.join(', ')}`);
  }
  
  // Add recent exchange context
  const recentExchange = recentMessages.slice(-3).map(msg => {
    const preview = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
    return `${msg.role === 'user' ? 'User' : 'Assistant'}: ${preview}`;
  }).join('\n');
  
  summaryParts.push(`\nRecent Exchange:\n${recentExchange}`);
  
  // Add metadata if requested
  if (includeMetadata && recentMessages.length > 0) {
    const lastMessage = recentMessages[recentMessages.length - 1];
    if (lastMessage.metadata) {
      summaryParts.push(`\nContext: ${JSON.stringify(lastMessage.metadata)}`);
    }
  }
  
  return summaryParts.join('\n');
}

function extractConversationTopics(messages) {
  const topics = new Set();
  const financialKeywords = {
    'stocks': 'Stock Investing',
    'bonds': 'Bonds',
    'etf': 'ETFs',
    'index fund': 'Index Funds',
    'crypto': 'Cryptocurrency',
    'bitcoin': 'Cryptocurrency',
    'savings': 'Savings',
    'budget': 'Budgeting',
    'compound interest': 'Compound Interest',
    'diversification': 'Diversification',
    'risk': 'Risk Management',
    'portfolio': 'Portfolio Management',
    '401k': 'Retirement Accounts',
    'roth ira': 'Retirement Accounts'
  };
  
  messages.forEach(msg => {
    const content = msg.content.toLowerCase();
    Object.entries(financialKeywords).forEach(([keyword, topic]) => {
      if (content.includes(keyword)) {
        topics.add(topic);
      }
    });
  });
  
  return Array.from(topics).slice(0, 5);
}

function extractUserGoals(messages) {
  const goals = [];
  const goalPatterns = [
    /(?:want to|trying to|goal is to|planning to|hoping to)\s+([^.!?]+)/gi,
    /(?:save for|invest for|buy)\s+([^.!?]+)/gi
  ];
  
  messages.forEach(msg => {
    if (msg.role === 'user') {
      goalPatterns.forEach(pattern => {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].length < 50) {
            goals.push(match[1].trim());
          }
        }
      });
    }
  });
  
  return goals.slice(0, 3);
}

function compressConversationSemantically(conversation, maxTokens) {
  // Simple compression: extract key points from older messages
  const oldMessages = conversation.slice(0, -5);
  const recentMessages = conversation.slice(-5);
  
  const keyPoints = [];
  const topics = extractConversationTopics(oldMessages);
  
  if (topics.length > 0) {
    keyPoints.push(`Previously discussed: ${topics.join(', ')}`);
  }
  
  // Add recent context
  const recentSummary = recentMessages.map(msg => 
    `${msg.role}: ${msg.content.substring(0, 80)}...`
  ).join('\n');
  
  return `${keyPoints.join('\n')}\n\nRecent:\n${recentSummary}`;
}

export function compressLongConversation(messages, targetLength = 2000) {
  if (!messages || messages.length === 0) return [];
  
  // Always keep the most recent messages
  const recentCount = Math.min(5, messages.length);
  const recentMessages = messages.slice(-recentCount);
  
  // If total is short enough, return all
  const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  if (totalLength <= targetLength) {
    return messages;
  }
  
  // Create compressed summary of older messages
  const olderMessages = messages.slice(0, -recentCount);
  const summary = generateConversationSummary(olderMessages, { 
    maxMessages: olderMessages.length,
    semanticCompression: true 
  });
  
  // Return summary as system message + recent messages
  return [
    {
      role: 'system',
      content: `Previous conversation summary:\n${summary}`,
      metadata: { compressed: true, originalCount: olderMessages.length }
    },
    ...recentMessages
  ];
}

export default {
  getPromptTemplate,
  generateSystemPrompt,
  generateConversationSummary,
  PROMPT_CONSTANTS
};
