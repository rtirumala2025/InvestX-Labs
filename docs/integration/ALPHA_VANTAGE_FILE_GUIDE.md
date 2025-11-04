# 🔑 Alpha Vantage API Key Setup - Complete File Guide

## Overview
Your Alpha Vantage API key needs to be configured in **3 locations** for the system to work properly.

---

## 📁 File Overview

### **1. Supabase Database** (REQUIRED)
**File**: `api_configurations` table in your Supabase database  
**Location**: Supabase Dashboard → SQL Editor  
**Purpose**: Stores the API key for RPC functions to access

### **2. Supabase Edge Function Secret** (REQUIRED)
**File**: `backend/supabase/functions/fetch-alpha-vantage/index.ts`  
**Location**: Supabase Dashboard → Edge Functions → Secrets  
**Purpose**: Makes the API key available to the Edge Function

### **3. Backend Environment File** (OPTIONAL - for validation)
**File**: `backend/.env`  
**Location**: Root of backend directory  
**Purpose**: For backend validation and testing

---

## 🎯 Step-by-Step Setup

### **Step 1: Get Your Alpha Vantage API Key**
1. Visit: https://www.alphavantage.co/support/#api-key
2. Sign up for a free account
3. Copy your API key (format: `ABC123DEF456GHI789`)

---

### **Step 2: Store in Supabase Database**

**File**: `api_configurations` table

**Method A: Using Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Select your project: `oysuothaldgentevxzod`
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste and run this SQL (replace `YOUR_API_KEY_HERE`):

```sql
-- Insert Alpha Vantage API key
INSERT INTO api_configurations (service_name, api_key, rate_limit_per_minute, created_at)
VALUES (
  'alpha_vantage',
  'YOUR_API_KEY_HERE',
  5,
  NOW()
)
ON CONFLICT (service_name) 
DO UPDATE SET 
  api_key = EXCLUDED.api_key,
  rate_limit_per_minute = EXCLUDED.rate_limit_per_minute,
  updated_at = NOW();
```

6. Click "Run"
7. You should see: "Success. 1 row returned"

**What this does**: Stores your API key in the database so the `get_real_quote` RPC function can access it.

---

### **Step 3: Set as Edge Function Secret**

**File**: `backend/supabase/functions/fetch-alpha-vantage/index.ts`  
**Function reads from**: Line 7 `Deno.env.get('ALPHA_VANTAGE_API_KEY')`

**Method A: Using Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Click "Edge Functions" in the left sidebar
3. Find or create: `fetch-alpha-vantage`
4. Click "Settings" or "Secrets"
5. Add new secret:
   - **Name**: `ALPHA_VANTAGE_API_KEY`
   - **Value**: `YOUR_API_KEY_HERE`
6. Click "Save"

**Method B: Using Supabase CLI**

```bash
# Set the secret
supabase secrets set ALPHA_VANTAGE_API_KEY=YOUR_API_KEY_HERE

# Deploy the Edge Function
supabase functions deploy fetch-alpha-vantage
```

**What this does**: Makes your API key available to the Edge Function so it can make calls to Alpha Vantage API.

---

### **Step 4: Deploy the Edge Function**

**File**: `backend/supabase/functions/fetch-alpha-vantage/index.ts`

**Using Supabase Dashboard:**
1. Go to "Edge Functions"
2. Find `fetch-alpha-vantage`
3. Click "Deploy" or "Deploy Function"
4. Wait for deployment to complete

**Using Supabase CLI:**
```bash
cd backend/supabase
supabase functions deploy fetch-alpha-vantage
```

---

### **Step 5: (Optional) Add to Backend .env**

**File**: `backend/.env`  
**Location**: `/Users/ritvik/Desktop/InvestX Labs/backend/.env`

**Purpose**: For backend validation and testing scripts

Create or edit `backend/.env`:
```env
# Alpha Vantage API Key
ALPHA_VANTAGE_API_KEY=YOUR_API_KEY_HERE

# Supabase Configuration
SUPABASE_URL=https://oysuothaldgentevxzod.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# OpenRouter (optional)
OPENROUTER_API_KEY=your_openrouter_key_here
```

**Note**: This is optional and mainly for local testing. The Edge Function gets the key from Supabase secrets.

---

### **Step 6: Add to Frontend .env** (Optional)

**File**: `frontend/.env` or `frontend/.env.development`  
**Location**: `/Users/ritvik/Desktop/InvestX Labs/frontend/.env`

**Purpose**: For frontend environment variables

The frontend doesn't directly use the API key, but it needs Supabase connection info:

