#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import {
  exponentialBackoff,
  isValidStockSymbol,
  formatFinancialNumber,
  safeJsonParse,
  createApiResponse,
  validateInvestmentParams,
  generateRequestId,
  sanitizeInput,
  calculateROI,
  formatDuration,
  debounce,
  throttle,
  createCache
} from '../ai-services/utils.js';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Main test function
 */
async function testUtils() {
  const requestId = generateRequestId('test_utils');
  logger.info('Starting utils.js test suite', { requestId });
  
  try {
    // Test generateRequestId
    logger.info('1. Testing generateRequestId...');
    const testId = generateRequestId('test');
    if (!testId.startsWith('test_')) {
      throw new Error('generateRequestId prefix test failed');
    }
    logger.info('✅ generateRequestId test passed', { testId });
    
    // Test sanitizeInput
    logger.info('2. Testing sanitizeInput...');
    const maliciousInput = '<script>alert("XSS")</script>';
    const sanitized = sanitizeInput(maliciousInput);
    if (sanitized.includes('<script>') || sanitized.includes('</script>')) {
      throw new Error('sanitizeInput XSS test failed');
    }
    logger.info('✅ sanitizeInput test passed', { sanitized });
    
    // Test isValidStockSymbol
    logger.info('3. Testing isValidStockSymbol...');
    const validSymbols = ['AAPL', 'MSFT', 'GOOGL'];
    const invalidSymbols = ['', 'A'.repeat(11), 'AAPL!'];
    
    for (const symbol of validSymbols) {
      const { isValid } = isValidStockSymbol(symbol);
      if (!isValid) {
        throw new Error(`isValidStockSymbol should accept ${symbol}`);
      }
    }
    
    for (const symbol of invalidSymbols) {
      const { isValid } = isValidStockSymbol(symbol);
      if (isValid) {
        throw new Error(`isValidStockSymbol should reject ${symbol}`);
      }
    }
    logger.info('✅ isValidStockSymbol test passed');
    
    // Test formatFinancialNumber
    logger.info('4. Testing formatFinancialNumber...');
    const currency = formatFinancialNumber(1234.567, { type: 'currency' });
    if (!currency.startsWith('$')) {
      throw new Error('formatFinancialNumber currency test failed');
    }
    
    const percentage = formatFinancialNumber(12.34, { type: 'percentage' });
    if (!percentage.endsWith('%')) {
      throw new Error('formatFinancialNumber percentage test failed');
    }
    logger.info('✅ formatFinancialNumber test passed', { currency, percentage });
    
    // Test safeJsonParse
    logger.info('5. Testing safeJsonParse...');
    const validJson = '{"test": "value"}';
    const invalidJson = '{invalid: json}';
    
    const parsed = safeJsonParse(validJson);
    if (!parsed || parsed.test !== 'value') {
      throw new Error('safeJsonParse valid JSON test failed');
    }
    
    const defaultVal = { default: true };
    const invalidResult = safeJsonParse(invalidJson, defaultVal);
    if (invalidResult !== defaultVal) {
      throw new Error('safeJsonParse invalid JSON test failed');
    }
    logger.info('✅ safeJsonParse test passed');
    
    // Test createApiResponse
    logger.info('6. Testing createApiResponse...');
    const response = createApiResponse({ data: 'test' }, { 
      message: 'Success', 
      statusCode: 200,
      requestId
    });
    
    if (response.status !== 200 || response.data.data !== 'test') {
      throw new Error('createApiResponse test failed');
    }
    logger.info('✅ createApiResponse test passed');
    
    // Test validateInvestmentParams
    logger.info('7. Testing validateInvestmentParams...');
    const validParams = {
      symbol: 'AAPL',
      amount: 1000,
      riskTolerance: 'moderate'
    };
    
    const invalidParams = {
      symbol: '',
      amount: -100,
      riskTolerance: 'invalid'
    };
    
    const validResult = validateInvestmentParams(validParams);
    if (!validResult.isValid) {
      throw new Error('validateInvestmentParams valid test failed');
    }
    
    const invalidResult = validateInvestmentParams(invalidParams);
    if (invalidResult.isValid || invalidResult.errors.length !== 3) {
      throw new Error('validateInvestmentParams invalid test failed');
    }
    logger.info('✅ validateInvestmentParams test passed');
    
    // Test calculateROI
    logger.info('8. Testing calculateROI...');
    const roi = calculateROI(1000, 0.1, 1, { monthlyContribution: 100 });
    if (typeof roi.finalAmount !== 'number' || roi.finalAmount <= 1000) {
      throw new Error('calculateROI test failed');
    }
    logger.info('✅ calculateROI test passed', { 
      finalAmount: roi.finalAmount,
      interestEarned: roi.interestEarned
    });
    
    // Test formatDuration
    logger.info('9. Testing formatDuration...');
    const duration = formatDuration(3661000); // 1 hour, 1 minute, 1 second
    if (!duration.includes('1h') || !duration.includes('1m') || !duration.includes('1s')) {
      throw new Error('formatDuration test failed');
    }
    logger.info('✅ formatDuration test passed', { duration });
    
    // Test debounce and throttle with a simple counter
    logger.info('10. Testing debounce and throttle...');
    
    // Test debounce
    let callCount = 0;
    const debouncedFn = debounce(() => callCount++, 100);
    
    // Call it multiple times quickly - should only execute once after the wait
    debouncedFn();
    debouncedFn();
    debouncedFn();
    
    // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (callCount !== 1) {
      throw new Error('debounce test failed');
    }
    
    // Test throttle
    callCount = 0;
    const throttledFn = throttle(() => callCount++, 100);
    
    // Call it multiple times quickly - should only execute once per interval
    throttledFn();
    throttledFn();
    throttledFn();
    
    // Wait for throttle to complete
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (callCount !== 1) {
      throw new Error('throttle test failed');
    }
    
    logger.info('✅ debounce and throttle tests passed');
    
    // Test createCache
    logger.info('11. Testing createCache...');
    const cache = createCache({ ttl: 100, maxSize: 2 });
    
    // Test basic set/get
    cache.set('key1', 'value1');
    if (cache.get('key1') !== 'value1') {
      throw new Error('cache set/get test failed');
    }
    
    // Test TTL
    await new Promise(resolve => setTimeout(resolve, 150));
    if (cache.get('key1') !== undefined) {
      throw new Error('cache TTL test failed');
    }
    
    // Test max size
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4'); // Should evict key2
    
    if (cache.size() > 2) {
      throw new Error('cache max size test failed');
    }
    
    // Clean up
    cache.destroy();
    logger.info('✅ createCache test passed');
    
    // Test exponentialBackoff with a mock function that fails twice then succeeds
    logger.info('12. Testing exponentialBackoff...');
    let attempt = 0;
    const mockFn = async () => {
      attempt++;
      if (attempt < 3) {
        throw new Error(`Attempt ${attempt} failed`);
      }
      return 'success';
    };
    
    const result = await exponentialBackoff(mockFn, 3, 10);
    if (result !== 'success' || attempt !== 3) {
      throw new Error('exponentialBackoff test failed');
    }
    logger.info('✅ exponentialBackoff test passed');
    
    logger.info('🎉 All utils.js tests passed successfully!');
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
testUtils().catch(error => {
  logger.error('Unhandled error in test suite', { 
    error: error.message,
    stack: error.stack 
  });
  process.exit(1);
});
