import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import { exponentialBackoff } from './utils.js';

class AIEngine {
  constructor(apiKey) {
    this.API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    this.API_KEY = apiKey;
    this.MODEL = 'meta-llama/llama-3-70b-instruct';
  }

  async generateResponse(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 1000, requestId = null } = options;
    const logContext = { requestId, model: this.MODEL };
    
    logger.debug('Generating AI response', { ...logContext, messageCount: messages.length });
    
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'https://investx-labs.web.app',
          'X-Title': 'InvestX Labs',
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = `AI API Error: ${errorData.error?.message || response.statusText}`;
        logger.error(errorMsg, { 
          ...logContext, 
          status: response.status,
          error: errorData 
        });
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const result = data.choices[0].message.content;
      
      logger.debug('AI response generated', { 
        ...logContext, 
        tokenUsage: data.usage,
        responseLength: result.length 
      });
      
      return result;
    } catch (error) {
      logger.error('AI Engine Error:', error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  async getInvestmentRecommendation(context, options = {}) {
    const requestId = options.requestId || `req_${Date.now()}`;
    const logContext = { requestId, model: this.MODEL };
    
    logger.info('Generating investment recommendation', { 
      ...logContext,
      contextKeys: Object.keys(context)
    });
    const messages = [
      {
        role: 'system',
        content: `You are an AI investment educator for high school students. 
        Provide clear, educational explanations about investment concepts. 
        Focus on teaching rather than giving direct financial advice.`
      },
      {
        role: 'user',
        content: `Given the following context, provide an educational investment recommendation:
        ${JSON.stringify(context, null, 2)}`
      }
    ];

    try {
      const response = await this.generateResponse(messages, { 
        temperature: 0.7,
        requestId
      });
      
      logger.info('Successfully generated investment recommendation', {
        ...logContext,
        responseLength: response.length
      });
      
      return response;
    } catch (error) {
      logger.error('Failed to generate investment recommendation', {
        ...logContext,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

// Create a singleton instance
export const aiEngine = new AIEngine(process.env.OPENROUTER_API_KEY);
