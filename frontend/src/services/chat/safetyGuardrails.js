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

/**
 * Applies safety checks to a response
 * @param {string|Object} response - The AI response to check
 * @param {Object} userContext - User context including age and risk tolerance
 * @returns {Object} Safe response with appropriate disclaimers
 */
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

/**
 * Checks for restricted content in the response
 */
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

/**
 * Detects risk level in content
 */
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

/**
 * Sanitizes user input to prevent injection attacks
 */
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

/**
 * Validates user input before processing
 */
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

/**
 * Logs safety-related events
 */
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
