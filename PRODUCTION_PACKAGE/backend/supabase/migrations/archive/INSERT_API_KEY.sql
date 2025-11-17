-- Step 2: Insert Your Alpha Vantage API Key
-- Replace 'YOUR_API_KEY' with your actual API key from https://www.alphavantage.co/support/#api-key

INSERT INTO api_configurations (service_name, api_key, rate_limit_per_minute, created_at)
VALUES (
  'alpha_vantage',
  'YOUR_API_KEY',
  5,
  NOW()
)
ON CONFLICT (service_name) 
DO UPDATE SET 
  api_key = EXCLUDED.api_key,
  updated_at = NOW();
