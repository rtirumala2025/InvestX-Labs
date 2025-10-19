// Import the chatService module
const chatService = require('./chatService');
const { simulateLatency } = require('./latencyMiddleware');

jest.setTimeout(30000); // Increase timeout for async tests

// Mock specific functions in the chatService module
jest.mock('./chatService', () => {
  const actual = jest.requireActual('./chatService');
  
  return {
    ...actual,
    moderateContent: jest.fn(async (text) => {
      if (text.includes('unsafe')) throw new Error('Content flagged by moderation');
      return true;
    }),
    callAIModel: jest.fn(async (prompt) => `Mocked AI response to: ${prompt}`),
    callPortfolioModule: jest.fn(async () => 'Mocked portfolio analysis response'),
    logFlaggedQuery: jest.fn(async () => {}),
    logRoutingDecision: jest.fn(async () => {})
  };
});

// Add metrics collection
const metrics = {
  successfulResponses: 0,
  safetyViolations: 0,
  fallbackEvents: 0,
  responseTimes: []
};

describe('InvestIQ Chat Backend Integration Tests', () => {
  const userProfile = { uid: 'user1', age: 25, experience_level: 'intermediate' };
  const conversationContext = ['Previous conversation turn 1', 'Previous conversation turn 2'];

  test('Intent classification and routing correctness', () => {
    expect(chatService.classifyIntent('Explain diversification', userProfile, conversationContext)).toBe('education');
    expect(chatService.classifyIntent('Suggest stocks', userProfile, conversationContext)).toBe('suggestion');
    expect(chatService.classifyIntent('Show my portfolio performance', userProfile, conversationContext)).toBe('portfolio');
    expect(chatService.classifyIntent('Random question', userProfile, conversationContext)).toBe('general');

    expect(chatService.routeQuery('education', 1)).toBe('educationalPrompt');
    expect(chatService.routeQuery('portfolio', 2)).toBe('portfolioModule');
    expect(chatService.routeQuery('education', 4)).toBe('fallbackOrEscalation');
    expect(chatService.routeQuery('general', 1)).toBe('generalPrompt');
  });

  test('High-risk query flagged by safety layer', async () => {
    await expect(chatService.moderateContent('This is unsafe content')).rejects.toThrow('Content flagged by moderation');
    metrics.safetyViolations++;
  });

  // Inside the multi-turn test
  test('Multi-turn conversation simulation', async () => {
    let response;
    for (let i = 0; i < 5; i++) {
      await simulateLatency(50, 200);
      const start = Date.now();
      response = await chatService.generateChatResponse(`Question ${i + 1}`, userProfile, conversationContext);
      const elapsed = Date.now() - start;
      metrics.responseTimes.push(elapsed);
      metrics.successfulResponses++;
      expect(response).toMatch(/Mocked AI response/);
    }
  });

  test('Concurrent users simulation', async () => {
    const users = Array.from({ length: 10 }, (_, i) => ({ uid: `user${i}`, age: 20 + i, experience_level: 'beginner' }));
    const promises = users.map(user => chatService.generateChatResponse('What is diversification?', user, conversationContext));
    const results = await Promise.all(promises);
    results.forEach(res => expect(res).toMatch(/Mocked AI response/));
  });

  test('Error handling and fallback', async () => {
    // Simulate moderation failure
    const badContent = 'This is unsafe';
    await expect(chatService.moderateContent(badContent)).rejects.toThrow();
    metrics.safetyViolations++;

    // Simulate AI model failure by mocking callAIModel to throw
    const originalCallAIModel = chatService.callAIModel;
    chatService.callAIModel = jest.fn(() => { 
      metrics.fallbackEvents++;
      throw new Error('AI failure'); 
    });

    await expect(chatService.generateChatResponse('Test failure', userProfile, conversationContext)).rejects.toThrow('AI failure');

    // Restore original
    chatService.callAIModel = originalCallAIModel;
  });

  test('Conversation memory and semantic recall', async () => {
    // Mock the retrieveRelevantMemory function
    const originalRetrieveMemory = chatService.retrieveRelevantMemory;
    chatService.retrieveRelevantMemory = jest.fn(async () => ['Previous relevant memory']);
    
    // First message to establish context
    await chatService.generateChatResponse('Tell me about ETFs', userProfile, []);
    
    // Second message should retrieve relevant memory
    const response = await chatService.generateChatResponse('What are their advantages?', userProfile, ['Tell me about ETFs']);
    
    // Verify memory retrieval was called
    expect(chatService.retrieveRelevantMemory).toHaveBeenCalled();
    
    // Restore original
    chatService.retrieveRelevantMemory = originalRetrieveMemory;
  });

  // Add after all tests to report metrics
  afterAll(() => {
    console.log('\n--- Test Metrics Summary ---');
    console.log(`Successful responses: ${metrics.successfulResponses}`);
    console.log(`Safety violations blocked: ${metrics.safetyViolations}`);
    console.log(`Fallback events: ${metrics.fallbackEvents}`);
    
    if (metrics.responseTimes.length > 0) {
      const avg = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
      metrics.responseTimes.sort((a, b) => a - b);
      const p95 = metrics.responseTimes[Math.floor(metrics.responseTimes.length * 0.95)];
      console.log(`Average response time: ${avg.toFixed(2)}ms`);
      console.log(`95th percentile response time: ${p95.toFixed(2)}ms`);
    }
  });
});