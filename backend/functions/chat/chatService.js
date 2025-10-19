const fetch = require('node-fetch');

// Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

// Environment validation on startup
if (!process.env.OPENROUTER_API_KEY) {
  console.warn('[ChatService] WARNING: OPENROUTER_API_KEY is not set. Chat functionality will be disabled.');
} else if (process.env.NODE_ENV !== 'production') {
  console.log('[ChatService] OpenRouter API key is configured');}

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

module.exports = { handleChatMessage };
