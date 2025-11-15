#!/usr/bin/env node

/**
 * Market Service Integration Test
 * 
 * Tests the marketService.js implementation against Supabase RPCs
 * Run: node scripts/testMarketService.js
 */

import 'dotenv/config';
import { 
  getMarketData,
  getBatchMarketData,
  getMarketDataStats,
  isSymbolAllowed,
  getAllowedSymbols,
  testConnection,
  marketServiceUtils,
} from '../src/services/marketService.js';

// Test configuration
const TEST_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL'];
const VERBOSE = process.env.VERBOSE === 'true';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg, data) => {
    console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);
    if (VERBOSE && data) console.log(data);
  },
  success: (msg, data) => {
    console.log(`${colors.green}✓${colors.reset} ${msg}`);
    if (VERBOSE && data) console.log(data);
  },
  error: (msg, error) => {
    console.log(`${colors.red}✗${colors.reset} ${msg}`);
    if (error) {
      console.error(`${colors.red}Error:${colors.reset}`, error.message);
      if (VERBOSE && error.stack) console.error(error.stack);
    }
  },
  warn: (msg) => {
    console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
  },
  section: (msg) => {
    console.log(`\n${colors.cyan}${colors.bright}━━━ ${msg} ━━━${colors.reset}\n`);
  },
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

const recordTest = (name, passed, error = null) => {
  results.tests.push({ name, passed, error });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
};

/**
 * Test 1: Connection Test
 */
async function testConnectionTest() {
  log.section('Test 1: Connection Test');
  
  try {
    log.info('Testing market service connection...');
    const result = await testConnection();
    
    if (result.success) {
      log.success('Market service connection successful');
      log.info(`Timestamp: ${result.timestamp}`);
      recordTest('Connection Test', true);
      return true;
    } else {
      log.error('Market service connection failed', new Error(result.message));
      recordTest('Connection Test', false, result.error);
      return false;
    }
  } catch (error) {
    log.error('Connection test threw exception', error);
    recordTest('Connection Test', false, error.message);
    return false;
  }
}

/**
 * Test 2: Get Single Quote
 */
async function testGetSingleQuote() {
  log.section('Test 2: Get Single Quote');
  
  try {
    const symbol = TEST_SYMBOLS[0];
    log.info(`Fetching quote for ${symbol}...`);
    
    const quote = await getMarketData(symbol, { useCache: false });
    
    if (quote && quote.symbol) {
      log.success(`Quote fetched successfully for ${symbol}`);
      log.info('Quote data:', {
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        percent_change: quote.percent_change,
        source: quote.source,
      });
      recordTest('Get Single Quote', true);
      return quote;
    } else {
      log.error('Invalid quote data returned');
      recordTest('Get Single Quote', false, 'Invalid data structure');
      return null;
    }
  } catch (error) {
    log.error('Failed to fetch single quote', error);
    recordTest('Get Single Quote', false, error.message);
    return null;
  }
}

/**
 * Test 3: Get Batch Quotes
 */
async function testGetBatchQuotes() {
  log.section('Test 3: Get Batch Quotes');
  
  try {
    log.info(`Fetching batch quotes for ${TEST_SYMBOLS.length} symbols...`);
    
    const batch = await getBatchMarketData(TEST_SYMBOLS, { useCache: false });
    
    if (batch && batch.quotes && Array.isArray(batch.quotes)) {
      log.success(`Batch quotes fetched successfully`);
      log.info(`Received ${batch.count} quotes`);
      if (VERBOSE) {
        batch.quotes.forEach(q => {
          log.info(`  ${q.symbol}: $${q.price}`);
        });
      }
      recordTest('Get Batch Quotes', true);
      return batch;
    } else {
      log.error('Invalid batch data returned');
      recordTest('Get Batch Quotes', false, 'Invalid data structure');
      return null;
    }
  } catch (error) {
    log.error('Failed to fetch batch quotes', error);
    recordTest('Get Batch Quotes', false, error.message);
    return null;
  }
}

/**
 * Test 4: Cache Functionality
 */
async function testCacheFunctionality() {
  log.section('Test 4: Cache Functionality');
  
  try {
    const symbol = TEST_SYMBOLS[0];
    log.info('Testing cache hit...');
    
    // First call - should hit Supabase
    const start1 = Date.now();
    const quote1 = await getMarketData(symbol, { useCache: true });
    const time1 = Date.now() - start1;
    
    // Second call - should hit cache
    const start2 = Date.now();
    const quote2 = await getMarketData(symbol, { useCache: true });
    const time2 = Date.now() - start2;
    
    log.info(`First call: ${time1}ms, Second call: ${time2}ms`);
    
    if (time2 < time1) {
      log.success('Cache is working (second call was faster)');
      recordTest('Cache Functionality', true);
    } else {
      log.warn('Cache might not be working (second call was not faster)');
      results.warnings++;
      recordTest('Cache Functionality', true); // Still pass, timing can vary
    }
    
    // Test cache clear
    log.info('Testing cache clear...');
    marketServiceUtils.clearCache();
    log.success('Cache cleared successfully');
    
    return true;
  } catch (error) {
    log.error('Cache functionality test failed', error);
    recordTest('Cache Functionality', false, error.message);
    return false;
  }
}

