/**
 * Chat Integration Test Utility
 * 
 * This utility helps test the chat integration by providing
 * mock data and testing functions for development.
 */

// Mock user data for testing
export const mockUser = {
  uid: 'test-user-123',
  displayName: 'Test User',
  email: 'test@example.com',
  age: 16,
  budget: 100,
  risk_tolerance: 'moderate',
  investment_goals: ['college', 'car'],
  experience_level: 'beginner',
};

// Mock chat messages for testing
export const mockMessages = [
  {
    id: 'user_1',
    type: 'user',
    content: 'What are stocks?',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'bot_1',
    type: 'assistant',
    content: 'Stocks represent ownership shares in a company! When you buy a stock, you become a partial owner of that company. If the company does well, your stock value can increase. It\'s like owning a small piece of a business! 📈',
    timestamp: new Date().toISOString(),
    suggestions: [
      {
        title: 'How do I buy stocks?',
        action: 'explain_stock_purchasing'
      },
      {
        title: 'What are the risks?',
        action: 'explain_stock_risks'
      }
    ],
  },
  {
    id: 'user_2',
    type: 'user',
    content: 'How much should I invest?',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'bot_2',
    type: 'assistant',
    content: 'Great question! As a teen, start small and build good habits. Many experts suggest investing 10-20% of any money you earn. Since you mentioned having $100, you could start with $10-20 per month. The key is consistency - even small amounts add up over time thanks to compound interest! 💰',
    timestamp: new Date().toISOString(),
    suggestions: [
      {
        title: 'What is compound interest?',
        action: 'explain_compound_interest'
      },
      {
        title: 'Show me a calculation',
        action: 'calculate_compound_interest',
        parameters: { amount: 20, years: 10 }
      }
    ],
  },
];

// Test conversation starters
export const conversationStarters = [
  "What's the difference between stocks and bonds?",
  "How does compound interest work?",
  "What are index funds?",
  "How much should I invest each month?",
  "What's a 401(k)?",
  "How do I start investing?",
  "What are mutual funds?",
  "How do I read stock prices?",
];

// Mock API responses for testing
export const mockApiResponses = {
  sendMessage: {
    success: true,
    data: {
      message_id: 'bot_' + Date.now(),
      response: 'This is a test response from Finley!',
      conversation_id: 'conv_test_123',
      session_id: 'session_test_123',
      recommendations: [
        {
          title: 'Learn more about this topic',
          action: 'provide_more_info'
        }
      ],
      metadata: {
        response_time: 1.2,
        confidence: 0.95
      }
    }
  },
  
  startConversation: {
    success: true,
    data: {
      conversation_id: 'conv_test_123',
      session_id: 'session_test_123',
      welcome_message: 'Hi! I\'m Finley, your AI investment education assistant. How can I help you learn about investing today?'
    }
  },
  
  getChatHistory: {
    success: true,
    data: {
      conversations: [
        {
          conversation_id: 'conv_test_123',
          session_id: 'session_test_123',
          created_at: new Date().toISOString(),
          messages: mockMessages
        }
      ]
    }
  }
};

/**
 * Test the chat integration with mock data
 * @param {Function} sendMessage - The sendMessage function from useChat hook
 * @param {Function} setMessages - Function to set messages (for testing)
 */
export const testChatIntegration = (sendMessage, setMessages) => {
  console.log('🧪 Testing Chat Integration...');
  
  // Test 1: Send a simple message
  console.log('Test 1: Sending simple message...');
  sendMessage('Hello Finley!');
  
  // Test 2: Send a complex investment question
  setTimeout(() => {
    console.log('Test 2: Sending investment question...');
    sendMessage('What is compound interest and how does it work?');
  }, 1000);
  
  // Test 3: Test with mock messages
  setTimeout(() => {
    console.log('Test 3: Loading mock conversation...');
    setMessages(mockMessages);
  }, 2000);
  
  console.log('✅ Chat integration tests completed!');
};

/**
 * Simulate a conversation flow for testing
 * @param {Function} sendMessage - The sendMessage function from useChat hook
 */
export const simulateConversation = async (sendMessage) => {
  console.log('🎭 Simulating conversation flow...');
  
  const questions = [
    'What are stocks?',
    'How do I buy them?',
    'What are the risks?',
    'How much should I invest?'
  ];
  
  for (let i = 0; i < questions.length; i++) {
    setTimeout(() => {
      console.log(`Sending question ${i + 1}: ${questions[i]}`);
      sendMessage(questions[i]);
    }, i * 2000);
  }
};

/**
 * Test error handling
 * @param {Function} sendMessage - The sendMessage function from useChat hook
 */
export const testErrorHandling = (sendMessage) => {
  console.log('🚨 Testing error handling...');
  
  // Test with empty message
  sendMessage('');
  
  // Test with very long message
  setTimeout(() => {
    const longMessage = 'A'.repeat(1001);
    sendMessage(longMessage);
  }, 1000);
  
  // Test with special characters
  setTimeout(() => {
    sendMessage('!@#$%^&*()_+{}|:"<>?[]\\;\',./');
  }, 2000);
};

/**
 * Performance test for chat interface
 * @param {Function} sendMessage - The sendMessage function from useChat hook
 */
export const performanceTest = (sendMessage) => {
  console.log('⚡ Running performance test...');
  
  const startTime = Date.now();
  const messageCount = 10;
  
  for (let i = 0; i < messageCount; i++) {
    setTimeout(() => {
      sendMessage(`Performance test message ${i + 1}`);
    }, i * 100);
  }
  
  setTimeout(() => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ Performance test completed in ${duration}ms for ${messageCount} messages`);
  }, messageCount * 100 + 1000);
};

// Export all test functions
export const chatTests = {
  testChatIntegration,
  simulateConversation,
  testErrorHandling,
  performanceTest,
};

export default {
  mockUser,
  mockMessages,
  conversationStarters,
  mockApiResponses,
  chatTests,
};
