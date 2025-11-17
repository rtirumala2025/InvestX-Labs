/**
 * Test Realtime Connection Utility
 * 
 * This script tests Supabase Realtime subscriptions for holdings and transactions tables.
 * Run this in the browser console or import it for programmatic testing.
 */

import { supabase } from '../services/supabase/config';

let holdingsSubscription = null;
let transactionsSubscription = null;
let testResults = {
  config: {
    url: process.env.REACT_APP_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    key: process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    clientInitialized: supabase && typeof supabase.channel === 'function' ? '✅ Yes' : '❌ No'
  },
  holdings: {
    status: 'pending',
    connected: false,
    error: null,
    events: []
  },
  transactions: {
    status: 'pending',
    connected: false,
    error: null,
    events: []
  }
};

/**
 * Test holdings Realtime subscription
 */
export const testHoldingsSubscription = (portfolioId, onStatusChange) => {
  if (!portfolioId) {
    testResults.holdings.status = 'error';
    testResults.holdings.error = 'No portfolio ID provided';
    return null;
  }

  console.log('🧪 [RealtimeTest] Testing holdings subscription for portfolio:', portfolioId);

  const channel = supabase
    .channel(`test-holdings-${portfolioId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'holdings',
        filter: `portfolio_id=eq.${portfolioId}`,
      },
      (payload) => {
        console.log('🧪 [RealtimeTest] ✅ Holdings event received:', payload.eventType);
        testResults.holdings.events.push({
          type: payload.eventType,
          timestamp: new Date().toISOString(),
          data: payload.new || payload.old
        });
        onStatusChange?.('event', payload);
      }
    )
    .subscribe((status) => {
      console.log('🧪 [RealtimeTest] Holdings subscription status:', status);
      testResults.holdings.status = status;
      
      if (status === 'SUBSCRIBED') {
        testResults.holdings.connected = true;
        testResults.holdings.error = null;
        console.log('🧪 [RealtimeTest] ✅ Holdings subscription connected');
        onStatusChange?.('connected', null);
      } else if (status === 'CHANNEL_ERROR') {
        testResults.holdings.connected = false;
        testResults.holdings.error = 'Channel error';
        console.error('🧪 [RealtimeTest] ❌ Holdings subscription channel error');
        onStatusChange?.('error', 'Channel error');
      } else if (status === 'TIMED_OUT') {
        testResults.holdings.connected = false;
        testResults.holdings.error = 'Connection timed out';
        console.error('🧪 [RealtimeTest] ❌ Holdings subscription timed out');
        onStatusChange?.('timeout', 'Connection timed out');
      } else if (status === 'CLOSED') {
        testResults.holdings.connected = false;
        console.log('🧪 [RealtimeTest] ⚠️ Holdings subscription closed');
        onStatusChange?.('closed', null);
      }
    });

  holdingsSubscription = channel;
  return channel;
};

/**
 * Test transactions Realtime subscription
 */
export const testTransactionsSubscription = (portfolioId, onStatusChange) => {
  if (!portfolioId) {
    testResults.transactions.status = 'error';
    testResults.transactions.error = 'No portfolio ID provided';
    return null;
  }

  console.log('🧪 [RealtimeTest] Testing transactions subscription for portfolio:', portfolioId);

  const channel = supabase
    .channel(`test-transactions-${portfolioId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `portfolio_id=eq.${portfolioId}`,
      },
      (payload) => {
        console.log('🧪 [RealtimeTest] ✅ Transactions event received:', payload.eventType);
        testResults.transactions.events.push({
          type: payload.eventType,
          timestamp: new Date().toISOString(),
          data: payload.new || payload.old
        });
        onStatusChange?.('event', payload);
      }
    )
    .subscribe((status) => {
      console.log('🧪 [RealtimeTest] Transactions subscription status:', status);
      testResults.transactions.status = status;
      
      if (status === 'SUBSCRIBED') {
        testResults.transactions.connected = true;
        testResults.transactions.error = null;
        console.log('🧪 [RealtimeTest] ✅ Transactions subscription connected');
        onStatusChange?.('connected', null);
      } else if (status === 'CHANNEL_ERROR') {
        testResults.transactions.connected = false;
        testResults.transactions.error = 'Channel error';
        console.error('🧪 [RealtimeTest] ❌ Transactions subscription channel error');
        onStatusChange?.('error', 'Channel error');
      } else if (status === 'TIMED_OUT') {
        testResults.transactions.connected = false;
        testResults.transactions.error = 'Connection timed out';
        console.error('🧪 [RealtimeTest] ❌ Transactions subscription timed out');
        onStatusChange?.('timeout', 'Connection timed out');
      } else if (status === 'CLOSED') {
        testResults.transactions.connected = false;
        console.log('🧪 [RealtimeTest] ⚠️ Transactions subscription closed');
        onStatusChange?.('closed', null);
      }
    });

  transactionsSubscription = channel;
  return channel;
};

/**
 * Clean up test subscriptions
 */
export const cleanupTestSubscriptions = () => {
  if (holdingsSubscription) {
    supabase.removeChannel(holdingsSubscription);
    holdingsSubscription = null;
    console.log('🧪 [RealtimeTest] Cleaned up holdings test subscription');
  }
  if (transactionsSubscription) {
    supabase.removeChannel(transactionsSubscription);
    transactionsSubscription = null;
    console.log('🧪 [RealtimeTest] Cleaned up transactions test subscription');
  }
};

/**
 * Get test results
 */
export const getTestResults = () => {
  return {
    ...testResults,
    summary: {
      configOk: testResults.config.url === '✅ Set' && testResults.config.key === '✅ Set' && testResults.config.clientInitialized === '✅ Yes',
      holdingsOk: testResults.holdings.connected && testResults.holdings.status === 'SUBSCRIBED',
      transactionsOk: testResults.transactions.connected && testResults.transactions.status === 'SUBSCRIBED',
      allOk: 
        testResults.config.url === '✅ Set' && 
        testResults.config.key === '✅ Set' && 
        testResults.config.clientInitialized === '✅ Yes' &&
        testResults.holdings.connected && 
        testResults.holdings.status === 'SUBSCRIBED' &&
        testResults.transactions.connected && 
        testResults.transactions.status === 'SUBSCRIBED'
    }
  };
};

/**
 * Run full test suite
 */
export const runRealtimeTest = async (portfolioId) => {
  console.log('🧪 [RealtimeTest] Starting Realtime connection test...');
  console.log('🧪 [RealtimeTest] Config:', testResults.config);

  if (!portfolioId) {
    console.error('🧪 [RealtimeTest] ❌ No portfolio ID provided');
    return testResults;
  }

  // Test holdings
  testHoldingsSubscription(portfolioId, (status, data) => {
    console.log('🧪 [RealtimeTest] Holdings status update:', status, data);
  });

  // Test transactions
  testTransactionsSubscription(portfolioId, (status, data) => {
    console.log('🧪 [RealtimeTest] Transactions status update:', status, data);
  });

  // Wait 5 seconds for subscriptions to establish
  await new Promise(resolve => setTimeout(resolve, 5000));

  const results = getTestResults();
  console.log('🧪 [RealtimeTest] Test results:', results);
  return results;
};

export default {
  testHoldingsSubscription,
  testTransactionsSubscription,
  cleanupTestSubscriptions,
  getTestResults,
  runRealtimeTest
};

