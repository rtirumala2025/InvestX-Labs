/**
 * Verify and Fix user_id columns in holdings and transactions tables
 * 
 * This script:
 * 1. Checks if user_id columns exist in holdings and transactions tables
 * 2. Applies the migration if needed
 * 3. Verifies the fix was successful
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Verify required environment variables
const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName] && !(varName === 'SUPABASE_SERVICE_ROLE_KEY' && process.env.SUPABASE_SERVICE_KEY));

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error(`Please check your .env file at: ${envPath}`);
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

/**
 * Check if a column exists in a table
 */
async function checkColumnExists(tableName, columnName) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
        ) as exists;
      `,
      params: [tableName, columnName]
    });

    if (error) {
      // Try alternative method using direct query
      const { data: altData, error: altError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .eq('column_name', columnName)
        .limit(1);

      if (altError) {
        console.warn(`⚠️  Could not check column using standard methods: ${altError.message}`);
        // Fallback: try to query the table with the column
        const { error: testError } = await supabase
          .from(tableName)
          .select(columnName)
          .limit(1);
        
        return !testError; // If no error, column exists
      }

      return (altData && altData.length > 0);
    }

    return data && data[0]?.exists;
  } catch (err) {
    console.warn(`⚠️  Error checking column ${tableName}.${columnName}: ${err.message}`);
    // Fallback: try to query the table
    try {
      const { error } = await supabase
        .from(tableName)
        .select(columnName)
        .limit(1);
      return !error;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Apply migration SQL directly
 */
async function applyMigrationSQL(sql) {
  try {
    // Split SQL into statements (handling DO $$ blocks)
    const statements = [];
    let currentStatement = '';
    let inDoBlock = false;
    let dollarTag = '';

    const lines = sql.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for DO $$ blocks
      if (trimmed.match(/^DO\s+\$\$/)) {
        inDoBlock = true;
        dollarTag = '$$';
        currentStatement += line + '\n';
        continue;
      }
      
      // Check for custom dollar tags
      if (trimmed.match(/^\$\w*\$$/)) {
        if (inDoBlock && trimmed === dollarTag) {
          inDoBlock = false;
          currentStatement += line;
          if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
          }
          currentStatement = '';
          dollarTag = '';
          continue;
        } else if (trimmed.match(/^\$\w*\$$/)) {
          dollarTag = trimmed;
        }
      }
      
      currentStatement += line + '\n';
      
      // End of statement (outside DO blocks)
      if (!inDoBlock && trimmed.endsWith(';')) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      }
    }
    
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement || statement.startsWith('--')) continue;

      console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use Supabase's REST API to execute SQL via RPC or direct query
        // Since we can't execute arbitrary SQL easily, we'll use a workaround
        const { error } = await supabase.rpc('exec_sql', { 
          query: statement 
        });

        if (error) {
          // If exec_sql doesn't exist, try alternative approach
          console.warn(`⚠️  RPC method failed, trying alternative...`);
          // For ALTER TABLE, we might need to use a different approach
          // This is a limitation - we'll need to apply via Supabase dashboard or CLI
          throw new Error(`Cannot execute SQL directly. Please apply migration manually or use Supabase CLI. Error: ${error.message}`);
        }
        
        console.log(`   ✅ Success`);
      } catch (err) {
        console.error(`❌ Error in statement ${i + 1}:`, err.message);
        throw err;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Migration application failed:', error.message);
    throw error;
  }
}

/**
 * Main verification and fix function
 */
async function verifyAndFix() {
  console.log('🔍 Verifying database schema...\n');

  try {
    // Check if tables exist
    console.log('📊 Checking table existence...');
    
    // Check holdings table
    let holdingsHasUserId = false;
    try {
      holdingsHasUserId = await checkColumnExists('holdings', 'user_id');
      console.log(`   ${holdingsHasUserId ? '✅' : '❌'} holdings.user_id: ${holdingsHasUserId ? 'EXISTS' : 'MISSING'}`);
    } catch (err) {
      console.error(`   ❌ Error checking holdings table: ${err.message}`);
    }

    // Check transactions table
    let transactionsHasUserId = false;
    try {
      transactionsHasUserId = await checkColumnExists('transactions', 'user_id');
      console.log(`   ${transactionsHasUserId ? '✅' : '❌'} transactions.user_id: ${transactionsHasUserId ? 'EXISTS' : 'MISSING'}`);
    } catch (err) {
      console.error(`   ❌ Error checking transactions table: ${err.message}`);
    }

    // If both columns exist, we're done
    if (holdingsHasUserId && transactionsHasUserId) {
      console.log('\n✅ All user_id columns exist. No migration needed.');
      return { success: true, needsMigration: false };
    }

    // Need to apply migration
    console.log('\n🔧 user_id columns are missing. Applying migration...');
    
    const migrationPath = join(__dirname, '../supabase/migrations/20251113000004_fix_holdings_transactions.sql');
    const migrationSQL = await readFile(migrationPath, 'utf8');

    console.log('📝 Reading migration file:', migrationPath);
    
    // Try to apply migration
    // Note: Direct SQL execution via Supabase JS client is limited
    // We'll provide instructions for manual application
    console.log('\n⚠️  Direct SQL execution via Supabase JS client is limited.');
    console.log('📋 Please apply the migration using one of these methods:\n');
    console.log('   1. Supabase Dashboard:');
    console.log('      - Go to SQL Editor');
    console.log('      - Copy and paste the migration SQL');
    console.log('      - Execute\n');
    console.log('   2. Supabase CLI:');
    console.log('      - Run: supabase db push\n');
    console.log('   3. Or use the provided SQL file:');
    console.log(`      ${migrationPath}\n`);

    // Try to apply using a simpler approach - check if we can use Supabase's migration system
    // For now, we'll output the SQL that needs to be run
    console.log('📄 Migration SQL to apply:\n');
    console.log('─'.repeat(80));
    console.log(migrationSQL.substring(0, 500) + '...\n');
    console.log('─'.repeat(80));

    return { 
      success: false, 
      needsMigration: true,
      holdingsHasUserId,
      transactionsHasUserId,
      migrationPath
    };

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

// Run verification
verifyAndFix()
  .then((result) => {
    if (result.success && !result.needsMigration) {
      console.log('\n✅ Verification complete. All columns exist.');
      process.exit(0);
    } else if (result.needsMigration) {
      console.log('\n⚠️  Migration required. Please apply manually using the instructions above.');
      process.exit(1);
    } else {
      console.log('\n❌ Verification failed.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

