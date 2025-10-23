import { createClient } from '@supabase/supabase-js';
import https from 'https';
import dns from 'dns/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: `${__dirname}/../.env` });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🔍 Supabase Connection Diagnostic Tool');
console.log('====================================');

// 1. Verify Environment
console.log('\n1️⃣ Environment Verification');
console.log('---------------------------');
console.log(`Node.js: ${process.version}`);
console.log(`Platform: ${process.platform} ${process.arch}`);
console.log(`OpenSSL: ${process.versions.openssl}`);
console.log(`Supabase URL: ${SUPABASE_URL.replace(/\/\/.*@/, '//***@')}`);
console.log(`Service Key: ${SUPABASE_SERVICE_KEY ? '*** (present)' : '❌ missing'}`);

// 2. Network Diagnostics
async function checkNetwork() {
  console.log('\n2️⃣ Network Diagnostics');
  console.log('----------------------');
  
  try {
    // Check DNS
    const hostname = new URL(SUPABASE_URL).hostname;
    const addresses = await dns.lookup(hostname, { all: true });
    console.log(`✅ DNS Resolution (${hostname}):`, 
      addresses.map(addr => `${addr.address} (IPv${addr.family})`).join(', '));
    
    // Check TCP connectivity
    const net = await import('net');
    const port = 443;
    const socket = net.createConnection({ host: hostname, port }, () => {
      console.log(`✅ TCP Connection: Successfully connected to ${hostname}:${port}`);
      socket.destroy();
    });
    
    socket.setTimeout(5000);
    socket.on('timeout', () => {
      console.log(`❌ TCP Connection: Timeout connecting to ${hostname}:${port}`);
      socket.destroy();
    });
    
    socket.on('error', (err) => {
      console.log(`❌ TCP Connection Error: ${err.message}`);
    });
    
    // Wait for socket to close
    await new Promise(resolve => socket.on('close', resolve));
    
  } catch (error) {
    console.error('❌ Network check failed:', error.message);
  }
}

// 3. Test HTTPS Connection
async function testHttpsConnection() {
  console.log('\n3️⃣ HTTPS Connection Test');
  console.log('------------------------');
  
  const hostname = new URL(SUPABASE_URL).hostname;
  const options = {
    hostname,
    port: 443,
    path: '/rest/v1/',
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    },
    // Enable more verbose TLS debugging
    // secureProtocol: 'TLS_method',
    // secureOptions: require('constants').SSL_OP_NO_TLSv1 | require('constants').SSL_OP_NO_TLSv1_1,
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log(`✅ HTTPS Connection: Status Code ${res.statusCode}`);
      console.log('   Headers:', JSON.stringify(res.headers, null, 2));
      res.on('data', () => {}); // Consume response
      res.on('end', () => resolve(true));
    });
    
    req.on('error', (e) => {
      console.error('❌ HTTPS Connection Error:', e.message);
      console.error('   Error details:', {
        code: e.code,
        stack: e.stack
      });
      resolve(false);
    });
    
    req.end();
  });
}

// 4. Test Supabase Client
async function testSupabaseClient() {
  console.log('\n4️⃣ Supabase Client Test');
  console.log('------------------------');
  
  try {
    // Create client with custom fetch for better error handling
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
      global: {
        fetch: (url, options = {}) => {
          console.log(`   Request to: ${url}`);
          return fetch(url, options).catch(err => {
            console.error('   Fetch error:', err);
            throw err;
          });
        }
      }
    });
    
    console.log('   Testing connection...');
    const { data, error } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('schemaname', 'public')
      .limit(1);
    
    if (error) throw error;
    
    console.log(`✅ Supabase Client: Success! Found ${data?.length || 0} tables`);
    return true;
  } catch (error) {
    console.error('❌ Supabase Client Error:', error.message);
    console.error('   Error details:', {
      code: error.code,
      hint: error.hint,
      details: error.details
    });
    return false;
  }
}

// 5. Test with SSL Verification Disabled (Development Only)
async function testInsecureConnection() {
  console.log('\n5️⃣ Insecure Connection Test (Development Only)');
  console.log('--------------------------------------');
  
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      },
      agent
    });
    
    console.log(`✅ Insecure Connection: Status ${response.status} ${response.statusText}`);
    return true;
  } catch (error) {
    console.error('❌ Insecure Connection Failed:', error.message);
    return false;
  }
}

// Main function
async function runDiagnostics() {
  console.log('🚀 Starting diagnostics...\n');
  
  await checkNetwork();
  await testHttpsConnection();
  await testSupabaseClient();
  await testInsecureConnection();
  
  console.log('\n🔍 Diagnostic Summary');
  console.log('====================');
  console.log('1. If all tests pass: Your connection is working correctly.');
  console.log('2. If only the insecure test passes: You have an SSL/TLS issue.');
  console.log('3. If all tests fail: Check your network and Supabase project status.');
  console.log('\n💡 For SSL/TLS issues, try:');
  console.log('   - Updating system certificates');
  console.log('   - Checking system time/date');
  console.log('   - Trying a different network');
  console.log('   - Verifying Supabase project settings');
}

// Run diagnostics
runDiagnostics().catch(console.error);
