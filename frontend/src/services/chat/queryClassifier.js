/**
 * Classifies user queries into categories for appropriate handling
 */

// Keywords for query classification
const QUERY_KEYWORDS = {
  education: [
    // Basic concepts
    'what is', 'how does', 'explain', 'meaning of', 'difference between',
    'what are', 'how to', 'basics of', 'understand', 'learn about',
    'tell me about', 'can you explain', 'what does', 'how do',
    // Specific topics
    'compound interest', 'stocks', 'bonds', 'etf', 'index fund',
    'diversification', 'risk', 'inflation', 'tax', 'saving', 'budgeting'
  ],
  
  suggestion: [
    'should i', 'what should', 'recommend', 'suggest', 'best way to',
    'good investment', 'where to invest', 'how to invest', 'what to buy',
    'which stock', 'which fund', 'pick for me', 'choose', 'advise'
  ],
  
  portfolio: [
    'my portfolio', 'my investments', 'how am i doing', 'portfolio performance',
    'investment performance', 'track my', 'how is my', 'analyze my',
    'portfolio review', 'investment review'
  ],
  
  calculation: [
    'calculate', 'how much', 'what will', 'future value', 'savings calculator',
    'investment calculator', 'compound calculator', 'if i invest',
    'how many years', 'how long until', 'what if', 'figure out', 'work out'
  ]
};

/**
 * Classifies a user query into a specific category
 * @param {string} query - The user's query
 * @returns {string} The query type ('education', 'suggestion', 'portfolio', 'calculation', or 'general')
 */
export function classifyQuery(query) {
  if (!query || typeof query !== 'string') return 'general';
  
  const lowerQuery = query.toLowerCase();
  
  // Check for each query type
  for (const [type, keywords] of Object.entries(QUERY_KEYWORDS)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      // Special case: If it's a suggestion but asks for education
      if (type === 'suggestion' && 
          (lowerQuery.includes('how to') || lowerQuery.includes('what is'))) {
        return 'education';
      }
      return type;
    }
  }
  
  // Default to general if no specific category matched
  return 'general';
}

/**
 * Extracts key entities from the query
 * @param {string} query - The user's query
 * @returns {Object} Extracted entities
 */
export function extractEntities(query) {
  const entities = {
    amount: null,
    timeframe: null,
    investmentType: null,
    goal: null
  };
  
  // Extract amount (e.g., $100, 500 dollars)
  const amountMatch = query.match(/\$?(\d+(?:\.\d{1,2})?)(?:\s*(?:dollars?|usd|\$))?/i);
  if (amountMatch) {
    entities.amount = parseFloat(amountMatch[1]);
  }
  
  // Extract timeframe (e.g., 5 years, in 10 years)
  const yearMatch = query.match(/(\d+)\s*years?/i);
  const monthMatch = query.match(/(\d+)\s*months?/i);
  
  if (yearMatch) {
    entities.timeframe = {
      value: parseInt(yearMatch[1]),
      unit: 'years'
    };
  } else if (monthMatch) {
    entities.timeframe = {
      value: parseInt(monthMatch[1]),
      unit: 'months'
    };
  }
  
  // Extract investment type
  const investmentTypes = ['stocks', 'bonds', 'etf', 'crypto', 'savings', 'index fund'];
  for (const type of investmentTypes) {
    if (query.toLowerCase().includes(type)) {
      entities.investmentType = type;
      break;
    }
  }
  
  // Extract goal if mentioned
  const goalMatch = query.match(/to (save|invest|buy|achieve|reach|have)\s+(.+?)(?:\?|\.|$)/i);
  if (goalMatch) {
    entities.goal = goalMatch[2];
  }
  
  return entities;
}

/**
 * Determines if the query requires a disclaimer
 * @param {string} query - The user's query
 * @returns {boolean} True if a disclaimer is needed
 */
export function requiresDisclaimer(query) {
  if (!query) return false;
  
  const lowerQuery = query.toLowerCase();
  const disclaimerTriggers = [
    'should i', 'what should', 'recommend', 'suggest', 'best',
    'buy now', 'sell now', 'invest in', 'which stock', 'which crypto'
  ];
  
  return disclaimerTriggers.some(trigger => lowerQuery.includes(trigger));
}

/**
 * Gets additional context for the query
 * @param {string} query - The user's query
 * @param {Object} userContext - User context
 * @returns {string} Additional context for the prompt
 */
export function getQueryContext(query, userContext = {}) {
  const context = [];
  const entities = extractEntities(query);
  
  if (entities.amount) {
    context.push(`The user mentioned an amount of $${entities.amount}.`);
  }
  
  if (entities.timeframe) {
    context.push(`Timeframe: ${entities.timeframe.value} ${entities.timeframe.unit}.`);
  }
  
  if (entities.investmentType) {
    context.push(`Investment type mentioned: ${entities.investmentType}.`);
  }
  
  if (entities.goal) {
    context.push(`User's goal: ${entities.goal}.`);
  }
  
  // Add user context if available
  if (userContext.age) {
    context.push(`User is ${userContext.age} years old.`);
  }
  
  if (userContext.experience_level) {
    context.push(`Experience level: ${userContext.experience_level}.`);
  }
  
  return context.join(' ');
}
