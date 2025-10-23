import https from 'https';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

console.log('🔍 System Information:');
try {
  console.log('  - Node.js version:', process.version);
  console.log('  - Platform:', process.platform);
  console.log('  - Architecture:', process.arch);
  console.log('  - OpenSSL version:', process.versions.openssl);
  
  // Test DNS resolution
  console.log('\n🌐 Testing DNS resolution...');
  const hostname = new URL(SUPABASE_URL).hostname;
  console.log('  - Hostname:', hostname);
  
  try {
    const dns = await import('dns/promises');
    const addresses = await dns.lookup(hostname, { all: true });
    console.log('  - Resolved IPs:', addresses.map(addr => `${addr.address} (IPv${addr.family})`).join(', '));
  } catch (dnsError) {
    console.error('  ❌ DNS resolution failed:', dnsError.message);
  }
  
  // Test basic TCP connection
  console.log('\n🔌 Testing TCP connection...');
  const net = await import('net');
  
  const tcpTest = () => new Promise((resolve) => {
    const socket = net.createConnection(443, hostname, () => {
      console.log('  ✅ TCP connection successful');
      socket.destroy();
      resolve(true);
    });
    
    socket.setTimeout(5000);
    
    socket.on('timeout', () => {
      console.log('  ❌ TCP connection timed out');
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', (err) => {
      console.log('  ❌ TCP connection failed:', err.message);
      resolve(false);
    });
  });
  
  const tcpSuccess = await tcpTest();
  
  if (!tcpSuccess) {
    console.log('\n❌ Cannot proceed with HTTPS test - TCP connection failed');
    process.exit(1);
  }
  
  // Test HTTPS connection with various TLS options
  console.log('\n🔐 Testing HTTPS connection with different TLS configurations...');
  
  const testHttps = (options) => new Promise((resolve) => {
    const req = https.request({
      hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`\n✅ HTTPS Connection successful with options:`, JSON.stringify(options, null, 2));
        console.log('Status Code:', res.statusCode);
        console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
        console.log('Response Body:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
        resolve(true);
      });
    });
    
    req.on('error', (e) => {
      console.log(`❌ HTTPS Connection failed with options ${JSON.stringify(options)}:`, e.message);
      resolve(false);
    });
    
    req.end();
  });
  
  // Test with different TLS configurations
  const configs = [
    { rejectUnauthorized: true },
    { rejectUnauthorized: false },
    { minVersion: 'TLSv1.2' },
    { minVersion: 'TLSv1.3' },
    { ciphers: 'ALL' },
    { secureProtocol: 'TLS_method' }
  ];
  
  let anySuccess = false;
  for (const config of configs) {
    console.log(`\n🔧 Testing with config:`, JSON.stringify(config));
    const success = await testHttps(config);
    if (success) anySuccess = true;
  }
  
  if (!anySuccess) {
    console.log('\n❌ All HTTPS connection attempts failed. Possible causes:');
    console.log('1. Outdated root certificates');
    console.log('2. Network restrictions or firewall blocking the connection');
    console.log('3. Supabase project might be paused or suspended');
    console.log('4. System time/date is incorrect');
    console.log('\nNext steps:');
    console.log('1. Check if the Supabase project is active in the dashboard');
    console.log('2. Try accessing the Supabase URL in a web browser');
    console.log('3. Update your system certificates');
    console.log('4. Try from a different network');
  }
  
} catch (error) {
  console.error('❌ Error during connection test:', error);
}
