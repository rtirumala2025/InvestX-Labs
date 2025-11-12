'use strict';

import fs from 'fs';
import path from 'path';
import process from 'process';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');

const ENV_LOCATIONS = [
  path.join(backendRoot, '.env'),
  path.join(backendRoot, '.env.local'),
  path.join(repoRoot, '.env'),
  path.join(repoRoot, '.env.local')
];

const loadEnv = () => {
  const envPath = ENV_LOCATIONS.find((candidate) => fs.existsSync(candidate));
  if (!envPath) {
    throw new Error('No environment file (.env or .env.local) found for seeding.');
  }
  dotenv.config({ path: envPath });
  return envPath;
};

const requiredTables = [
  'user_profiles',
  'chat_sessions',
  'chat_messages',
  'analytics_events',
  'conversations',
  'portfolios',
  'holdings',
  'transactions',
  'user_achievements',
  'leaderboard_scores',
  'spending_analysis',
  'allowed_symbols',
  'market_data_cache',
  'api_configurations',
  'knowledge_base_embeddings',
  'ai_suggestions_log',
  'ai_request_log'
];

const optionalTables = ['clubs', 'club_members'];

const stableUuid = (seed) => {
  const hash = createHash('sha256').update(seed).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
};

const checkTableExists = async (supabase, table) => {
  const { error } = await supabase.from(table).select('*', { head: true, count: 'exact' });
  if (!error) return true;
  if (['PGRST201', '42P01'].includes(error.code) || /does not exist|relation/.test(error.message)) {
    return false;
  }
  throw new Error(`Unexpected error while checking table ${table}: ${error.message}`);
};

const verifyRequiredTables = async (supabase) => {
  const missing = [];
  for (const table of requiredTables) {
    const exists = await checkTableExists(supabase, table);
    if (!exists) missing.push(table);
  }
  if (missing.length) {
    throw new Error(`Missing required tables: ${missing.join(', ')}. Please run Supabase migrations before seeding.`);
  }
};

const ensureUsers = async (adminClient) => {
  const baseline = [
    {
      email: 'alice@investxlabs.com',
      password: 'InvestX!Alice1',
      full_name: 'Alice Thompson',
      username: 'alice',
      role: 'investor',
      avatar_url: 'https://i.pravatar.cc/150?img=1'
    },
    {
      email: 'bob@investxlabs.com',
      password: 'InvestX!Bob2',
      full_name: 'Bob Hernandez',
      username: 'bhernandez',
      role: 'analyst',
      avatar_url: 'https://i.pravatar.cc/150?img=2'
    },
    {
      email: 'carol@investxlabs.com',
      password: 'InvestX!Carol3',
      full_name: 'Carol Singh',
      username: 'carol',
      role: 'advisor',
      avatar_url: 'https://i.pravatar.cc/150?img=3'
    }
  ];

  const existingLookup = new Map();
  const existingResp = await adminClient.listUsers({ page: 1, perPage: 1000 });
  if (existingResp.error) {
    throw existingResp.error;
  }
  for (const user of existingResp.data?.users ?? []) {
    if (user.email) {
      existingLookup.set(user.email.toLowerCase(), user);
    }
  }

  const seeded = [];

  for (const template of baseline) {
    const match = existingLookup.get(template.email.toLowerCase());
    if (match) {
      seeded.push({ ...template, id: match.id });
      continue;
    }

    const created = await adminClient.createUser({
      email: template.email,
      password: template.password,
      email_confirm: true,
      user_metadata: {
        full_name: template.full_name,
        username: template.username,
        role: template.role,
        avatar_url: template.avatar_url
      }
    });

    if (created.error) {
      throw created.error;
    }

    const newUser = created.data.user;
    if (!newUser) {
      throw new Error(`Failed to create user ${template.email}`);
    }

    existingLookup.set(template.email.toLowerCase(), newUser);
    seeded.push({ ...template, id: newUser.id });
  }

  return seeded;
};

const upsertRows = async (supabase, table, rows, options) => {
  if (!rows.length) return;
  const { error } = options !== undefined
    ? await supabase.from(table).upsert(rows, options)
    : await supabase.from(table).upsert(rows);
  if (error) {
    if (
      error.code === 'PGRST201' ||
      error.code === 'PGRST205' ||
      /Could not find the table/.test(error.message) ||
      /relation\s+\"?\w+\"?\s+does not exist/i.test(error.message)
    ) {
      console.warn(`⚠️  Skipping table ${table}: ${error.message}`);
      return { skipped: true };
    }
    throw new Error(`Failed to upsert into ${table}: ${error.message}`);
  }
  return { skipped: false };
};

const insertRows = async (supabase, table, rows, options = {}) => {
  if (!rows.length) return;
  const { error } = await supabase.from(table).insert(rows, options);
  if (error) {
    throw new Error(`Failed to insert into ${table}: ${error.message}`);
  }
};

