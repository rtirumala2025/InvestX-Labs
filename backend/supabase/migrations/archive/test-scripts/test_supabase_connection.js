#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oysuothaldgentevxzod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95c3VvdGhhbGRnZW50ZXZ4em9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0NzQ4MDAsImV4cCI6MjA0ODA1MDgwMH0.YourAnonKeyHere';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', SUPABASE_URL);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      console.log('This is expected - we need the service key for migrations');
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

async function testRPCFunctions() {
  console.log('\n🧪 Testing RPC functions...');
  
  const functions = [
    'get_quote',
    'get_user_context', 
    'get_ai_recommendations',
    'get_recommendations',
    'get_market_news',
    'get_ai_health'
  ];
  
  for (const func of functions) {
    try {
      console.log(`Testing ${func}...`);
      const { data, error } = await supabase.rpc(func, {});
      
      if (error) {
        console.log(`❌ ${func}: ${error.message}`);
      } else {
        console.log(`✅ ${func}: Working`);
      }
    } catch (err) {
      console.log(`❌ ${func}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🎯 InvestX Labs - Supabase Connection Test');
  console.log('==========================================');
  
  await testConnection();
  await testRPCFunctions();
  
  console.log('\n📋 Next Steps:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project: oysuothaldgentevxzod');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste the contents of COMPLETE_SUPABASE_MIGRATION.sql');
  console.log('5. Click Run');
}

main();
