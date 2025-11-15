#!/usr/bin/env node
/**
 * Apply Supabase SQL migrations and verify critical schema objects.
 *
 * Usage: node backend/scripts/apply_and_verify_supabase.js
 */

import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const envFiles = ['.env.local', '.env'];
const envPath = envFiles
  .map((candidate) => path.join(projectRoot, candidate))
  .find((candidatePath) => fs.existsSync(candidatePath));

if (!envPath) {
  console.error('❌ No .env or .env.local file found in the project root.');
  console.error('Please create one with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials.');
  console.error('Please ensure the environment file contains:');
  console.error('SUPABASE_URL=<your-supabase-project-url>');
  console.error('SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
  process.exit(1);
}

const deriveDbConfig = () => {
  try {
    const parsed = new URL(SUPABASE_URL);
    const projectRef = parsed.hostname.split('.')[0];
    if (!projectRef) {
      throw new Error('Unable to parse Supabase project reference from URL.');
    }

    return {
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      user: 'postgres',
      password: SUPABASE_SERVICE_ROLE_KEY,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    };
  } catch (error) {
    console.error('❌ Failed to derive database configuration from SUPABASE_URL.');
    console.error(error.message);
    process.exit(1);
  }
};

const dbConfig = deriveDbConfig();

const migrationsDir = path.join(projectRoot, 'backend', 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.error(`❌ Migrations directory not found: ${migrationsDir}`);
  process.exit(1);
}

const sqlFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

if (!sqlFiles.length) {
  console.error('❌ No SQL migration files found.');
  process.exit(1);
}

const client = new Client(dbConfig);

const runMigrations = async () => {
  for (const fileName of sqlFiles) {
    const filePath = path.join(migrationsDir, fileName);
    const sql = fs.readFileSync(filePath, 'utf8');

    process.stdout.write(`[RUNNING] Applying migration ${fileName}\n`);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      process.stdout.write(`[SUCCESS] ${fileName}\n`);
    } catch (error) {
      await client.query('ROLLBACK');
      process.stdout.write(`[ERROR] ${fileName} -> ${error.message}\n`);
      throw new Error(`Migration failed: ${fileName}`);
    }
  }
};

const verifySchema = async () => {
  const requiredTables = [
    'user_profiles',
    'user_diagnostics',
    'knowledge_base_embeddings',
    'ai_suggestions_log'
  ];

  const requiredFunctions = [
    'get_ai_logs_for_user',
    'update_confidence_score',
    'search_knowledge_base'
  ];

  const tableResults = [];
  for (const tableName of requiredTables) {
    const { rows } = await client.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = $1
        ) AS exists;
      `,
      [tableName]
    );
    tableResults.push({ name: tableName, exists: rows[0]?.exists });
  }

  const functionResults = [];
  for (const functionName of requiredFunctions) {
    const { rows } = await client.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM pg_proc
          WHERE proname = $1
        ) AS exists;
      `,
      [functionName]
    );
    functionResults.push({ name: functionName, exists: rows[0]?.exists });
  }

  const summaryRows = [
    ...tableResults.map((item) => ({
      type: 'Table',
      name: item.name,
      status: item.exists ? '✅ exists' : '❌ missing'
    })),
    ...functionResults.map((item) => ({
      type: 'Function',
      name: item.name,
      status: item.exists ? '✅ exists' : '❌ missing'
    }))
  ];

  console.log('\nVerification Summary');
  console.log('--------------------');
  for (const row of summaryRows) {
    console.log(`${row.type.padEnd(8)} ${row.name.padEnd(32)} ${row.status}`);
  }

  const missingItems = summaryRows.filter((row) => row.status.startsWith('❌'));
  if (missingItems.length) {
    console.error('\n❌ Verification failed. Missing objects:');
    missingItems.forEach((row) => console.error(` - ${row.type}: ${row.name}`));
    process.exit(1);
  }
};

const main = async () => {
  try {
    await client.connect();
    await runMigrations();
    await verifySchema();
    console.log('\n✅ Supabase backend fully configured.');
    console.log('You can now run `npm run dev` safely.');
  } catch (error) {
    console.error('\n❌ Supabase backend setup failed.');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

main();