```env
NEXT_PUBLIC_SUPABASE_URL=https://oysuothaldgentevxzod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 📋 Where Each File Reads the Key From

| Component | File | Reads Key From | Purpose |
|-----------|------|----------------|---------|
| **Supabase RPC** | `backend/supabase/migrations/20250125000001_alpha_vantage_integration.sql` | `api_configurations` table (line 149-151) | Fetches API key from database |
| **Edge Function** | `backend/supabase/functions/fetch-alpha-vantage/index.ts` | `Deno.env.get('ALPHA_VANTAGE_API_KEY')` (line 7) | Gets key from Supabase secrets |
| **Backend Validation** | `backend/config/env.validation.js` | `process.env.ALPHA_VANTAGE_API_KEY` (line 37-40) | Validates key exists |
| **Frontend Service** | `frontend/src/services/marketService.js` | Calls Supabase RPCs (line 116-118) | Uses RPC functions, not direct API calls |

---

## 🔍 How the Key Flows Through the System

### **Architecture Flow:**

```
1. Frontend (marketService.js)
   ↓ Calls Supabase RPC
   
2. Supabase RPC (get_real_quote function)
   ↓ Reads from api_configurations table
   
3. Alpha Vantage API
   ↓ Returns data
   
4. Supabase caches result in market_data_cache table
   
5. Frontend receives data
```

### **Alternative Flow (Edge Function):**

```
1. Frontend (marketService.js)
   ↓ Can call Edge Function directly
   
2. Edge Function (fetch-alpha-vantage)
   ↓ Reads from Deno.env.get('ALPHA_VANTAGE_API_KEY')
   ↓ Makes API call to Alpha Vantage
   
3. Alpha Vantage API
   ↓ Returns data
   
4. Edge Function caches in Supabase market_data_cache
   
5. Frontend receives data
```

---

## ✅ Verification Checklist

After setup, verify everything works:

### **1. Check Database**
```sql
-- Run in Supabase SQL Editor
SELECT service_name, api_key, is_active 
FROM api_configurations 
WHERE service_name = 'alpha_vantage';
```

**Expected**: Should show your API key and `is_active = true`

### **2. Check Edge Function**
```bash
# Test Edge Function
curl "https://oysuothaldgentevxzod.supabase.co/functions/v1/fetch-alpha-vantage" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

**Expected**: Returns JSON with AAPL quote data

### **3. Run Integration Tests**
```bash
cd frontend
npm run test:market:integration
```

**Expected**: All tests pass

### **4. Check Frontend**
Open browser console and look for:
- `[MarketService] Successfully fetched market data for AAPL`
- No errors about missing API key

---

## 🚨 Troubleshooting

### **Error: "Alpha Vantage API key not configured"**
- **Solution**: Make sure you inserted the key into `api_configurations` table

### **Error: "ALPHA_VANTAGE_API_KEY not configured" (Edge Function)**
- **Solution**: Set the secret in Edge Function settings

### **Error: "Rate limit exceeded"**
- **Solution**: Free tier allows 5 calls/minute. Wait 1 minute and try again.

### **Error: "Symbol not allowed"**
- **Solution**: Add symbol to `allowed_symbols` table:
```sql
INSERT INTO allowed_symbols (symbol, name, exchange)
VALUES ('TICKER', 'Company Name', 'NASDAQ');
```

---

## 📊 Summary Table

| # | Location | File/Table | Method | Required |
|---|----------|-----------|---------|----------|
| 1 | Supabase Database | `api_configurations` | SQL INSERT | ✅ Yes |
| 2 | Supabase Edge Function | `fetch-alpha-vantage` secrets | Dashboard or CLI | ✅ Yes |
| 3 | Backend .env | `backend/.env` | Create/edit file | ❌ Optional |
| 4 | Frontend .env | `frontend/.env` | Already exists | ❌ Optional |

---

## 🎯 Quick Start Commands

```bash
# 1. Get API key from https://www.alphavantage.co/support/#api-key

# 2. Insert into database (run in Supabase SQL Editor)
INSERT INTO api_configurations (service_name, api_key, rate_limit_per_minute, created_at)
VALUES ('alpha_vantage', 'YOUR_API_KEY', 5, NOW())
ON CONFLICT (service_name) DO UPDATE SET api_key = EXCLUDED.api_key;

# 3. Set Edge Function secret (using Supabase Dashboard)
# - Go to Edge Functions → fetch-alpha-vantage → Settings
# - Add secret: ALPHA_VANTAGE_API_KEY = YOUR_API_KEY

# 4. Deploy Edge Function
# - Click "Deploy" in Dashboard or run:
# supabase functions deploy fetch-alpha-vantage

# 5. Test it
cd frontend
npm run test:market:integration
```

---

## 📚 Related Files

- **Migration**: `backend/supabase/migrations/20250125000001_alpha_vantage_integration.sql`
- **Edge Function**: `backend/supabase/functions/fetch-alpha-vantage/index.ts`
- **Frontend Service**: `frontend/src/services/marketService.js`
- **Env Validation**: `backend/config/env.validation.js`
- **Documentation**: 
  - `ALPHA_VANTAGE_SETUP.md` - Complete setup guide
  - `MARKET_SERVICE_IMPLEMENTATION.md` - Implementation details
  - `PHASE_3_ALPHA_VANTAGE_COMPLETE.md` - Phase summary

---

**Status**: ✅ Production Ready  
**Next**: Run tests and verify integration!