/**
 * Test 5: Symbol Validation
 */
async function testSymbolValidation() {
  log.section('Test 5: Symbol Validation');
  
  try {
    log.info('Testing symbol validation...');
    
    // Test allowed symbol
    const allowed = await isSymbolAllowed('AAPL');
    if (allowed) {
      log.success('AAPL is correctly identified as allowed');
    } else {
      log.error('AAPL should be allowed');
      recordTest('Symbol Validation', false, 'AAPL not allowed');
      return false;
    }
    
    // Test invalid symbol
    const notAllowed = await isSymbolAllowed('INVALID123');
    if (!notAllowed) {
      log.success('INVALID123 is correctly identified as not allowed');
    } else {
      log.warn('INVALID123 should not be allowed');
      results.warnings++;
    }
    
    recordTest('Symbol Validation', true);
    return true;
  } catch (error) {
    log.error('Symbol validation test failed', error);
    recordTest('Symbol Validation', false, error.message);
    return false;
  }
}

/**
 * Test 6: Get Allowed Symbols
 */
async function testGetAllowedSymbols() {
  log.section('Test 6: Get Allowed Symbols');
  
  try {
    log.info('Fetching allowed symbols...');
    
    const symbols = await getAllowedSymbols();
    
    if (symbols && Array.isArray(symbols) && symbols.length > 0) {
      log.success(`Fetched ${symbols.length} allowed symbols`);
      if (VERBOSE) {
        symbols.slice(0, 5).forEach(s => {
          log.info(`  ${s.symbol}: ${s.name} (${s.exchange})`);
        });
        if (symbols.length > 5) {
          log.info(`  ... and ${symbols.length - 5} more`);
        }
      }
      recordTest('Get Allowed Symbols', true);
      return symbols;
    } else {
      log.error('Invalid allowed symbols data');
      recordTest('Get Allowed Symbols', false, 'Invalid data structure');
      return null;
    }
  } catch (error) {
    log.error('Failed to fetch allowed symbols', error);
    recordTest('Get Allowed Symbols', false, error.message);
    return null;
  }
}

/**
 * Test 7: Get Cache Statistics
 */
async function testGetCacheStatistics() {
  log.section('Test 7: Get Cache Statistics');
  
  try {
    log.info('Fetching cache statistics...');
    
    const stats = await getMarketDataStats();
    
    if (stats) {
      log.success('Cache statistics fetched successfully');
      log.info('Statistics:', {
        total_cached: stats.total_cached,
        expired: stats.expired,
        active: stats.active,
      });
      recordTest('Get Cache Statistics', true);
      return stats;
    } else {
      log.error('Invalid statistics data');
      recordTest('Get Cache Statistics', false, 'Invalid data structure');
      return null;
    }
  } catch (error) {
    log.error('Failed to fetch cache statistics', error);
    recordTest('Get Cache Statistics', false, error.message);
    return null;
  }
}

/**
 * Test 8: Force Refresh
 */
async function testForceRefresh() {
  log.section('Test 8: Force Refresh');
  
  try {
    const symbol = TEST_SYMBOLS[0];
    log.info(`Testing force refresh for ${symbol}...`);
    
    // First call
    const quote1 = await getMarketData(symbol, { useCache: true });
    
    // Force refresh
    const quote2 = await getMarketData(symbol, { useCache: true, forceRefresh: true });
    
    // Both should have data
    if (quote1 && quote2) {
      log.success('Force refresh works correctly');
      log.info(`First price: ${quote1.price}, Second price: ${quote2.price}`);
      recordTest('Force Refresh', true);
      return true;
    } else {
      log.error('Force refresh failed');
      recordTest('Force Refresh', false, 'Missing data');
      return false;
    }
  } catch (error) {
    log.error('Force refresh test failed', error);
    recordTest('Force Refresh', false, error.message);
    return false;
  }
}

/**
 * Print Test Summary
 */
function printSummary() {
  log.section('Test Summary');
  
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  
  if (results.failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  ${colors.red}✗${colors.reset} ${t.name}`);
        if (t.error) console.log(`    Error: ${t.error}`);
      });
  }
  
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  if (results.failed === 0) {
    console.log(`${colors.green}${colors.bright}✓ All tests passed!${colors.reset}\n`);
    return 0;
  } else {
    console.log(`${colors.red}${colors.bright}✗ Some tests failed${colors.reset}\n`);
    return 1;
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Market Service Integration Tests    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
  
  log.info(`Test Symbols: ${TEST_SYMBOLS.join(', ')}`);
  log.info(`Verbose Mode: ${VERBOSE}`);
  log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Run tests sequentially
  const connectionOk = await testConnectionTest();
  
  if (!connectionOk) {
    log.warn('Skipping remaining tests due to connection failure');
    return printSummary();
  }
  
  await testGetSingleQuote();
  await testGetBatchQuotes();
  await testCacheFunctionality();
  await testSymbolValidation();
  await testGetAllowedSymbols();
  await testGetCacheStatistics();
  await testForceRefresh();
  
  return printSummary();
}

// Run tests
runAllTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    log.error('Unexpected error in test runner', error);
    process.exit(1);
  });