const seedDomainData = async (supabase, users) => {
  const now = new Date().toISOString();

  await upsertRows(
    supabase,
    'user_profiles',
    users.map((user) => ({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url
    })),
    { onConflict: 'id' }
  );

  const portfolioRows = users.map((user) => ({
    id: stableUuid(`${user.id}:portfolio:main`),
    user_id: user.id,
    name: `${user.full_name.split(' ')[0]}'s Main Portfolio`
  }));

  await upsertRows(supabase, 'portfolios', portfolioRows, { onConflict: 'id' });

  const holdingsRows = portfolioRows.flatMap((portfolio) => {
    const symbols = ['AAPL', 'MSFT', 'VOO'];
    const quantities = [120, 80, 42];
    return symbols.map((symbol, idx) => ({
      id: stableUuid(`${portfolio.id}:holding:${idx}`),
      portfolio_id: portfolio.id,
      symbol,
      quantity: quantities[idx]
    }));
  });

  await upsertRows(supabase, 'holdings', holdingsRows, { onConflict: 'id' });

  const transactionRows = portfolioRows.map((portfolio, idx) => ({
    id: stableUuid(`${portfolio.id}:txn:seed-${idx}`),
    symbol: ['AAPL', 'MSFT', 'VOO'][idx % 3],
    type: idx % 2 === 0 ? 'buy' : 'deposit',
    quantity: idx % 2 === 0 ? 10 : 0,
    price: idx % 2 === 0 ? 150.5 : 0
  }));

  await upsertRows(supabase, 'transactions', transactionRows, { onConflict: 'id' });

  const achievementsRows = users.flatMap((user) => [
    {
      id: stableUuid(`${user.id}:achievement:getting-started`),
      user_id: user.id,
      badge_id: 'getting_started',
      badge_name: 'Getting Started'
    },
    {
      id: stableUuid(`${user.id}:achievement:diversifier`),
      user_id: user.id,
      badge_id: 'diversifier',
      badge_name: 'Diversifier'
    }
  ]);

  await upsertRows(supabase, 'user_achievements', achievementsRows, { onConflict: 'id' });

  await upsertRows(
    supabase,
    'leaderboard_scores',
    users.map((user, index) => ({
      id: stableUuid(`${user.id}:leaderboard`),
      score: [875, 980, 915][index]
    }))
  );

  await upsertRows(
    supabase,
    'spending_analysis',
    users.map((user, idx) => ({
      id: stableUuid(`${user.id}:spending:seed-${idx}`)
    }))
  );

  const chatSessionRows = users.map((user) => ({
    id: stableUuid(`${user.id}:chat-session`),
    user_id: user.id,
    title: 'Quarterly Strategy Review'
  }));

  await upsertRows(supabase, 'chat_sessions', chatSessionRows, { onConflict: 'id' });

  const chatMessageRows = chatSessionRows.flatMap((session, idx) => [
    {
      id: stableUuid(`${session.id}:m1`),
      session_id: session.id,
      role: 'user',
      content: 'Summarize my top holdings risk exposure.'
    },
    {
      id: stableUuid(`${session.id}:m2`),
      session_id: session.id,
      role: 'assistant',
      content: 'Your top holdings lean 65% toward technology. Consider adding healthcare for balance.'
    },
    {
      id: stableUuid(`${session.id}:m3`),
      session_id: session.id,
      role: 'user',
      content: 'Suggest a healthcare ETF that matches my risk profile.'
    },
    {
      id: stableUuid(`${session.id}:m4`),
      session_id: session.id,
      role: 'assistant',
      content: 'XLV offers diversified healthcare exposure with a low expense ratio.'
    }
  ]);

  await upsertRows(supabase, 'chat_messages', chatMessageRows, { onConflict: 'id' });

  const conversationRows = users.map((user) => ({
    id: stableUuid(`${user.id}:conversation`),
    user_id: user.id,
    messages: [
      { role: 'user', content: 'How is my portfolio performing this quarter?' },
      { role: 'assistant', content: 'Your portfolio is up 4.2% quarter-to-date, outperforming the S&P 500 by 1.1%.' }
    ]
  }));

  await upsertRows(supabase, 'conversations', conversationRows, { onConflict: 'id' });

  const analyticsRows = users.map((user) => ({
    id: stableUuid(`${user.id}:analytics:event`),
    user_id: user.id,
    event_type: 'portfolio_view',
    event_data: { section: 'dashboard', holdingsCount: 3 }
  }));

  await upsertRows(supabase, 'analytics_events', analyticsRows, { onConflict: 'id' });

  await upsertRows(
    supabase,
    'api_configurations',
    [
      {
        id: stableUuid('api:alpha_vantage'),
        service_name: 'alpha_vantage',
        api_key: 'demo-alpha-vantage-key'
      }
    ],
    { onConflict: 'service_name' }
  );

  const zeroEmbedding = Array(8).fill(0);
  await upsertRows(
    supabase,
    'knowledge_base_embeddings',
    [
      {
        id: stableUuid('kb:diversification'),
        strategy_id: stableUuid('strategy:core'),
        ticker: 'VOO',
        title: 'Diversification Best Practices',
        embedding: zeroEmbedding,
        metadata: { category: 'education', tags: ['diversification', 'risk-management'] }
      }
    ]
  );

  await upsertRows(
    supabase,
    'ai_suggestions_log',
    [
      {
        id: stableUuid('aisuggestion:carol'),
        suggestion_id: stableUuid('aisuggestion:carol:item'),
        strategy_id: stableUuid('strategy:core'),
        user_id: users.find((user) => user.role === 'advisor')?.id ?? users[0].id,
        confidence: 0.82
      }
    ]
  );

  await upsertRows(
    supabase,
    'ai_request_log',
    [
      {
        id: stableUuid('airequest:bob'),
        user_id: users.find((user) => user.role === 'analyst')?.id ?? users[0].id,
        input_profile: { risk: 'moderate' },
        generated_suggestions: [{ ticker: 'VOO', rationale: 'Broad market exposure' }]
      }
    ]
  );

  if (await checkTableExists(supabase, 'clubs') && await checkTableExists(supabase, 'club_members')) {
    const clubId = stableUuid('clubs:investx-growth');
    await upsertRows(
      supabase,
      'clubs',
      [
        {
          id: clubId,
          owner_id: users[0].id,
          name: 'InvestX Growth Club'
        }
      ],
      { onConflict: 'id' }
    );

    await upsertRows(
      supabase,
      'club_members',
      users.map((user) => ({
        club_id: clubId,
        user_id: user.id,
        role: user.role === 'advisor' ? 'moderator' : 'member'
      })),
      { onConflict: 'club_id,user_id' }
    );
  }
};

