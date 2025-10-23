const fetch = require('node-fetch');
const { supabase, handleSupabaseError } = require('../../ai-services/supabaseClient');

// Simple in-memory cache with TTL and LRU eviction
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_SIZE = 200; // max entries
const responseCache = new Map(); // key -> { value, expiresAt }

const nowMs = () => Date.now();

const makeCacheKey = (message, userId, model = 'default') => {
  return `${model}::${userId || 'anon'}::${message.trim().toLowerCase()}`.slice(0, 512);
};

const getFromCache = (key) => {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs()) {
    responseCache.delete(key);
    return null;
  }
  // LRU: re-insert to move to most-recent
  responseCache.delete(key);
  responseCache.set(key, entry);
  return entry.value;
};

const setInCache = (key, value) => {
  // Evict expired first
  for (const [k, v] of responseCache.entries()) {
    if (v.expiresAt <= nowMs()) responseCache.delete(k);
  }
  // LRU eviction if size limit exceeded
  while (responseCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = responseCache.keys().next().value;
    if (!oldestKey) break;
    responseCache.delete(oldestKey);
  }
  responseCache.set(key, { value, expiresAt: nowMs() + CACHE_TTL_MS });
};

// Basic input sanitization and validation
const sanitizeMessage = (raw) => {
  if (typeof raw !== 'string') return '';
  let msg = raw.replace(/[\u0000-\u001F\u007F]/g, ''); // remove control chars
  msg = msg.replace(/<[^>]*>/g, ''); // strip HTML tags
  msg = msg.trim();
  if (msg.length > 2000) msg = msg.slice(0, 2000);
  return msg;
};

// Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

// Environment validation on startup
if (!process.env.OPENROUTER_API_KEY) {
  console.warn('[ChatService] WARNING: OPENROUTER_API_KEY is not set. Chat functionality will be disabled.');
} else if (process.env.NODE_ENV !== 'production') {
  console.log('[ChatService] OpenRouter API key is configured');
}

/**
 * Log debug information in development mode
 */
const debugLog = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[ChatService]', ...args);
  }
};

/**
 * Handle chat message with LLaMA 3.1 8B model via OpenRouter
 */
