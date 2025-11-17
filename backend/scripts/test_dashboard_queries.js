/**
 * Dashboard Query Verification Script
 * 
 * Tests the exact queries used by the frontend dashboard to verify they work correctly.
 * 
 * Usage:
 *   node backend/scripts/test_dashboard_queries.js [USER_ID] [PORTFOLIO_ID]
 * 
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_ANON_KEY environment variable (for RLS testing)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

const userId = process.argv[2];
const portfolioId = process.argv[3];

console.log('📊 Dashboard Query Verification');
console.log('===============================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const results = {
  portfolio: { success: false, error: null, data: null },
  holdings: { success: false, error: null, data: null, count: 0 },
  transactions: { success: false, error: null, data: null, count: 0 }
};

async function testPortfolioQuery() {
  if (!userId) {
    return { success: false, error: 'No user_id provided' };
  }
  
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_simulation', false)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message, code: error.code };
    }
    
    return { success: true, error: null, data: data || null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function testHoldingsQuery(portfolioId) {
  if (!portfolioId || !userId) {
    return { success: false, error: 'No portfolio_id or user_id provided' };
  }
  
  try {
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      return { success: false, error: error.message, code: error.code, data: null, count: 0 };
    }
    
    return { success: true, error: null, data: data || [], count: data?.length || 0 };
  } catch (err) {
    return { success: false, error: err.message, data: null, count: 0 };
  }
}

async function testTransactionsQuery(portfolioId) {
  if (!portfolioId || !userId) {
    return { success: false, error: 'No portfolio_id or user_id provided' };
  }
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false, nullsFirst: false })
      .limit(100);
    
    if (error) {
      return { success: false, error: error.message, code: error.code, data: null, count: 0 };
    }
    
    return { success: true, error: null, data: data || [], count: data?.length || 0 };
  } catch (err) {
    return { success: false, error: err.message, data: null, count: 0 };
  }
}

async function main() {
  if (!userId) {
    console.log('⚠️  No user_id provided');
    console.log('Usage: node backend/scripts/test_dashboard_queries.js USER_ID [PORTFOLIO_ID]\n');
    process.exit(1);
  }
  
  console.log(`Testing with user_id: ${userId}`);
  if (portfolioId) {
    console.log(`Testing with portfolio_id: ${portfolioId}\n`);
  } else {
    console.log('Portfolio ID will be fetched automatically\n');
  }
  
  // Test 1: Portfolio Query
  console.log('Test 1: Portfolio Query');
  console.log('------------------------');
  const portfolioResult = await testPortfolioQuery();
  results.portfolio = portfolioResult;
  
  if (portfolioResult.success) {
    console.log('✅ Portfolio query succeeded');
    if (portfolioResult.data) {
      console.log(`   Portfolio ID: ${portfolioResult.data.id}`);
      console.log(`   Portfolio Name: ${portfolioResult.data.name || 'N/A'}`);
      if (!portfolioId) {
        // Use the fetched portfolio ID for subsequent tests
        const fetchedPortfolioId = portfolioResult.data.id;
        console.log(`\nUsing portfolio_id: ${fetchedPortfolioId}\n`);
        
        // Test 2: Holdings Query
        console.log('Test 2: Holdings Query');
        console.log('----------------------');
        const holdingsResult = await testHoldingsQuery(fetchedPortfolioId);
        results.holdings = holdingsResult;
        
        if (holdingsResult.success) {
          console.log(`✅ Holdings query succeeded`);
          console.log(`   Returned ${holdingsResult.count} holdings`);
          if (holdingsResult.count > 0) {
            console.log(`   Sample holding: ${holdingsResult.data[0].symbol || 'N/A'}`);
          }
        } else {
          console.log(`❌ Holdings query failed: ${holdingsResult.error}`);
          if (holdingsResult.code) console.log(`   Error code: ${holdingsResult.code}`);
        }
        
        // Test 3: Transactions Query
        console.log('\nTest 3: Transactions Query');
        console.log('--------------------------');
        const transactionsResult = await testTransactionsQuery(fetchedPortfolioId);
        results.transactions = transactionsResult;
        
        if (transactionsResult.success) {
          console.log(`✅ Transactions query succeeded`);
          console.log(`   Returned ${transactionsResult.count} transactions`);
          if (transactionsResult.count > 0) {
            console.log(`   Sample transaction: ${transactionsResult.data[0].symbol || 'N/A'} (${transactionsResult.data[0].transaction_type || 'N/A'})`);
          }
        } else {
          console.log(`❌ Transactions query failed: ${transactionsResult.error}`);
          if (transactionsResult.code) console.log(`   Error code: ${transactionsResult.code}`);
        }
      } else {
        console.log('⚠️  No portfolio found for user');
        console.log('   Dashboard will create a new portfolio on first load');
      }
    } else {
      console.log('⚠️  No portfolio found (this is OK - will be created on first load)');
    }
  } else {
    console.log(`❌ Portfolio query failed: ${portfolioResult.error}`);
    if (portfolioResult.code) console.log(`   Error code: ${portfolioResult.code}`);
  }
  
  // If portfolio ID was provided, test queries directly
  if (portfolioId) {
    console.log('\nTest 2: Holdings Query');
    console.log('----------------------');
    const holdingsResult = await testHoldingsQuery(portfolioId);
    results.holdings = holdingsResult;
    
    if (holdingsResult.success) {
      console.log(`✅ Holdings query succeeded`);
      console.log(`   Returned ${holdingsResult.count} holdings`);
    } else {
      console.log(`❌ Holdings query failed: ${holdingsResult.error}`);
    }
    
    console.log('\nTest 3: Transactions Query');
    console.log('--------------------------');
    const transactionsResult = await testTransactionsQuery(portfolioId);
    results.transactions = transactionsResult;
    
    if (transactionsResult.success) {
      console.log(`✅ Transactions query succeeded`);
      console.log(`   Returned ${transactionsResult.count} transactions`);
    } else {
      console.log(`❌ Transactions query failed: ${transactionsResult.error}`);
    }
  }
  
  // Summary
  console.log('\n📊 Dashboard Query Summary');
  console.log('==========================\n');
  
  const allQueriesPassed = 
    results.portfolio.success &&
    results.holdings.success &&
    results.transactions.success;
  
  if (allQueriesPassed) {
    console.log('✅ All dashboard queries are working correctly');
    console.log(`   Portfolio: ✅ Found`);
    console.log(`   Holdings: ✅ ${results.holdings.count} rows`);
    console.log(`   Transactions: ✅ ${results.transactions.count} rows`);
  } else {
    console.log('❌ Some dashboard queries failed:');
    if (!results.portfolio.success) {
      console.log(`   Portfolio: ❌ ${results.portfolio.error}`);
    }
    if (!results.holdings.success) {
      console.log(`   Holdings: ❌ ${results.holdings.error}`);
    }
    if (!results.transactions.success) {
      console.log(`   Transactions: ❌ ${results.transactions.error}`);
    }
  }
  
  console.log('\n');
}

main().catch(console.error);

