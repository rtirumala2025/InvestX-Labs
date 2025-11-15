#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import { aiEngine } from '../ai-services/aiEngine.js';
import { generateRequestId } from '../ai-services/utils.js';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Test configuration
const TEST_SYMBOL = 'AAPL';
const TEST_USER_ID = 'test_user_123';

/**
 * Main test function
 */
async function testAiEngine() {
  const requestId = generateRequestId('test_ai_engine');
  logger.info('Starting AI Engine test', { requestId });
  
  try {
    // Test 1: Generate a simple response
    logger.info('1. Testing generateResponse...', { requestId });
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, who won the world series in 2020?' }
    ];
    
    const response = await aiEngine.generateResponse(messages, { 
      temperature: 0.7,
      maxTokens: 100,
      requestId
    });
    
    if (!response || typeof response !== 'string') {
      throw new Error('generateResponse did not return a string');
    }
    
    logger.info('✅ generateResponse test passed', { 
      responseLength: response.length,
      preview: `${response.substring(0, 50)}...`
    });
    
    // Test 2: Get investment recommendation
    logger.info('2. Testing getInvestmentRecommendation...', { requestId });
    const context = {
      symbol: TEST_SYMBOL,
      currentPrice: 175.50,
      companyName: 'Apple Inc.',
      sector: 'Technology',
      peRatio: 28.5,
      marketCap: '2.8T',
      recommendation: 'Hold',
      riskLevel: 'moderate',
      timeHorizon: 5
    };
    
    const recommendation = await aiEngine.getInvestmentRecommendation(context, { requestId });
    
    if (!recommendation || typeof recommendation !== 'string') {
      throw new Error('getInvestmentRecommendation did not return a string');
    }
    
    logger.info('✅ getInvestmentRecommendation test passed', { 
      recommendationLength: recommendation.length,
      preview: `${recommendation.substring(0, 100)}...`
    });
    
    // Test 3: Test error handling
    logger.info('3. Testing error handling...', { requestId });
    let errorCaught = false;
    
    try {
      // Test with invalid API key
      const invalidEngine = new (aiEngine.constructor)('invalid-key');
      await invalidEngine.generateResponse([{ role: 'user', content: 'Hello' }]);
    } catch (error) {
      errorCaught = true;
      if (!error.message.includes('AI API Error')) {
        throw new Error('Unexpected error message: ' + error.message);
      }
    }
    
    if (!errorCaught) {
      throw new Error('Expected an error with invalid API key');
    }
    
    logger.info('✅ Error handling test passed');
    
    // Test 4: Test with different temperature settings
    logger.info('4. Testing different temperature settings...', { requestId });
    
    const tempResults = [];
    const temperatures = [0.2, 0.5, 0.8];
    
    for (const temp of temperatures) {
      const startTime = Date.now();
      const response = await aiEngine.generateResponse(
        [{ role: 'user', content: 'Tell me a short story about investing.' }],
        { 
          temperature: temp,
          maxTokens: 50,
          requestId: `${requestId}_temp_${temp}`
        }
      );
      
      tempResults.push({
        temperature: temp,
        responseLength: response.length,
        duration: Date.now() - startTime
      });
    }
    
    logger.info('✅ Temperature test completed', { results: tempResults });
    
    // Test 5: Test token limits
    logger.info('5. Testing token limits...', { requestId });
    
    const longPrompt = 'Tell me about ' + 
      Array(1000).fill('investing ').join('') + 
      'in exactly 50 words.';
    
    const limitedResponse = await aiEngine.generateResponse(
      [{ role: 'user', content: longPrompt }],
      { 
        maxTokens: 50,
        requestId: `${requestId}_token_test`
      }
    );
    
    // Rough estimate of token count (4 chars per token is a rough estimate)
    const tokenEstimate = Math.ceil(limitedResponse.length / 4);
    
    if (tokenEstimate > 60) { // Allow some buffer
      throw new Error(`Token limit not respected: estimated ${tokenEstimate} tokens`);
    }
    
    logger.info('✅ Token limit test passed', { 
      responseLength: limitedResponse.length,
      estimatedTokens: tokenEstimate
    });
    
    logger.info('🎉 All AI Engine tests passed successfully!', { requestId });
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Test failed', { 
      error: error.message,
      stack: error.stack,
      requestId
    });
    process.exit(1);
  }
}

// Run the tests
testAiEngine().catch(error => {
  logger.error('Unhandled error in test suite', { 
    error: error.message,
    stack: error.stack 
  });
  process.exit(1);
});