const handleChatMessage = async (message, userId = 'anonymous') => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  try {
    const cleanMessage = sanitizeMessage(message);
    if (!cleanMessage) {
      return {
        success: false,
        error: { code: 400, message: 'Message cannot be empty after sanitization' },
        timestamp: new Date().toISOString()
      };
    }

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    // Cache lookup
    const cacheKey = makeCacheKey(cleanMessage, userId, MODEL);
    const cached = getFromCache(cacheKey);
    if (cached) {
      debugLog('Cache hit for request:', { request_id: requestId, user_id: userId });
      const elapsed = Date.now() - startTime;
      return {
        success: true,
        response: cached.response,
        timestamp: new Date().toISOString(),
        model: cached.model || MODEL,
        usage: cached.usage || null,
        cached: true,
        responseTimeMs: elapsed
      };
    }

    const requestBody = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are InvestX Labs—an educational investing assistant. Always include safety disclaimers and keep responses educational.'
        },
        { role: 'user', content: cleanMessage }
      ],
      max_tokens: 800,
      user: userId
    };

    debugLog('Sending request to OpenRouter:', {
      model: MODEL,
      message_length: message.length,
      user_id: userId,
      request_id: requestId
    });

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://investx-labs.com',
        'X-Title': 'InvestX Labs'
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`OpenRouter API error: ${response.status}`);
      error.status = response.status;
      error.response = errorText;
      throw error;
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    
    debugLog(`Received response (${responseTime}ms):`, {
      request_id: requestId,
      status: response.status,
      response_length: responseText.length,
      usage: data.usage
    });

    const result = {
      success: true,
      response: responseText,
      timestamp: new Date().toISOString(),
      model: data.model,
      usage: data.usage,
      cached: false,
      responseTimeMs: responseTime
    };

    // Save to cache
    setInCache(cacheKey, {
      response: responseText,
      model: data.model,
      usage: data.usage
    });

    return result;
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    const errorMessage = error.response || error.message;
    
    console.error(`[ChatService] Error (${errorTime}ms):`, {
      request_id: requestId,
      error: errorMessage,
      status: error.status,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
    
    return {
      success: false,
      error: {
        code: error.status || 500,
        message: error.status === 401 
          ? 'Authentication failed - check API key' 
          : 'AI service temporarily unavailable',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      timestamp: new Date().toISOString()
    };
  }
};

const moderateContent = async (text) => {
  // Call moderation API or run custom filters
  // Example placeholder:
  const flagged = await callModerationAPI(text);
  if (flagged) {
    throw new Error('Content flagged by moderation');
  }
  return true;
};

const isHighRiskQuery = (text) => {
  const highRiskPatterns = [
    /guarantee/i,
    /make money fast/i,
    /risk-free/i,
  ];
  return highRiskPatterns.some((pattern) => pattern.test(text));
};

// Step 1: Intent Classification - robust rule-based classifier
// Categories: ['education', 'portfolio', 'calculation', 'general']
const classifyIntent = (text, userProfile, conversationContext) => {
  if (!text || typeof text !== 'string') return 'general';
  const t = text.trim().toLowerCase();

  // Education: learning, definitions, how-to
  const educationPatterns = [
    /what is|what's|define|explain|teach|learn|basics|beginner|how does .* work/,
    /difference between|compare|pros and cons|examples?/,
  ];

  // Portfolio: holdings, analysis, risk, performance
  const portfolioPatterns = [
    /portfolio|holdings|my stocks|my etfs|allocation|rebalance|diversify|diversification/,
    /performance|returns?|risk profile|risk tolerance|exposure|sector|asset class/,
  ];

  // Calculation: numbers, interest, ROI, CAGR, percentages
  const calculationPatterns = [
    /calculate|how much|roi|cagr|apy|apr|compound(ing)? interest|projection|growth rate/,
    /\d+%|\$\d|per month|per year|over \d+ (years?|months?)/,
  ];

  const matches = (patterns) => patterns.some((p) => p.test(t));

  if (matches(educationPatterns)) return 'education';
  if (matches(portfolioPatterns)) return 'portfolio';
  if (matches(calculationPatterns)) return 'calculation';

  // Heuristics based on context (lightweight)
  if (Array.isArray(conversationContext)) {
    const lastUserMsg = [...conversationContext].reverse().find(m => m?.role === 'user')?.content?.toLowerCase?.() || '';
    if (lastUserMsg.includes('portfolio')) return 'portfolio';
  }

  return 'general';
};

// Step 2: Query Complexity Scoring
const scoreQueryComplexity = (text, conversationContext) => {
  let score = 0;

  // Base score on length
  if (text.length > 100) score += 2;
  else if (text.length > 50) score += 1;

  // Keywords indicating complexity
  const complexKeywords = ['strategy', 'risk', 'diversify', 'optimize', 'forecast'];
  if (complexKeywords.some(k => text.toLowerCase().includes(k))) score += 2;

  // Add context length factor
  if (conversationContext && conversationContext.length > 200) score += 1;

  return score; // scale 0-5 roughly
};

// Step 3: Routing Logic
const routeQuery = (intent, complexityScore) => {
  if (intent === 'education' && complexityScore <= 2) {
    return 'educationalPrompt';
  }
  if (intent === 'portfolio') {
    return 'portfolioModule';
  }
  if (complexityScore >= 4) {
    return 'fallbackOrEscalation';
  }
  return 'generalPrompt';
};

// Step 1: Store semantic embeddings for conversation turns
const storeConversationTurn = async (userId, text, metadata = {}) => {
  try {
    // First, get or create a chat session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let sessionId;
    
    if (sessionError || !session) {
      // Create a new session if none exists
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert([{
          user_id: userId,
          title: 'New Chat',
          metadata: {}
        }])
        .select('id')
        .single();
      
      if (createError) throw createError;
      sessionId = newSession.id;
    } else {
      sessionId = session.id;
    }
    
    // Save the message
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert([{
        session_id: sessionId,
        user_id: userId,
        content: text,
        role: 'user',
        metadata: metadata
      }]);
      
    if (messageError) throw messageError;
    
    return true;
  } catch (error) {
    console.error('Error storing conversation turn:', error);
    throw new Error('Failed to store conversation turn');
  }
};

// Step 2: Persist user preferences in Supabase
const saveUserPreferences = async (userId, preferences) => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        preferences: preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        returning: 'minimal'
      });
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw new Error('Failed to save user preferences');
  }
};

const getUserPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data.preferences || {};
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {};
  }
};

// Step 3: Summarize long conversation context
const summarizeConversation = async (conversationTexts) => {
  // Simple example: concatenate and truncate or call a summarization model
  const combinedText = conversationTexts.join(' ');
  if (combinedText.length < 1000) return combinedText;

  // Placeholder: call summarization API or model here
  const summary = await callSummarizationModel(combinedText);
  return summary;
};

