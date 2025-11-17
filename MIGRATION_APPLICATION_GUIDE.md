# Migration Application Guide - user_id Columns Fix

## Quick Start

**Migration File:** `backend/supabase/migrations/20251113000004_fix_holdings_transactions.sql`

**Status:** ✅ Ready to apply

---

## Method 1: Supabase Dashboard (Recommended - 2 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Sign in and select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query" button

3. **Copy Migration SQL**
   ```bash
   cat backend/supabase/migrations/20251113000004_fix_holdings_transactions.sql
   ```
   Or open the file and copy all contents.

4. **Paste and Execute**
   - Paste the SQL into the SQL Editor
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for "Success" message

5. **Verify**
   - You should see notices like:
     - `✅ Added user_id column to holdings table`
     - `✅ Added user_id column to transactions table`

---

## Method 2: Supabase CLI (For Automation)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Navigate to backend directory
cd backend

# Link your project (first time only)
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push
```

**Note:** You'll need your project reference ID from Supabase Dashboard → Settings → General.

---

## Method 3: Direct psql Connection

```bash
# Get connection string from:
# Supabase Dashboard → Settings → Database → Connection string → URI

# Apply migration
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f backend/supabase/migrations/20251113000004_fix_holdings_transactions.sql
```

---

## Verification

After applying the migration, verify it worked:

```bash
cd backend
node scripts/check_database_schema.js
```

Expected output:
```
✅ holdings.user_id: EXISTS
✅ transactions.user_id: EXISTS
✅ All user_id columns exist. Database schema is correct.
```

Or check manually in Supabase Dashboard → Table Editor:
- Open `holdings` table → Check columns → Should see `user_id`
- Open `transactions` table → Check columns → Should see `user_id`

---

## What This Migration Does

1. **Adds `user_id` column to `holdings` table**
   - References `auth.users(id)`
   - Populates existing rows from `portfolios.user_id`
   - Creates index for performance

2. **Adds `user_id` column to `transactions` table**
   - References `auth.users(id)`
   - Populates existing rows from `portfolios.user_id`
   - Creates index for performance

3. **Safe and Idempotent**
   - Checks if columns exist before adding
   - Safe to run multiple times
   - Preserves all existing data

---

## Troubleshooting

### Error: "column already exists"
✅ **This is fine** - The migration detected the column already exists. No action needed.

### Error: "relation does not exist"
⚠️ **Tables don't exist yet** - Run the base schema migration first:
```sql
-- Apply: backend/supabase/migrations/20250200000000_conversations_and_features.sql
```

### Error: "permission denied"
⚠️ **Need service role key** - Use Supabase Dashboard (Method 1) or ensure you're using service role key, not anon key.

### Some rows have NULL user_id
⚠️ **Data issue** - Some holdings/transactions don't have a matching portfolio. The migration will warn you. You may need to:
1. Check for orphaned rows
2. Assign them to a portfolio manually
3. Or delete orphaned rows if they're invalid

---

## Next Steps After Migration

1. **Restart Backend**
   ```bash
   cd backend
   npm run start
   ```

2. **Restart Frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Test Dashboard**
   - Open dashboard in browser
   - Verify holdings and transactions load
   - Check browser console for errors

4. **Run Smoke Tests**
   ```bash
   cd backend
   node scripts/smoke_minimal.js
   ```

---

## Support

If you encounter issues:
1. Check migration file: `backend/supabase/migrations/20251113000004_fix_holdings_transactions.sql`
2. Run verification: `node backend/scripts/check_database_schema.js`
3. Review logs in Supabase Dashboard → Logs → Postgres Logs

