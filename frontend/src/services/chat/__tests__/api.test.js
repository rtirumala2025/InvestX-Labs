import { chatAPI } from '../api';

describe('Chat API', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();
    // Mock environment variables
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      VITE_API_URL: 'http://localhost:5000/api/chat'
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  test('sends a message and receives a response', async () => {
    const mockResponse = {
      success: true,
      response: 'Hello! How can I help you with investing today?',
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      timestamp: '2023-10-18T23:50:00.000Z'
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
      status: 200
    });

    const response = await chatAPI.sendMessage('Hello');
    
    expect(response).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/chat',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello',
          userId: 'anonymous',
          sessionId: 'default-session'
        })
      })
    );
  });

  test('handles request timeout', async () => {
    global.fetch.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error('timeout of 10000ms exceeded');
          error.code = 'ECONNABORTED';
          reject(error);
        }, 100);
      });
    });

    await expect(chatAPI.sendMessage('Hello'))
      .rejects
      .toThrow('The request timed out. Please try again.');
    
    // Should retry MAX_RETRIES times (2 retries + initial attempt = 3 total)
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  test('handles 401 unauthorized error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Invalid API key' })
    });

    await expect(chatAPI.sendMessage('Hello'))
      .rejects
      .toThrow('Authentication error. Please check your connection.');
  });

  test('handles network error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(chatAPI.sendMessage('Hello'))
      .rejects
      .toThrow('Unable to connect to the chat service. Please try again later.');
  });
});
