const QUERY_KEYWORDS = {
  education: [
    'what is', 'how does', 'explain', 'meaning of', 'difference between',
    'what are', 'how to', 'basics of', 'understand', 'learn about',
    'tell me about', 'can you explain', 'what does', 'how do',
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

function checkSafetyRequirements(query) {
  if (!query) return false;
  
  const safetyKeywords = [
    'buy', 'sell', 'invest in', 'trade', 'purchase', 'stock', 'stocks',
    'bitcoin', 'ethereum', 'crypto', 'cryptocurrency', 'coin', 'token',
    'nft', 'defi', 'leverage', 'margin', 'short', 'long', 'call', 'put',
    'option', 'futures', 'forex', 'day trading', 'tsla', 'tesla'
  ];
  
  const lowerQuery = query.toLowerCase();
  return safetyKeywords.some(keyword => lowerQuery.includes(keyword));
}

export function classifyQuery(query) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      categories: ['general'],
      primary: 'general',
      requiresSafety: false
    };
  }

  const lowerQuery = query.toLowerCase();
  const categories = [];
  
  const cryptoKeywords = ['bitcoin', 'ethereum', 'crypto', 'cryptocurrency', 'blockchain'];
  const isCryptoRelated = cryptoKeywords.some(keyword => lowerQuery.includes(keyword));
  
  if (isCryptoRelated) {
    categories.push('crypto');
  }
  
  for (const [category, keywords] of Object.entries(QUERY_KEYWORDS)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      categories.push(category);
    }
  }
  
  if (categories.includes('suggestion') && 
      (lowerQuery.includes('how to') || lowerQuery.includes('what is'))) {
    categories.splice(categories.indexOf('suggestion'), 1);
    if (!categories.includes('education')) {
      categories.push('education');
    }
  }
  
  if (categories.length === 0) {
    categories.push('general');
  }
  
  const requiresSafety = checkSafetyRequirements(lowerQuery);
  
  return {
    categories,
    primary: categories[0],
    requiresSafety
  };
}

export function extractEntities(query) {
  const entities = {
    amount: null,
    timeframe: null,
    investmentType: null,
    goal: null
  };
  
  const amountMatch = query.match(/\$?(\d+(?:\.\d{1,2})?)(?:\s*(?:dollars?|usd|\$))?/i);
  if (amountMatch) {
    entities.amount = parseFloat(amountMatch[1]);
  }
  
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
  
  const investmentTypes = ['stocks', 'bonds', 'etf', 'crypto', 'savings', 'index fund'];
  for (const type of investmentTypes) {
    if (query.toLowerCase().includes(type)) {
      entities.investmentType = type;
      break;
    }
  }
  
  const goalMatch = query.match(/to (save|invest|buy|achieve|reach|have)\s+(.+?)(?:\?|\.|$)/i);
  if (goalMatch) {
    entities.goal = goalMatch[2];
  }
  
  return entities;
}

export function requiresDisclaimer(query) {
  if (!query) return false;
  
  const lowerQuery = query.toLowerCase();
  const disclaimerTriggers = [
    'should i', 'what should', 'recommend', 'suggest', 'best',
    'buy now', 'sell now', 'invest in', 'which stock', 'which crypto'
  ];
  
  return disclaimerTriggers.some(trigger => lowerQuery.includes(trigger));
}

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
  
  if (userContext.age) {
    context.push(`User is ${userContext.age} years old.`);
  }
  
  if (userContext.experience_level) {
    context.push(`Experience level: ${userContext.experience_level}.`);
  }
  
  return context.join(' ');
}

