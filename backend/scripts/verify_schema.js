/**
 * Schema Verification Script
 * 
 * This script verifies that all required columns exist in holdings and transactions tables.
 * Run this after applying migrations to confirm the schema is correct.
 * 
 * Usage:
 *   node backend/scripts/verify_schema.js
 * 
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('\nPlease set these in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Expected columns for each table
const EXPECTED_COLUMNS = {
  transactions: [
    'id',
    'user_id',
    'portfolio_id',
    'transaction_date',
    'transaction_type',
    'symbol',
    'shares',
    'price',
    'total_amount',
    'fees',
    'notes',
    'metadata',
    'created_at',
    'updated_at'
  ],
  holdings: [
    'id',
    'user_id',
    'portfolio_id',
    'symbol',
    'company_name',
    'shares',
    'purchase_price',
    'purchase_date',
    'current_price',
    'sector',
    'asset_type',
    'created_at',
    'updated_at'
  ]
};

async function verifyTableSchema(tableName) {
  console.log(`\n📋 Verifying ${tableName} table schema...`);
  
  try {
    // Query information_schema to get column details
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        ORDER BY column_name;
      `
    });

    if (error) {
      // Fallback: Try direct query using Supabase client
      // Note: This is a workaround - Supabase doesn't expose information_schema directly
      console.log(`⚠️  Cannot directly query information_schema via Supabase client`);
      console.log(`   Please run this query in Supabase SQL Editor:`);
      console.log(`\n   SELECT column_name, data_type, is_nullable`);
      console.log(`   FROM information_schema.columns`);
      console.log(`   WHERE table_schema = 'public' AND table_name = '${tableName}'`);
      console.log(`   ORDER BY column_name;\n`);
      return { exists: true, columns: [], error: 'Cannot query schema directly' };
    }

    const columns = data || [];
    const columnNames = columns.map(col => col.column_name);
    const expected = EXPECTED_COLUMNS[tableName] || [];
    
    const missing = expected.filter(col => !columnNames.includes(col));
    const extra = columnNames.filter(col => !expected.includes(col));
    
    console.log(`   ✅ Found ${columns.length} columns`);
    
    if (missing.length > 0) {
      console.log(`   ❌ Missing columns: ${missing.join(', ')}`);
    } else {
      console.log(`   ✅ All expected columns present`);
    }
    
    if (extra.length > 0) {
      console.log(`   ℹ️  Extra columns (not required): ${extra.join(', ')}`);
    }
    
    return {
      exists: true,
      columns: columnNames,
      missing,
      extra,
      allPresent: missing.length === 0
    };
    
  } catch (err) {
    console.error(`   ❌ Error verifying ${tableName}:`, err.message);
    return { exists: false, error: err.message };
  }
}

async function verifyForeignKeys() {
  console.log(`\n🔗 Verifying foreign key constraints...`);
  
  const constraints = [
    { table: 'holdings', column: 'user_id', references: 'auth.users(id)' },
    { table: 'holdings', column: 'portfolio_id', references: 'public.portfolios(id)' },
    { table: 'transactions', column: 'user_id', references: 'auth.users(id)' },
    { table: 'transactions', column: 'portfolio_id', references: 'public.portfolios(id)' }
  ];
  
  console.log(`   ℹ️  Foreign key verification requires direct SQL access.`);
  console.log(`   Please run this query in Supabase SQL Editor:\n`);
  console.log(`   SELECT`);
  console.log(`     tc.table_name,`);
  console.log(`     kcu.column_name,`);
  console.log(`     ccu.table_name AS foreign_table_name,`);
  console.log(`     ccu.column_name AS foreign_column_name`);
  console.log(`   FROM information_schema.table_constraints AS tc`);
  console.log(`   JOIN information_schema.key_column_usage AS kcu`);
  console.log(`     ON tc.constraint_name = kcu.constraint_name`);
  console.log(`   JOIN information_schema.constraint_column_usage AS ccu`);
  console.log(`     ON ccu.constraint_name = tc.constraint_name`);
  console.log(`   WHERE tc.constraint_type = 'FOREIGN KEY'`);
  console.log(`     AND tc.table_schema = 'public'`);
  console.log(`     AND tc.table_name IN ('holdings', 'transactions');\n`);
}

async function verifyIndexes() {
  console.log(`\n📊 Verifying indexes...`);
  
  console.log(`   ℹ️  Index verification requires direct SQL access.`);
  console.log(`   Please run this query in Supabase SQL Editor:\n`);
  console.log(`   SELECT`);
  console.log(`     tablename,`);
  console.log(`     indexname,`);
  console.log(`     indexdef`);
  console.log(`   FROM pg_indexes`);
  console.log(`   WHERE schemaname = 'public'`);
  console.log(`     AND tablename IN ('holdings', 'transactions');\n`);
}

async function verifyRLS() {
  console.log(`\n🔒 Verifying Row Level Security (RLS)...`);
  
  console.log(`   ℹ️  RLS verification requires direct SQL access.`);
  console.log(`   Please run this query in Supabase SQL Editor:\n`);
  console.log(`   SELECT`);
  console.log(`     tablename,`);
  console.log(`     rowsecurity`);
  console.log(`   FROM pg_tables`);
  console.log(`   WHERE schemaname = 'public'`);
  console.log(`     AND tablename IN ('holdings', 'transactions');\n`);
}

async function main() {
  console.log('🔍 InvestX Labs - Schema Verification');
  console.log('=====================================\n');
  
  const transactionsResult = await verifyTableSchema('transactions');
  const holdingsResult = await verifyTableSchema('holdings');
  
  await verifyForeignKeys();
  await verifyIndexes();
  await verifyRLS();
  
  console.log('\n📊 Summary');
  console.log('==========\n');
  
  const allGood = 
    transactionsResult.allPresent && 
    holdingsResult.allPresent;
  
  if (allGood) {
    console.log('✅ All required columns are present in both tables!');
    console.log('\n✅ Schema verification PASSED');
    console.log('\n⚠️  Note: Foreign keys, indexes, and RLS must be verified manually');
    console.log('   using the SQL queries provided above.');
  } else {
    console.log('❌ Some required columns are missing!');
    console.log('\n❌ Schema verification FAILED');
    console.log('\nPlease apply the migration:');
    console.log('   backend/supabase/migrations/20251117000001_fix_transactions_columns.sql');
  }
  
  console.log('\n');
}

main().catch(console.error);

