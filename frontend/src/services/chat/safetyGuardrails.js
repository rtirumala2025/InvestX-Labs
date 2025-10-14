import { RESPONSE_TEMPLATES } from './promptTemplates';

/**
 * Safety guardrails for chatbot responses
 */

// List of restricted topics and patterns
const RESTRICTED_TOPICS = [
  // Financial advice
  { 
    pattern: /(?:give|provide|offer|suggest).*financial advice/gi, 
    message: 'I can only provide educational information, not personalized financial advice.'
  },
  
  // Specific stock recommendations
  { 
    pattern: /(?:buy|sell|invest in|short|go long on|bet against).*\b[A-Z]{1,5}\b/gi, 
    message: 'I cannot provide specific investment recommendations for individual stocks.'
  },
  
  // Illegal activities
  { 
    pattern: /(?:insider trading|market manipulation|pump and dump|ponzi|pyramid scheme)/gi, 
    message: 'I cannot provide information about illegal financial activities.'
  },
  
  // Personal information requests
  { 
    pattern: /(?:what is your|what's your|share your|give me your) (?:name|age|location|contact|phone|email|address)/gi, 
    message: 'I\'m an AI assistant and don\'t have personal information to share.'
  },
  
  // Sensitive personal questions
  { 
    pattern: /(?:how much money do you have|what's your net worth|how much do you earn)/gi, 
    message: 'I\'m an AI assistant and don\'t have personal finances.'
  },
  
  // Inappropriate content
  { 
    pattern: /(?:fuck|shit|asshole|bitch|dick|pussy|cunt|whore|slut|nigger|faggot|retard)/gi, 
    message: 'Please keep the conversation respectful and appropriate.'
  }
];

// Age-appropriate disclaimers
const AGE_DISCLAIMERS = {
  '13-15': 'Remember, you should always talk to a parent or guardian before making any financial decisions.',
  '16-17': 'Since you\'re under 18, make sure to involve a parent or guardian in any financial decisions.',
  '18+': 'This information is for educational purposes only. Consider consulting a financial advisor for personalized advice.'
};

// Risk level warnings
const RISK_WARNINGS = {
  high: '⚠️ High-risk investments may result in significant losses. Only invest what you can afford to lose.',
  medium: 'Moderate-risk investments carry some risk of loss. Make sure you understand the risks before investing.',
  low: 'While lower risk, all investments carry some level of risk. Consider your financial situation carefully.'
};

// New safety patterns for enhanced protection
const SAFETY_PATTERNS = {
  specificStock: /\b(?:should\s+I|buy|invest\s+in|purchase)\s+(?:stock|shares?)\s+(?:of|in|for)?\s*([A-Z]{1,5}|Apple|Tesla|Amazon|Google|Microsoft|Meta|Netflix|Nvidia|AMD|Intel|Spotify|Disney|Nike)\b/i,
  crypto: /\b(bitcoin|BTC|ethereum|ETH|crypto|cryptocurrency|nft|web3|defi|blockchain|dogecoin|doge|altcoin|token)\b/i,
  ageRestricted: /\b(margin|options?|futures?|forex|leverage|leveraged|short|shorting|short.?sell|day.?trad(?:e|ing)|swing.?trad(?:e|ing)|derivatives|call.?option|put.?option)\b/i,
  parentalGuidance: /\b(open(?:ing)?\s+account|deposit|withdraw|withdrawal|real\s+money|funding|transfer|custodial|cash\s+out)\b/i
};

/**
 * Enhanced safety check for user queries
 * @param {string} query - User's query
 * @param {Object} userContext - User context including age
 * @returns {Object} Safety check result
 */
export async function checkSafety(query, userContext = {}) {
  const startTime = Date.now();
  
  // Run all checks in PARALLEL for speed
  const checkPromises = [
    checkSpecificStock(query),
    checkCrypto(query),
    checkAgeRestricted(query),
    checkParentalGuidance(query)
  ];

  const results = await Promise.all(checkPromises);
  
  const detected = results.find(result => result?.detected);
  
  if (detected) {
    console.log(`Safety check (${Date.now() - startTime}ms):`, detected.type);
    return {
      ...detected,
      timestamp: Date.now(),
      userAge: userContext.age,
      responseTime: Date.now() - startTime
    };
  }

  return { 
    detected: false,
    responseTime: Date.now() - startTime
  };
}

async function checkSpecificStock(query) {
  const match = query.match(SAFETY_PATTERNS.specificStock);
  if (match) {
    const stock = match[1] || 'that stock';
    return {
      detected: true,
      type: 'specificStock',
      entity: stock,
      response: RESPONSE_TEMPLATES?.safety_redirect?.specific_stock?.(stock) || 
        `I can teach you how to evaluate ${stock}, but I can't tell you whether to buy it. Let's learn how to analyze it together!`,
      severity: 'high'
    };
  }
  return { detected: false };
}

async function checkCrypto(query) {
  if (SAFETY_PATTERNS.crypto.test(query)) {
    return {
      detected: true,
      type: 'crypto',
      response: RESPONSE_TEMPLATES?.safety_redirect?.crypto || 
        'Cryptocurrency is complex and volatile - not ideal for learning basics. Start with stocks because they are easier to understand and more regulated for beginners.',
      severity: 'high'
    };
  }
  return { detected: false };
}

async function checkAgeRestricted(query) {
  const match = query.match(SAFETY_PATTERNS.ageRestricted);
  if (match) {
    const strategy = match[1];
    return {
      detected: true,
      type: 'ageRestricted',
      entity: strategy,
      response: RESPONSE_TEMPLATES?.safety_redirect?.age_restricted?.(strategy) ||
        `${strategy} is an advanced strategy that's not suitable for beginners. Let's start with the basics of long-term investing first!`,
      severity: 'high'
    };
  }
  return { detected: false };
}

async function checkParentalGuidance(query) {
  if (SAFETY_PATTERNS.parentalGuidance.test(query)) {
    return {
      detected: true,
      type: 'parentalGuidance',
      response: RESPONSE_TEMPLATES?.safety_redirect?.parental_guidance ||
        'That sounds like something you should discuss with a parent or guardian. Would you like me to help explain the basics first?',
      severity: 'medium'
    };
  }
  return { detected: false };
}

// Existing functions (keep these as they are)
export function applySafetyChecks(response, userContext = {}) {
  // Handle both string and object responses
  const content = typeof response === 'string' ? response : response.content || '';
  const metadata = typeof response === 'object' ? response.metadata || {} : {};
  
  // Check for restricted content
  const restriction = checkRestrictedContent(content);
  if (restriction) {
    return {
      content: restriction.message,
      metadata: {
        ...metadata,
        safety: {
          flagged: true,
          reason: 'restricted_content',
          originalContent: content
        }
      }
    };
  }
  
  // Add appropriate disclaimers
  const disclaimers = [];
  
  // Add age-appropriate disclaimer
  const age = parseInt(userContext.age, 10);
  if (age >= 13 && age <= 15) {
    disclaimers.push(AGE_DISCLAIMERS['13-15']);
  } else if (age >= 16 && age <= 17) {
    disclaimers.push(AGE_DISCLAIMERS['16-17']);
  } else if (age >= 18) {
    disclaimers.push(AGE_DISCLAIMERS['18+']);
  } else {
    disclaimers.push(AGE_DISCLAIMERS['13-15']); // Default to most conservative
  }
  
  // Add risk warning if applicable
  const riskLevel = detectRiskLevel(content, userContext.risk_tolerance);
  if (riskLevel && RISK_WARNINGS[riskLevel]) {
    disclaimers.push(RISK_WARNINGS[riskLevel]);
  }
  
  // Add general disclaimer if not already present
  const generalDisclaimer = 'This is not financial advice. Always do your own research and consider consulting a financial advisor.';
  if (!content.toLowerCase().includes('not financial advice')) {
    disclaimers.push(generalDisclaimer);
  }
  
  // Add disclaimers if any
  let safeContent = content;
  if (disclaimers.length > 0) {
    safeContent += '\n\n' + disclaimers.join('\n\n');
  }
  
  return {
    content: safeContent,
    metadata: {
      ...metadata,
      safety: {
        flagged: false,
        disclaimersAdded: disclaimers.length
      }
    }
  };
}

function checkRestrictedContent(content) {
  if (!content) return null;
  
  // Check against restricted patterns
  for (const { pattern, message } of RESTRICTED_TOPICS) {
    if (pattern.test(content)) {
      return { message };
    }
  }
  
  return null;
}

function detectRiskLevel(content, userRiskTolerance = 'moderate') {
  const lowerContent = content.toLowerCase();
  
  // High risk indicators
  const highRiskTerms = [
    'high risk', 'speculative', 'crypto', 'cryptocurrency', 'penny stock',
    'leverage', 'margin', 'short selling', 'options', 'derivatives', 'futures',
    'startup', 'venture capital', 'angel investing', 'ico', 'initial coin offering'
  ];
  
  // Medium risk indicators
  const mediumRiskTerms = [
    'stock', 'etf', 'mutual fund', 'index fund', 'real estate',
    'bonds', 'corporate bonds', 'dividend stocks', 'reit', 'commodities'
  ];
  
  // Low risk indicators
  const lowRiskTerms = [
    'savings account', 'cd', 'certificate of deposit', 'treasury',
    'government bond', 'high-yield savings', 'money market', 'fdic insured'
  ];
  
  // Check for risk terms
  if (highRiskTerms.some(term => lowerContent.includes(term))) {
    return 'high';
  }
  
  if (mediumRiskTerms.some(term => lowerContent.includes(term))) {
    return 'medium';
  }
  
  if (lowRiskTerms.some(term => lowerContent.includes(term))) {
    return 'low';
  }
  
  // Default to user's risk tolerance if no specific terms found
  return userRiskTolerance || 'medium';
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  // Basic XSS prevention
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

export function validateInput(input, options = {}) {
  const { maxLength = 500, minLength = 1 } = options;
  
  if (typeof input !== 'string') {
    return { 
      valid: false, 
      error: 'Input must be a string' 
    };
  }
  
  if (input.length < minLength) {
    return { 
      valid: false, 
      error: `Input must be at least ${minLength} characters` 
    };
  }
  
  if (input.length > maxLength) {
    return { 
      valid: false, 
      error: `Input must be no more than ${maxLength} characters` 
    };
  }
  
  // Check for excessive spaces or newlines
  if ((input.match(/\s{10,}/g) || []).length > 0) {
    return { 
      valid: false, 
      error: 'Input contains excessive whitespace' 
    };
  }
  
  // Check for suspicious patterns (basic)
  const suspiciousPatterns = [
    /<script[^>]*>.*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:/gi,
    /vbscript:/gi,
    /expression\(/gi
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      return { 
        valid: false, 
        error: 'Input contains potentially harmful content' 
      };
    }
  }
  
  return { valid: true };
}

export function logSafetyEvent(eventType, details = {}) {
  const timestamp = new Date().toISOString();
  const event = {
    timestamp,
    eventType,
    ...details,
    // Remove any sensitive data that might be in details
    userInput: undefined,
    originalContent: undefined
  };
  
  // In a real app, this would send to a logging service
  console.log('[Safety Event]', event);
  
  return event;
}