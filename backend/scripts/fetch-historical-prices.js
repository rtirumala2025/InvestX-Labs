#!/usr/bin/env node

/**
 * Historical Price Data Fetcher
 * 
 * Fetches historical stock prices from Alpha Vantage API and caches them
 * in the Supabase market_history table for use in charts and benchmarks.
 * 
 * Usage:
 *   node scripts/fetch-historical-prices.js [symbol1] [symbol2] ...
 *   Or set FETCH_SYMBOLS env var with comma-separated symbols
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dataInsights } from '../ai-system/index.js';
import { adminSupabase } from '../ai-system/supabaseClient.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Default symbols to fetch if none provided
const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'SPY', 'QQQ'];

/**
 * Parse command line arguments or environment variable for symbols
 */
function getSymbols() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    return args;
  }
  
  if (process.env.FETCH_SYMBOLS) {
    return process.env.FETCH_SYMBOLS.split(',').map(s => s.trim().toUpperCase());
  }
  
  return DEFAULT_SYMBOLS;
}

/**
 * Fetch historical data for a single symbol and cache in Supabase
 */
async function fetchAndCacheHistoricalData(symbol, interval = 'daily') {
  try {
    logger.info(`Fetching historical data for ${symbol} (${interval})...`);
    
    // Fetch from Alpha Vantage
    const timeSeries = await dataInsights.getTimeSeries(symbol, interval, true); // full output
    
    if (!timeSeries || typeof timeSeries !== 'object') {
      logger.warn(`No time series data returned for ${symbol}`);
      return { symbol, success: false, reason: 'No data returned' };
    }
    
    // Transform Alpha Vantage format to database format
    const records = Object.entries(timeSeries).map(([dateStr, data]) => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Try alternative date format
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          date.setFullYear(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }
      
      return {
        symbol: symbol.toUpperCase(),
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        open: parseFloat(data['1. open'] || data.open || 0),
        high: parseFloat(data['2. high'] || data.high || 0),
        low: parseFloat(data['3. low'] || data.low || 0),
        close: parseFloat(data['4. close'] || data.close || 0),
        volume: parseInt(data['5. volume'] || data.volume || 0, 10),
        interval: interval
      };
    }).filter(record => record.date && !isNaN(record.open));
    
    if (records.length === 0) {
      logger.warn(`No valid records parsed for ${symbol}`);
      return { symbol, success: false, reason: 'No valid records' };
    }
    
    logger.info(`Fetched ${records.length} data points for ${symbol}`);
    
    // Upsert into database (use ON CONFLICT to handle duplicates)
    if (adminSupabase) {
      const { error } = await adminSupabase
        .from('market_history')
        .upsert(records, {
          onConflict: 'symbol,date,interval',
          ignoreDuplicates: false
        });
      
      if (error) {
        logger.error(`Error upserting historical data for ${symbol}:`, error);
        return { symbol, success: false, reason: error.message };
      }
      
      logger.info(`✅ Successfully cached ${records.length} records for ${symbol}`);
      return { symbol, success: true, recordsCount: records.length };
    } else {
      logger.error('Supabase admin client not available');
      return { symbol, success: false, reason: 'Supabase unavailable' };
    }
    
  } catch (error) {
    logger.error(`Error fetching historical data for ${symbol}:`, error);
    return { symbol, success: false, reason: error.message };
  }
}

/**
 * Main execution function
 */
async function main() {
  const symbols = getSymbols();
  logger.info(`🚀 Starting historical price fetch for ${symbols.length} symbols: ${symbols.join(', ')}`);
  
  const results = [];
  
  // Process symbols sequentially to respect rate limits
  for (const symbol of symbols) {
    // Add delay between requests to respect Alpha Vantage rate limits (5 calls/minute)
    if (results.length > 0) {
      logger.info('⏳ Waiting 13 seconds to respect rate limits...');
      await new Promise(resolve => setTimeout(resolve, 13000));
    }
    
    const result = await fetchAndCacheHistoricalData(symbol);
    results.push(result);
  }
  
  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  logger.info('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info(`✅ Completed: ${successful.length} successful, ${failed.length} failed`);
  
  if (successful.length > 0) {
    logger.info('\n✅ Successful:');
    successful.forEach(r => {
      logger.info(`  - ${r.symbol}: ${r.recordsCount || 0} records`);
    });
  }
  
  if (failed.length > 0) {
    logger.info('\n❌ Failed:');
    failed.forEach(r => {
      logger.info(`  - ${r.symbol}: ${r.reason || 'Unknown error'}`);
    });
  }
  
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  process.exit(failed.length > 0 ? 1 : 0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Fatal error:', error);
    process.exit(1);
  });
}

export { fetchAndCacheHistoricalData };

