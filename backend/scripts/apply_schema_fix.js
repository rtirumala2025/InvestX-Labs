#!/usr/bin/env node

/**
 * Apply Schema Fix Migration
 * 
 * This script attempts to apply the schema fix migration to Supabase.
 * Since Supabase doesn't allow direct SQL execution via the JS client,
 * this script will guide you through the process or attempt to use
 * alternative methods.
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Check for service key
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)');
  console.error(`   Check: ${envPath}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function checkCurrentState() {
  console.log('🔍 Checking current database state...\n');
  
  // Check portfolios table
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('id, is_simulation')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('column') && error.message.includes('is_simulation')) {
        console.log('❌ Portfolios table missing is_simulation column');
        return { needsFix: true, issue: 'is_simulation column missing' };
      } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('⚠️  Portfolios table does not exist (will be created)');
      } else {
        console.log('⚠️  Could not check portfolios:', error.message);
      }
    } else {
      console.log('✅ Portfolios table exists and has is_simulation column');
    }
  } catch (err) {
    console.log('⚠️  Error checking portfolios:', err.message);
  }

  // Check achievements table
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        console.log('❌ Achievements table does not exist');
        return { needsFix: true, issue: 'achievements table missing' };
      } else {
        console.log('⚠️  Could not check achievements:', error.message);
      }
    } else {
      console.log('✅ Achievements table exists');
    }
  } catch (err) {
    console.log('❌ Achievements table does not exist');
    return { needsFix: true, issue: 'achievements table missing' };
  }

  return { needsFix: false };
}

async function applyMigrationViaRPC() {
  console.log('\n🚀 Attempting to apply migration via Supabase...\n');
  
  const migrationPath = join(__dirname, '../supabase/migrations/20251113000000_fix_schema_issues.sql');
  const migrationSQL = await readFile(migrationPath, 'utf8');

  // Try to execute via RPC if available
  // Note: This typically won't work as Supabase doesn't expose raw SQL execution
  // But we'll try common patterns
  
  try {
    // Split into statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Try using exec RPC (if it exists)
    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue; // Skip very short statements
      
      try {
        // Try exec RPC
        const { error } = await supabase.rpc('exec', { sql: statement + ';' });
        if (!error) {
          successCount++;
          continue;
        }
        
        // Try pg_cmd RPC
        const { error: pgError } = await supabase.rpc('pg_cmd', { cmd: statement + ';' });
        if (!pgError) {
          successCount++;
          continue;
        }
        
        console.log(`⚠️  Could not execute statement ${i + 1} via RPC`);
      } catch (err) {
        // RPC functions likely don't exist, which is normal
        break;
      }
    }

    if (successCount > 0) {
      console.log(`✅ Successfully executed ${successCount} statements`);
      return true;
    }
  } catch (err) {
    // Expected - RPC functions typically don't exist
  }

  return false;
}

async function main() {
  console.log('🔧 Schema Fix Migration Tool\n');
  console.log('This tool will help you apply the database schema fixes.\n');

  // Check current state
  const state = await checkCurrentState();
  
  if (!state.needsFix) {
    console.log('\n✅ Database schema appears to be correct!');
    console.log('   No migration needed.');
    rl.close();
    return;
  }

  console.log(`\n❌ Issue detected: ${state.issue}`);
  console.log('   Migration needs to be applied.\n');

  // Try to apply via RPC (unlikely to work, but worth trying)
  const rpcSuccess = await applyMigrationViaRPC();
  
  if (!rpcSuccess) {
    console.log('\n⚠️  Cannot apply migration automatically via Supabase client.');
    console.log('   Supabase requires migrations to be run through the Dashboard or CLI.\n');
    
    console.log('📋 INSTRUCTIONS:\n');
    console.log('Method 1: Supabase Dashboard (Easiest - Recommended)\n');
    console.log('  1. Open your Supabase project: https://app.supabase.com/');
    console.log('  2. Go to "SQL Editor" in the left sidebar');
    console.log('  3. Click "New query"');
    console.log('  4. Copy the contents of this file:');
    console.log(`     ${join(__dirname, '../supabase/migrations/20251113000000_fix_schema_issues.sql')}`);
    console.log('  5. Paste into the SQL Editor');
    console.log('  6. Click "Run" (or press Cmd/Ctrl + Enter)');
    console.log('  7. Wait for "Success" message\n');
    
    console.log('Method 2: Supabase CLI\n');
    console.log('  If you have Supabase CLI installed:');
    console.log('  cd backend');
    console.log('  supabase link --project-ref your-project-ref');
    console.log('  supabase db push\n');

    const answer = await question('Would you like me to open the migration file for you to copy? (y/n): ');
    if (answer.toLowerCase() === 'y') {
      const migrationPath = join(__dirname, '../supabase/migrations/20251113000000_fix_schema_issues.sql');
      const migrationSQL = await readFile(migrationPath, 'utf8');
      console.log('\n📄 Migration SQL:\n');
      console.log('─'.repeat(80));
      console.log(migrationSQL);
      console.log('─'.repeat(80));
      console.log('\n✅ Copy the SQL above and paste it into Supabase SQL Editor\n');
    }
  } else {
    console.log('\n✅ Migration applied successfully!');
    console.log('   Please refresh your application to see the changes.\n');
  }

  rl.close();
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  rl.close();
  process.exit(1);
});

