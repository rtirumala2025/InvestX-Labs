const https = require('https');
require('dotenv').config();

const url = new URL(process.env.SUPABASE_URL);
const options = {
  hostname: url.hostname,
  port: 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': process.env.SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }
};

console.log('Testing connection to:', url.hostname);

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  res.on('data', (d) => {
    process.stdout.write(d);
  });});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.end();
