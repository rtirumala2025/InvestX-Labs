import https from 'https';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '../.env') });

const url = new URL(process.env.SUPABASE_URL);
const options = {
  hostname: url.hostname,
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': process.env.SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  },
  // Add these options to help debug SSL issues
  rejectUnauthorized: true,
  requestCert: true,
  agent: false
};

console.log('Testing connection to:', url.hostname);
console.log('Using API key:', process.env.SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing');

console.log('\n🔍 SSL/TLS Configuration:');
console.log('  - Node.js version:', process.version);
console.log('  - OpenSSL version:', process.versions.openssl);

console.log('\n🔧 Attempting HTTPS request...');

const req = https.request(options, (res) => {
  console.log('\n✅ Connection successful!');
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse body:');
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error('\n❌ Error:', e.message);
  if (e.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    console.log('\n⚠️  SSL Certificate verification failed. This could be due to:');
    console.log('  1. Outdated root certificates');
    console.log('  2. System time/date is incorrect');
    console.log('  3. Network proxy issues');
    console.log('\nTry running: npm install -g update-ca-certificates && update-ca-certificates');
  }
});

req.end();
