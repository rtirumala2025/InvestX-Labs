# Supabase Migration Guide

## Issue
The frontend is getting 404 errors when calling Supabase RPC functions because the function signatures don't match what the frontend expects.

## Error Details
- `get_user_context` - 404 Not Found
- `get_quote` - 404 Not Found  
- `get_ai_recommendations` - 404 Not Found
- `get_market_news` - 404 Not Found
- `get_recommendations` - 404 Not Found

## Solution
Apply the migration file `backend/supabase/migrations/20240101000001_fix_rpc_functions.sql` to your Supabase database.

## Steps to Apply Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `oysuothaldgentevxzod`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `backend/supabase/migrations/20240101000001_fix_rpc_functions.sql`
6. Paste it into the SQL editor
7. Click **Run** to execute the migration

### Option 2: Using Supabase CLI (If Available)
```bash
cd backend
supabase db push
```

## What This Migration Does
1. **Fixes `get_ai_recommendations`** - Updates function signature to match frontend calls
2. **Creates `get_market_news`** - New function for fetching market news
3. **Updates `get_recommendations`** - Fixes function signature to match frontend calls
4. **Creates `get_batch_market_data`** - New function for batch market data requests
5. **Creates `get_historical_data`** - New function for historical price data
6. **Creates additional helper functions** - For recommendation explanations, market insights, etc.

## Verification
After applying the migration, the frontend should no longer show 404 errors for these RPC functions.

## WebSocket Issues
The WebSocket connection to `ws://localhost:3002/ws` is also failing. This appears to be a separate backend service that needs to be running.

## Next Steps
1. Apply the Supabase migration
2. Start the backend WebSocket service on port 3002
3. Test the frontend to ensure all connections work
