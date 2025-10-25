# Fix Connection Issues Guide

## Issues Identified
1. **Supabase RPC Functions 404 Errors** - Missing or incorrect function signatures
2. **WebSocket Connection Failures** - MCP server not running on port 3002

## Solution 1: Fix Supabase RPC Functions

### Problem
The frontend is calling RPC functions with signatures that don't match the database:
- `get_user_context(user_id)` - 404 Not Found
- `get_quote(symbol)` - 404 Not Found  
- `get_ai_recommendations(user_id, user_profile)` - 404 Not Found
- `get_market_news(limit, symbol_filter)` - 404 Not Found
- `get_recommendations(user_id, type, context_id, max_results)` - 404 Not Found

### Fix
Apply the migration file to your Supabase database:

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select project: `oysuothaldgentevxzod`

2. **Open SQL Editor**
   - Navigate to "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Apply Migration**
   - Copy the entire contents of `backend/supabase/migrations/20240101000001_fix_rpc_functions.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

### What This Fixes
- ✅ Updates `get_ai_recommendations` to match frontend calls
- ✅ Creates `get_market_news` function
- ✅ Updates `get_recommendations` function signature
- ✅ Creates `get_batch_market_data` function
- ✅ Creates `get_historical_data` function
- ✅ Creates additional helper functions

## Solution 2: Fix WebSocket Connection

### Problem
WebSocket connection to `ws://localhost:3002/ws` is failing because the MCP server isn't running.

### Fix
Start the MCP server on port 3002:

```bash
cd backend
npm run start:mcp
```

Or for development with auto-restart:
```bash
cd backend
npm run dev:mcp
```

### What This Fixes
- ✅ Starts MCP server on port 3002
- ✅ Enables WebSocket connections
- ✅ Provides AI model and data provider services

## Complete Setup Instructions

### 1. Apply Supabase Migration
```bash
# Go to Supabase dashboard and run the SQL migration
# File: backend/supabase/migrations/20240101000001_fix_rpc_functions.sql
```

### 2. Start Backend Services
```bash
# Terminal 1: Start main backend server
cd backend
npm start

# Terminal 2: Start MCP server
cd backend
npm run start:mcp
```

### 3. Start Frontend
```bash
# Terminal 3: Start frontend
cd frontend
npm start
```

## Verification

After applying both fixes, you should see:
- ✅ No more 404 errors for Supabase RPC calls
- ✅ No more WebSocket connection failures
- ✅ Frontend loads without errors
- ✅ Market data loads successfully
- ✅ AI recommendations work

## Troubleshooting

### If Supabase migration fails:
- Check that you have the correct project selected
- Ensure you have admin access to the database
- Try running the SQL statements one by one

### If MCP server fails to start:
- Check that port 3002 is not already in use
- Ensure all environment variables are set
- Check the logs for specific error messages

### If frontend still shows errors:
- Clear browser cache and reload
- Check browser console for any remaining errors
- Verify both backend services are running
