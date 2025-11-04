import dotenv from 'dotenv';
import got from 'got';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath, override: true });

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const testUrl = `${SUPABASE_URL}/rest/v1/users?select=*&limit=1`;

console.log('Testing connection to:', testUrl);

try {
  const response = await got.get(testUrl, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Accept': 'application/json',
    },
    https: {
      rejectUnauthorized: false, // Only for testing!
    },
    timeout: 10000, // 10 seconds
    retry: 3,
  });

  console.log('Success! Response status:', response.statusCode);
  console.log('Response headers:', response.headers);
  console.log('Response body (first 200 chars):', response.body.substring(0, 200));
} catch (error) {
  console.error('Error:', error.message);
  if (error.response) {
    console.error('Response status:', error.response.statusCode);
    console.error('Response headers:', error.response.headers);
    console.error('Response body:', error.response.body);
  }
  process.exit(1);
}