const fetchCounts = async (supabase) => {
  const targets = [
    { label: 'auth.users', fn: async () => {
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) throw error;
      return data?.total ?? data?.users?.length ?? 0;
    } },
    { label: 'public.user_profiles', table: 'user_profiles' },
    { label: 'public.portfolios', table: 'portfolios' },
    { label: 'public.holdings', table: 'holdings' },
    { label: 'public.transactions', table: 'transactions' },
    { label: 'public.chat_sessions', table: 'chat_sessions' },
    { label: 'public.chat_messages', table: 'chat_messages' },
    { label: 'public.analytics_events', table: 'analytics_events' },
    { label: 'public.conversations', table: 'conversations' },
    { label: 'public.user_achievements', table: 'user_achievements' },
    { label: 'public.leaderboard_scores', table: 'leaderboard_scores' },
    { label: 'public.spending_analysis', table: 'spending_analysis' },
    { label: 'public.allowed_symbols', table: 'allowed_symbols' },
    { label: 'public.market_data_cache', table: 'market_data_cache' },
    { label: 'public.api_configurations', table: 'api_configurations' },
    { label: 'public.knowledge_base_embeddings', table: 'knowledge_base_embeddings' },
    { label: 'public.ai_suggestions_log', table: 'ai_suggestions_log' },
    { label: 'public.ai_request_log', table: 'ai_request_log' },
    { label: 'public.clubs', table: 'clubs', optional: true },
    { label: 'public.club_members', table: 'club_members', optional: true }
  ];

  const results = [];

  for (const target of targets) {
    if (target.fn) {
      const count = await target.fn();
      results.push({ table: target.label, count });
      continue;
    }

    if (target.optional) {
      const exists = await checkTableExists(supabase, target.table);
      if (!exists) continue;
    }

    const { count, error } = await supabase
      .from(target.table)
      .select('*', { head: true, count: 'exact' });

    if (error) {
      if (target.optional && error.message.includes('relation')) {
        continue;
      }
      throw new Error(`Failed to count rows for ${target.table}: ${error.message}`);
    }

    results.push({ table: target.label, count: count ?? 0 });
  }

  return results;
};

const main = async () => {
  try {
    const envPath = loadEnv();
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) must be configured.');
    }

    console.log(`🔐 Loaded environment from ${envPath}`);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    console.log('🔎 Verifying Supabase schema...');
    await verifyRequiredTables(supabase);

    console.log('👤 Ensuring baseline users...');
    const seededUsers = await ensureUsers(supabase.auth.admin);

    console.log('🌱 Seeding domain data...');
    await seedDomainData(supabase, seededUsers);

    console.log('📊 Collecting row counts...');
    const counts = await fetchCounts(supabase);

    console.log('\n✅ Seeding complete. Table counts:');
    for (const entry of counts) {
      console.log(` - ${entry.table}: ${entry.count}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
};

main();