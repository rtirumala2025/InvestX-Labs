import { logger } from '../../utils/logger.js';

/**
 * Adapter for OpenRouter API to work with Model Context Protocol
 */
class OpenRouterAdapter {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'meta-llama/llama-3-70b-instruct';
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'https://investx-labs.web.app',
      'X-Title': 'InvestX Labs',
    };
  }

  /**
   * Generate a response using the OpenRouter API
   * @param {Object} params - The parameters for the generation
   * @returns {Promise<Object>} - The generated response
   */
  async generate(params) {
    const {
      messages,
      temperature = 0.7,
      max_tokens = 1000,
      top_p = 1,
      frequency_penalty = 0,
      presence_penalty = 0,
      stop = null,
      user = null,
      stream = false,
    } = params;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens,
          top_p,
          frequency_penalty,
          presence_penalty,
          stop,
          user,
          stream,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `OpenRouter API error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      
      // Transform the response to a standard format
      return {
        id: data.id,
        model: data.model,
        choices: data.choices.map(choice => ({
          message: choice.message,
          index: choice.index,
          finish_reason: choice.finish_reason,
        })),
        usage: data.usage,
        created: data.created,
      };
    } catch (error) {
      logger.error('OpenRouter API request failed:', error);
      throw error;
    }
  }

  /**
   * Generate a streaming response (for real-time updates)
   * @param {Object} params - The parameters for the generation
   * @param {Function} onData - Callback for streaming data
   * @returns {Promise<void>}
   */
  async generateStream(params, onData) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        ...this.headers,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        ...params,
        model: this.model,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenRouter API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              onData({ done: true });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              onData({
                id: parsed.id,
                model: parsed.model,
                choices: parsed.choices,
                created: parsed.created,
                done: false,
              });
            } catch (e) {
              logger.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get model information
   * @returns {Object} - Model information
   */
  getModelInfo() {
    return {
      id: this.model,
      name: 'LLaMA 3 70B Instruct',
      provider: 'OpenRouter',
      description: 'Meta\'s LLaMA 3 70B model for investment education',
      max_tokens: 8192,
      supports_streaming: true,
    };
  }
}

export { OpenRouterAdapter };
