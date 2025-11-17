/**
 * Realtime Subscription Verification Script
 * 
 * Verifies that Realtime is properly configured for holdings and transactions tables.
 * 
 * Usage:
 *   node backend/scripts/verify_realtime_subscriptions.js
 * 
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable (for admin queries)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('\nPlease set these in your .env file');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🔄 Realtime Subscription Verification');
console.log('=====================================\n');

const results = {
  publication: { exists: false, name: null },
  tables: {
    holdings: { inPublication: false, realtimeEnabled: false },
    transactions: { inPublication: false, realtimeEnabled: false }
  },
  allTables: []
};

async function checkPublication() {
  // Note: Supabase doesn't expose publication metadata via JS client
  // This would need to be checked via direct SQL query
  console.log('📋 Checking supabase_realtime publication...');
  console.log('   ⚠️  Publication status requires direct SQL query');
  console.log('   Run this SQL in Supabase SQL Editor:\n');
  console.log('   SELECT * FROM pg_publication WHERE pubname = \'supabase_realtime\';\n');
  
  return { exists: null, requiresSQL: true };
}

async function checkTableInPublication(tableName) {
  // Note: Supabase doesn't expose publication tables via JS client
  // This would need to be checked via direct SQL query
  console.log(`📋 Checking if ${tableName} is in publication...`);
  console.log('   ⚠️  Publication table status requires direct SQL query');
  console.log(`   Run this SQL in Supabase SQL Editor:\n`);
  console.log(`   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = '${tableName}';\n`);
  
  return { inPublication: null, requiresSQL: true };
}

async function testRealtimeSubscription(tableName) {
  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ 
          success: false, 
          error: 'Timeout waiting for subscription',
          subscribed: false 
        });
      }
    }, 5000);
    
    const channel = adminClient
      .channel(`verify-realtime-${tableName}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: tableName
      }, (payload) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({ 
            success: true, 
            error: null, 
            subscribed: true,
            receivedEvent: true
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({ 
              success: true, 
              error: null, 
              subscribed: true,
              receivedEvent: false
            });
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({ 
              success: false, 
              error: `Subscription ${status}`, 
              subscribed: false
            });
          }
        }
      });
    
    // Clean up after test
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        adminClient.removeChannel(channel);
        resolve({ 
          success: false, 
          error: 'Subscription did not connect', 
          subscribed: false
        });
      }
    }, 3000);
  });
}

async function main() {
  console.log('⚠️  Note: Supabase JS client does not expose publication metadata');
  console.log('   Direct SQL queries are required for complete verification\n');
  
  // Test 1: Check publication (requires SQL)
  const publicationCheck = await checkPublication();
  results.publication = publicationCheck;
  
  // Test 2: Check tables in publication (requires SQL)
  console.log('📋 Checking tables in publication...\n');
  const holdingsPubCheck = await checkTableInPublication('holdings');
  const transactionsPubCheck = await checkTableInPublication('transactions');
  
  // Test 3: Test Realtime subscription connectivity
  console.log('🔄 Testing Realtime subscription connectivity...\n');
  
  console.log('Testing holdings subscription...');
  const holdingsRealtime = await testRealtimeSubscription('holdings');
  results.tables.holdings.realtimeEnabled = holdingsRealtime.success;
  
  if (holdingsRealtime.success) {
    console.log('  ✅ Holdings subscription connected');
  } else {
    console.log(`  ❌ Holdings subscription failed: ${holdingsRealtime.error}`);
  }
  
  console.log('\nTesting transactions subscription...');
  const transactionsRealtime = await testRealtimeSubscription('transactions');
  results.tables.transactions.realtimeEnabled = transactionsRealtime.success;
  
  if (transactionsRealtime.success) {
    console.log('  ✅ Transactions subscription connected');
  } else {
    console.log(`  ❌ Transactions subscription failed: ${transactionsRealtime.error}`);
  }
  
  // Summary
  console.log('\n📊 Realtime Verification Summary');
  console.log('================================\n');
  
  console.log('⚠️  Complete verification requires SQL queries:');
  console.log('   1. Check publication exists');
  console.log('   2. Check tables in publication');
  console.log('   3. Verify table-level Realtime settings\n');
  
  console.log('✅ Subscription connectivity test results:');
  console.log(`   Holdings: ${holdingsRealtime.success ? '✅ Connected' : '❌ Failed'}`);
  console.log(`   Transactions: ${transactionsRealtime.success ? '✅ Connected' : '❌ Failed'}\n`);
  
  if (!holdingsRealtime.success || !transactionsRealtime.success) {
    console.log('❌ Realtime subscriptions are not working');
    console.log('\nRecommended actions:');
    console.log('   1. Run SQL queries in Supabase SQL Editor (see REALTIME_VERIFICATION_REPORT.md)');
    console.log('   2. Verify tables are in supabase_realtime publication');
    console.log('   3. Enable Realtime in Supabase Dashboard → Database → Replication');
    console.log('   4. Check RLS policies allow subscriptions');
  } else {
    console.log('✅ Realtime subscriptions are working');
    console.log('   Note: Still verify publication status with SQL queries');
  }
  
  console.log('\n');
}

main().catch(console.error);

