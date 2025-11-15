# 🔑 Alpha Vantage API Key Setup Guide

## Step 1: Get Your API Key
1. Visit: https://www.alphavantage.co/support/#api-key
2. Sign up for a free account
3. Copy your API key (format: `ABC123DEF456GHI789`)

## Step 2: Store in Supabase Database

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `oysuothaldgentevxzod`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run this SQL command** (replace `YOUR_API_KEY_HERE` with your actual key):
```sql
-- Insert Alpha Vantage API key into api_configurations table
INSERT INTO api_configurations (api_name, api_key, is_active, created_at)
VALUES (
  'alpha_vantage',
  'YOUR_API_KEY_HERE',
  true,
  NOW()
)
ON CONFLICT (api_name) 
DO UPDATE SET 
  api_key = EXCLUDED.api_key,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

4. **Click "Run" to execute**

### Option B: Using Supabase CLI (Advanced)

```bash
# Set your API key as an environment variable
export ALPHA_VANTAGE_API_KEY="YOUR_API_KEY_HERE"

# Run the SQL migration
supabase db push
```

## Step 3: Set as Supabase Edge Function Secret

### Using Supabase Dashboard:

1. **Go to Edge Functions**
   - In your Supabase Dashboard
   - Click "Edge Functions" in the left sidebar

2. **Add Secret**
   - Click "Settings" or "Secrets"
   - Add new secret:
     - **Name**: `ALPHA_VANTAGE_API_KEY`
     - **Value**: `YOUR_API_KEY_HERE`

### Using Supabase CLI:

```bash
# Set the secret
supabase secrets set ALPHA_VANTAGE_API_KEY=YOUR_API_KEY_HERE

# Deploy the Edge Function
supabase functions deploy fetch-alpha-vantage
```

## Step 4: Deploy the Edge Function

### Using Supabase Dashboard:

1. **Go to Edge Functions**
2. **Click "Deploy"** next to `fetch-alpha-vantage`
3. **Wait for deployment to complete**

### Using Supabase CLI:

```bash
# Deploy the function
supabase functions deploy fetch-alpha-vantage
```

## Step 5: Test the Setup

### Run the integration test:
```bash
cd frontend
npm run test:market:integration
```

### Check the logs:
```bash
# Check if API key is working
curl "https://oysuothaldgentevxzod.supabase.co/functions/v1/fetch-alpha-vantage?symbol=AAPL"
```

## 🔍 Verification Steps

### 1. Check Database
```sql
-- Verify API key is stored
SELECT api_name, is_active, created_at 
FROM api_configurations 
WHERE api_name = 'alpha_vantage';
```

### 2. Check Edge Function
- Go to Edge Functions in Supabase Dashboard
- Click on `fetch-alpha-vantage`
- Check "Logs" tab for any errors

### 3. Test API Call
```bash
# Test with curl
curl "https://oysuothaldgentevxzod.supabase.co/functions/v1/fetch-alpha-vantage?symbol=AAPL"
```

## 🚨 Troubleshooting

### Common Issues:

1. **"API key not found"**
   - Check if you inserted the key in `api_configurations` table
   - Verify the key is exactly as provided by Alpha Vantage

2. **"Edge Function not found"**
   - Deploy the Edge Function first
   - Check if the function name is correct

3. **"Rate limit exceeded"**
   - Free tier allows 5 calls per minute
   - Wait 1 minute and try again

4. **"Invalid symbol"**
   - Check if symbol is in the `allowed_symbols` table
   - Add new symbols if needed

## 📋 Quick Checklist

- [ ] Got API key from Alpha Vantage
- [ ] Stored key in `api_configurations` table
- [ ] Set key as Edge Function secret
- [ ] Deployed Edge Function
- [ ] Ran integration tests
- [ ] Verified API calls work

## 🎯 Next Steps

After setup:
1. Run `npm run test:market:integration`
2. Check frontend for real data
3. Monitor API usage in Alpha Vantage dashboard
4. Proceed to Phase 4 features

---

**Need Help?** Check the logs in Supabase Dashboard or run the test scripts!
