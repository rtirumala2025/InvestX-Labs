const { handleChatMessage } = require('../chat/chatService');
const fetch = require('node-fetch');

// Mock node-fetch
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('Chat Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks and environment
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      OPENROUTER_API_KEY: 'test-api-key-123'
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('successfully processes a chat message', async () => {
    const mockResponse = {
      id: 'test-id-123',
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      choices: [{
        message: { 
          role: 'assistant',
          content: 'Hello! How can I help you with investing today?'
        }
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 12,
        total_tokens: 22
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await handleChatMessage('Hello', 'test-user-123');

    expect(result).toEqual({
      success: true,
      response: 'Hello! How can I help you with investing today?',
      timestamp: expect.any(String),
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      usage: {
        prompt_tokens: 10,
        completion_tokens: 12,
        total_tokens: 22
      }
    });

    // Verify fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-api-key-123',
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://investx-labs.com',
          'X-Title': 'InvestX Labs'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are InvestX Labs—an educational investing assistant. Always include safety disclaimers and keep responses educational.'
            },
            { role: 'user', content: 'Hello' }
          ],
          max_tokens: 800,
          user: 'test-user-123'
        })
      })
    );
  });

  test('handles missing API key', async () => {
    // Temporarily remove API key
    delete process.env.OPENROUTER_API_KEY;
    
    const result = await handleChatMessage('Hello', 'test-user-123');
    
    expect(result).toEqual({
      success: false,
      error: {
        code: 500,
        message: 'AI service temporarily unavailable',
        details: undefined
      },
      timestamp: expect.any(String)
    });
  });

  test('handles API error response', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Invalid API key')
    });

    const result = await handleChatMessage('Hello', 'test-user-123');
    
    expect(result).toEqual({
      success: false,
      error: {
        code: 401,
        message: 'Authentication failed - check API key',
        details: 'Invalid API key'
      },
      timestamp: expect.any(String)
    });
  });

  test('handles network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    const result = await handleChatMessage('Hello', 'test-user-123');
    
    expect(result).toEqual({
      success: false,
      error: {
        code: 500,
        message: 'AI service temporarily unavailable',
        details: 'Network error'
      },
      timestamp: expect.any(String)
    });
  });
});
