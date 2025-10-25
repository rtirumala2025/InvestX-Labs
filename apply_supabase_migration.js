#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oysuothaldgentevxzod.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY not found in backend/.env');
  console.log('Please add your Supabase service key to backend/.env:');
  console.log('SUPABASE_SERVICE_KEY=your_service_key_here');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  try {
    console.log('🚀 Starting Supabase migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'backend/supabase/migrations/20240101000001_fix_rpc_functions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('🔧 Applying migration to Supabase...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      console.log('\n📋 Manual Application Required:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Copy and paste the contents of:');
      console.log('   backend/supabase/migrations/20240101000001_fix_rpc_functions.sql');
      console.log('5. Click Run');
      return;
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('🎉 All RPC functions have been created');
    console.log('🔄 Please refresh your browser at http://localhost:3002');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    console.log('\n📋 Manual Application Required:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the contents of:');
    console.log('   backend/supabase/migrations/20240101000001_fix_rpc_functions.sql');
    console.log('5. Click Run');
  }
}

// Test connection first
async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🎯 InvestX Labs - Supabase Migration Tool');
  console.log('==========================================');
  
  const connected = await testConnection();
  if (connected) {
    await applyMigration();
  } else {
    console.log('\n📋 Manual Application Required:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the contents of:');
    console.log('   backend/supabase/migrations/20240101000001_fix_rpc_functions.sql');
    console.log('5. Click Run');
  }
}

main();