// Step 4: Retrieve relevant semantic memory
const retrieveRelevantMemory = async (userId, query, topK = 5) => {
  try {
    const queryEmbedding = await OpenAIEmbeddings.embed(query);
    const results = await vectorStore.query(userId, queryEmbedding, topK);
    // Return texts of top results
    return results.map(r => r.text);
  } catch (error) {
    console.error('Error retrieving semantic memory:', error);
    return [];
  }
};

// Step 6: Logging & Monitoring
const logRoutingDecision = async (userId, decision, confidence, context) => {
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert([{
        event_type: 'routing_decision',
        user_id: userId,
        data: {
          decision,
          confidence,
          ...context
        }
      }]);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging routing decision:', error);
    return false;
  }
};

const logFlaggedQuery = async (userId, queryText) => {
  try {
    const { error } = await supabase
      .from('moderation_logs')
      .insert([{
        user_id: userId,
        query_text: queryText,
        flagged_at: new Date().toISOString(),
        status: 'flagged',
        reviewed: false
      }]);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging flagged query:', error);
    return false;
  }
};

// Fetch user profile
const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
    const user = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (user.error) throw user.error;
    
    return {
      id: userId,
      name: user.data?.full_name || 'User',
      username: user.data?.username || '',
      experienceLevel: user.data?.experience_level || 'beginner',
      riskTolerance: user.data?.risk_tolerance || 'moderate',
      portfolioValue: user.data?.portfolio_value || 0,
      ...user.data
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return a default profile if there's an error
    return {
      id: userId,
      name: 'User',
      experienceLevel: 'beginner',
      riskTolerance: 'moderate',
      portfolioValue: 0
    };
  }
};

/**
 * Unified chat response generation function
 * Combines intent classification, routing, semantic memory, moderation, and logging
 */
const generateChatResponse = async (userInput, userProfile, conversationContext) => {
  // Step 1: Classify intent and score complexity
  const intent = classifyIntent(userInput, userProfile, conversationContext);
  const complexityScore = scoreQueryComplexity(userInput, conversationContext);
  const route = routeQuery(intent, complexityScore);

  // Step 2: Log routing decision for monitoring
  console.log(`[ChatService] Routing decision: intent=${intent}, complexity=${complexityScore}, route=${route}`);
  await logRoutingDecision(userProfile.uid, userInput, intent, complexityScore, route);

  // Step 3: Retrieve user preferences
  const preferences = await getUserPreferences(userProfile.uid);

  // Step 4: Retrieve relevant semantic memory
  const relevantMemory = await retrieveRelevantMemory(userProfile.uid, userInput);

  // Step 5: Summarize conversation context + memory to reduce token usage
  const summary = await summarizeConversation([...conversationContext, ...relevantMemory]);

  // Step 6: Handle routing based on intent and complexity
  let response;
  
  switch (route) {
    case 'educationalPrompt': {
      const promptBuilder = new SystemPromptBuilder(userProfile);
      const prompt = promptBuilder.buildPrompt(userInput, summary, preferences);
      await moderateContent(prompt);
      response = await callAIModel(prompt);
      await moderateContent(response);
      break;
    }
    case 'portfolioModule': {
      // Call portfolio analysis sub-module (assumed implemented elsewhere)
      response = await callPortfolioModule(userInput, userProfile);
      break;
    }
    case 'fallbackOrEscalation': {
      // Return fallback message or escalate to human agent
      await logFlaggedQuery(userProfile.uid, userInput);
      response = 'Your question is complex. Please consult a financial advisor or try simplifying your query.';
      break;
    }
    case 'generalPrompt':
    default: {
      const promptBuilder = new SystemPromptBuilder(userProfile);
      const prompt = promptBuilder.buildPrompt(userInput, summary, preferences);
      await moderateContent(prompt);
      response = await callAIModel(prompt);
      await moderateContent(response);
      break;
    }
  }

  // Step 7: Store this turn in semantic memory with metadata
  await storeConversationTurn(userProfile.uid, userInput, {
    intent: intent,
    complexityScore: complexityScore
  });
  await storeConversationTurn(userProfile.uid, response, {
    intent: 'response',
    complexityScore: 0
  });

  return response;
};

module.exports = { 
  handleChatMessage, 
  generateChatResponse, 
  moderateContent, 
  isHighRiskQuery, 
  classifyIntent, 
  scoreQueryComplexity, 
  routeQuery, 
  storeConversationTurn, 
  saveUserPreferences, 
  getUserPreferences, 
  summarizeConversation, 
  retrieveRelevantMemory, 
  logRoutingDecision, 
  logFlaggedQuery, 
  getUserProfile 
};