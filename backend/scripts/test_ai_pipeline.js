#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import { dataInsights } from '../ai-services/dataInsights.js';
import { ruleBase } from '../ai-services/ruleBase.js';
import { aiEngine } from '../ai-services/aiEngine.js';

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
async function testAiPipeline() {
  const requestId = `test_${Date.now()}`;
  logger.info('Starting AI pipeline test', { requestId });
  
  try {
    // 1. Test market data retrieval
    logger.info('1. Testing market data retrieval...', { requestId });
    const quote = await testMarketData();
    
    // 2. Test rule-based evaluation
    logger.info('2. Testing rule-based evaluation...', { requestId });
    const evaluation = await testRuleBasedEvaluation(quote);
    
    // 3. Test AI recommendation
    logger.info('3. Testing AI recommendation...', { requestId });
    const recommendation = await testAiRecommendation(evaluation);
    
    // 4. Test Supabase storage
    logger.info('4. Testing Supabase storage...', { requestId });
    await testSupabaseStorage(TEST_USER_ID, recommendation);
    
    logger.info('✅ AI pipeline test completed successfully', { requestId });
    process.exit(0);
  } catch (error) {
    logger.error('❌ AI pipeline test failed', { 
      requestId, 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
}

/**
 * Test market data retrieval
 */
async function testMarketData() {
  try {
    // Get stock quote
    const quote = await dataInsights.getStockQuote(TEST_SYMBOL);
    
    if (!quote || !quote['05. price']) {
      throw new Error('Failed to retrieve stock quote');
    }
    
    logger.info('✅ Successfully retrieved stock quote', {
      symbol: TEST_SYMBOL,
      price: quote['05. price'],
      change: quote['09. change']
    });
    
    // Get company overview
    const overview = await dataInsights.getCompanyOverview(TEST_SYMBOL);
    
    if (!overview || !overview.Symbol) {
      throw new Error('Failed to retrieve company overview');
    }
    
    logger.info('✅ Successfully retrieved company overview', {
      name: overview.Name,
      sector: overview.Sector,
      marketCap: overview.MarketCapitalization
    });
    
    return { quote, overview };
  } catch (error) {
    logger.error('Market data test failed', { error: error.message });
    throw error;
  }
}

/**
 * Test rule-based evaluation
 */
async function testRuleBasedEvaluation(marketData) {
  try {
    const { quote, overview } = marketData;
    
    // Prepare metrics for evaluation
    const metrics = {
      symbol: TEST_SYMBOL,
      peRatio: parseFloat(overview.PERatio) || 0,
      pegRatio: parseFloat(overview.PEGRatio) || 0,
      dividendYield: parseFloat(overview.DividendYield) || 0,
      beta: parseFloat(overview.Beta) || 0,
      fiftyTwoWeekHigh: parseFloat(overview['52WeekHigh']) || 0,
      fiftyTwoWeekLow: parseFloat(overview['52WeekLow']) || 0,
      currentPrice: parseFloat(quote['05. price']) || 0
    };
    
    // Evaluate stock
    const evaluation = ruleBase.evaluateStock(metrics);
    
    logger.info('✅ Successfully evaluated stock', {
      symbol: TEST_SYMBOL,
      rating: evaluation.rating,
      score: evaluation.value,
      metrics: evaluation.metrics
    });
    
    return { metrics, evaluation };
  } catch (error) {
    logger.error('Rule-based evaluation test failed', { error: error.message });
    throw error;
  }
}

/**
 * Test AI recommendation
 */
async function testAiRecommendation(evaluationData) {
  try {
    const { metrics, evaluation } = evaluationData;
    
    // Prepare context for AI
    const context = {
      symbol: TEST_SYMBOL,
      metrics,
      evaluation,
      timestamp: new Date().toISOString()
    };
    
    // Get AI recommendation
    const recommendation = await aiEngine.getInvestmentRecommendation(context);
    
    logger.info('✅ Successfully generated AI recommendation', {
      symbol: TEST_SYMBOL,
      recommendation: recommendation.substring(0, 100) + '...' // Log first 100 chars
    });
    
    return { context, recommendation };
  } catch (error) {
    logger.error('AI recommendation test failed', { error: error.message });
    throw error;
  }
}

/**
 * Test Supabase storage
 */
async function testSupabaseStorage(userId, recommendation) {
  try {
    // In a real implementation, this would save to Supabase
    // For now, we'll just log the action
    logger.info('✅ Simulated saving to Supabase', {
      userId,
      recommendationId: `rec_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    logger.error('Supabase storage test failed', { error: error.message });
    throw error;
  }
}

// Run the test
testAiPipeline().catch(error => {
  logger.error('Unhandled error in test pipeline', { error: error.message });
  process.exit(1);
});
