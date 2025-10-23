#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import { McpContextManager } from '../mcp/McpContextManager.js';
import { AlphaVantageAdapter } from '../mcp/adapters/AlphaVantageAdapter.js';
import { OpenRouterAdapter } from '../mcp/adapters/OpenRouterAdapter.js';
import { SupabaseAdapter } from '../mcp/adapters/SupabaseAdapter.js';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Test configuration
const TEST_SYMBOL = 'AAPL';
const TEST_USER_ID = 'test_user_123';
const TEST_CONTEXT_ID = `test_${Date.now()}`;

/**
 * Main test function
 */
async function testMcpPipeline() {
  const requestId = `mcp_test_${Date.now()}`;
  logger.info('Starting MCP pipeline test', { requestId, contextId: TEST_CONTEXT_ID });
  
  try {
    // Initialize MCP Context Manager
    const contextManager = new McpContextManager();
    
    // 1. Initialize adapters
    logger.info('1. Initializing MCP adapters...', { requestId });
    const adapters = await initializeAdapters(contextManager);
    
    // 2. Test market data retrieval
    logger.info('2. Testing market data retrieval...', { requestId });
    const marketData = await testMarketData(adapters.alphaVantage, TEST_SYMBOL, requestId);
    
    // 3. Test context management
    logger.info('3. Testing context management...', { requestId });
    await testContextManagement(contextManager, marketData, requestId);
    
    // 4. Test AI integration
    logger.info('4. Testing AI integration...', { requestId });
    await testAiIntegration(adapters.openRouter, marketData, requestId);
    
    // 5. Test Supabase storage
    logger.info('5. Testing Supabase storage...', { requestId });
    await testSupabaseStorage(adapters.supabase, marketData, requestId);
    
    logger.info('✅ MCP pipeline test completed successfully', { 
      requestId,
      contextId: TEST_CONTEXT_ID 
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ MCP pipeline test failed', { 
      requestId, 
      contextId: TEST_CONTEXT_ID,
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
}

/**
 * Initialize MCP adapters
 */
async function initializeAdapters(contextManager) {
  try {
    // Initialize Alpha Vantage adapter
    const alphaVantage = new AlphaVantageAdapter({
      apiKey: process.env.ALPHA_VANTAGE_API_KEY,
      contextManager
    });
    
    // Initialize OpenRouter adapter
    const openRouter = new OpenRouterAdapter({
      apiKey: process.env.OPENROUTER_API_KEY,
      contextManager,
      model: 'meta-llama/llama-3-70b-instruct'
    });
    
    // Initialize Supabase adapter
    const supabase = new SupabaseAdapter({
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_SERVICE_KEY,
      contextManager
    });
    
    logger.info('✅ Successfully initialized all MCP adapters');
    
    return { alphaVantage, openRouter, supabase };
  } catch (error) {
    logger.error('Failed to initialize MCP adapters', { error: error.message });
    throw error;
  }
}

/**
 * Test market data retrieval
 */
async function testMarketData(alphaVantage, symbol, requestId) {
  try {
    // Get stock quote
    const quote = await alphaVantage.getQuote(symbol, { requestId });
    
    if (!quote || !quote['05. price']) {
      throw new Error('Failed to retrieve stock quote');
    }
    
    // Get company overview
    const overview = await alphaVantage.getCompanyOverview(symbol, { requestId });
    
    if (!overview || !overview.Symbol) {
      throw new Error('Failed to retrieve company overview');
    }
    
    logger.info('✅ Successfully retrieved market data', {
      symbol,
      price: quote['05. price'],
      company: overview.Name,
      sector: overview.Sector
    });
    
    return { quote, overview };
  } catch (error) {
    logger.error('Market data test failed', { 
      symbol,
      requestId,
      error: error.message 
    });
    throw error;
  }
}

/**
 * Test context management
 */
async function testContextManagement(contextManager, marketData, requestId) {
  try {
    const { quote, overview } = marketData;
    
    // Create a new context
    const context = await contextManager.createContext({
      id: TEST_CONTEXT_ID,
      name: 'Test Context',
      description: 'Test context for MCP pipeline',
      metadata: {
        symbol: overview.Symbol,
        companyName: overview.Name,
        requestId
      }
    });
    
    // Add market data to context
    await context.addData('market_data', {
      quote,
      overview,
      timestamp: new Date().toISOString()
    });
    
    // Get context data
    const contextData = await context.getData('market_data');
    
    if (!contextData || !contextData.quote || !contextData.overview) {
      throw new Error('Failed to retrieve context data');
    }
    
    logger.info('✅ Successfully tested context management', {
      contextId: context.id,
      dataTypes: await context.listDataTypes()
    });
    
    return context;
  } catch (error) {
    logger.error('Context management test failed', { 
      requestId,
      error: error.message 
    });
    throw error;
  }
}

/**
 * Test AI integration
 */
async function testAiIntegration(openRouter, marketData, requestId) {
  try {
    const { overview } = marketData;
    
    // Generate a simple AI response
    const response = await openRouter.generateResponse({
      model: 'meta-llama/llama-3-70b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that provides educational information about stocks.'
        },
        {
          role: 'user',
          content: `Provide a brief educational summary about ${overview.Name} (${overview.Symbol}).`
        }
      ],
      context: {
        id: TEST_CONTEXT_ID,
        type: 'ai_request',
        metadata: {
          requestId,
          symbol: overview.Symbol
        }
      }
    });
    
    if (!response || !response.choices || !response.choices[0]) {
      throw new Error('Invalid AI response format');
    }
    
    const aiResponse = response.choices[0].message.content;
    
    logger.info('✅ Successfully tested AI integration', {
      symbol: overview.Symbol,
      responseLength: aiResponse.length,
      preview: `${aiResponse.substring(0, 100)}...`
    });
    
    return aiResponse;
  } catch (error) {
    logger.error('AI integration test failed', { 
      requestId,
      error: error.message 
    });
    throw error;
  }
}

/**
 * Test Supabase storage
 */
async function testSupabaseStorage(supabase, marketData, requestId) {
  try {
    const { overview } = marketData;
    
    // Test data
    const testData = {
      symbol: overview.Symbol,
      name: overview.Name,
      sector: overview.Sector,
      test_timestamp: new Date().toISOString(),
      metadata: {
        requestId,
        test: true
      }
    };
    
    // In a real implementation, this would save to Supabase
    // For now, we'll just log the action
    logger.info('✅ Simulated saving to Supabase', {
      table: 'test_table',
      data: testData
    });
    
    return true;
  } catch (error) {
    logger.error('Supabase storage test failed', { 
      requestId,
      error: error.message 
    });
    throw error;
  }
}

// Run the test
testMcpPipeline().catch(error => {
  logger.error('Unhandled error in MCP test pipeline', { 
    error: error.message,
    stack: error.stack 
  });
  process.exit(1);
});
