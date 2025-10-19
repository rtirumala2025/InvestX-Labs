const fetch = require('node-fetch');
const admin = require('firebase-admin');

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
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    const requestBody = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are InvestX Labs—an educational investing assistant. Always include safety disclaimers and keep responses educational.'
        },
        { role: 'user', content: message }
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

    return {
      success: true,
      response: responseText,
      timestamp: new Date().toISOString(),
      model: data.model,
      usage: data.usage
    };
    
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

// Step 1: Intent Classification - lightweight hybrid classifier
const classifyIntent = (text, userProfile, conversationContext) => {
  // Simple keyword-based categories with fallback to 'general'
  const educationKeywords = ['learn', 'education', 'explain', 'teach'];
  const suggestionKeywords = ['suggest', 'recommend', 'advice'];
  const portfolioKeywords = ['portfolio', 'holdings', 'stocks', 'performance'];

  const lowerText = text.toLowerCase();

  if (educationKeywords.some(k => lowerText.includes(k))) return 'education';
  if (suggestionKeywords.some(k => lowerText.includes(k))) return 'suggestion';
  if (portfolioKeywords.some(k => lowerText.includes(k))) return 'portfolio';

  // Optionally, use userProfile or conversationContext for refinement here

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
const storeConversationTurn = async (userId, text, metadata) => {
  try {
    // Generate embedding for the text
    const embedding = await OpenAIEmbeddings.embed(text);

    // Create vector store entry with metadata
    const entry = {
      id: uuidv4(),
      embedding,
      metadata: {
        userId,
        timestamp: new Date().toISOString(),
        ...metadata
      },
      text
    };

    // Store in vector store (per user namespace or collection)
    await vectorStore.addEntry(userId, entry);

    // Optionally prune old entries to respect token limits
    await vectorStore.pruneEntries(userId, 1000); // keep last 1000 entries or adjust as needed

  } catch (error) {
    console.error('Error storing conversation turn:', error);
  }
};

// Step 2: Persist user preferences in Firestore
const saveUserPreferences = async (userId, preferences) => {
  try {
    await db.collection('user_preferences').doc(userId).set(preferences, { merge: true });
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

const getUserPreferences = async (userId) => {
  try {
    const doc = await db.collection('user_preferences').doc(userId).get();
    return doc.exists ? doc.data() : {};
  } catch (error) {
    console.error('Error fetching user preferences:', error);
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
const logRoutingDecision = async (userId, userInput, intent, complexityScore, route) => {
  try {
    await db.collection('routing_logs').add({
      userId,
      userInput,
      intent,
      complexityScore,
      route,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging routing decision:', error);
  }
};

const logFlaggedQuery = async (userId, queryText) => {
  try {
    await db.collection('moderation_logs').add({
      userId,
      queryText,
      flaggedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging flagged query:', error);
  }
};

// Fetch user profile
const getUserProfile = async (userId) => {
  const doc = await db.collection('users').doc(userId).get();
  return doc.exists ? doc.data() : null;
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