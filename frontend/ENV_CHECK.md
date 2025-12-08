# Environment Variables Check

## Issue: "Offline read-only mode" Error

This error occurs when the Supabase client cannot initialize because environment variables aren't loaded.

## Solution

**React Create App only loads `.env` files when the dev server STARTS.**

### Steps to Fix:

1. **Stop the dev server** (Ctrl+C in the terminal running `npm start`)

2. **Verify `.env` file exists** in `frontend/.env` with:
   ```
   REACT_APP_SUPABASE_URL=https://oysuothaldgentevxzod.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Restart the dev server:**
   ```bash
   cd frontend
   npm start
   ```

4. **Check browser console** - You should see:
   ```
   🔍 [Supabase Config] Environment check: { hasUrl: true, hasKey: true, ... }
   ✅ Supabase client initialized with environment variables
   ```

5. **If you still see "Supabase environment variables missing"**, check:
   - `.env` file is in `frontend/` directory (not root)
   - Variables start with `REACT_APP_` prefix
   - No typos in variable names
   - File has no syntax errors (no spaces around `=`)

## Verification

After restarting, open browser console and look for:
- ✅ `✅ Supabase client initialized with environment variables`
- ❌ `Supabase environment variables missing; using offline stub.`

If you see the ❌ message, the env vars still aren't loading. Check the file location and naming.

