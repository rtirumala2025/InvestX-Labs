# 🔧 Database Schema Fix Instructions

## Issue Summary

Your application is experiencing database schema errors:
1. **Missing `is_simulation` column** in `portfolios` table
2. **Missing `achievements` table**

## Solution

A migration file has been created to fix these issues:
- **Migration File**: `backend/supabase/migrations/20251113000000_fix_schema_issues.sql`

## How to Apply the Migration

### Method 1: Supabase Dashboard (Recommended - Easiest)

1. **Go to your Supabase project dashboard**
   - Navigate to https://app.supabase.com/
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the migration SQL**
   - Open the file: `backend/supabase/migrations/20251113000000_fix_schema_issues.sql`
   - Copy all the SQL content
   - Paste it into the SQL Editor

4. **Run the migration**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for the migration to complete
   - You should see "Success" message

5. **Verify the migration**
   - Go to "Table Editor" in the left sidebar
   - Check that:
     - `portfolios` table has an `is_simulation` column
     - `achievements` table exists

### Method 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to backend directory
cd backend

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up
```

### Method 3: Direct Database Access

If you have direct PostgreSQL access:

```bash
# Using psql
psql -h db.your-project.supabase.co -U postgres -d postgres -f backend/supabase/migrations/20251113000000_fix_schema_issues.sql
```

## What the Migration Does

1. **Creates/Updates `portfolios` table**
   - Ensures `portfolios` table exists
   - Adds `is_simulation` column if it doesn't exist (default: `FALSE`)
   - Creates indexes for better performance
   - Sets up RLS policies

2. **Creates `achievements` table**
   - Creates `achievements` table with frontend-compatible schema
   - Columns: `id`, `user_id`, `type`, `details`, `earned_at`, `metadata`
   - Creates indexes for better performance
   - Sets up RLS policies

3. **Ensures `user_achievements` table exists**
   - Creates `user_achievements` table if it doesn't exist
   - Sets up RLS policies

## Verification

After applying the migration, verify:

1. **Check portfolios table**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'portfolios' 
   AND column_name = 'is_simulation';
   ```
   Should return: `is_simulation | boolean`

2. **Check achievements table**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'achievements';
   ```
   Should return: `achievements`

3. **Test the application**
   - Refresh your application
   - The errors should be gone
   - You should be able to load portfolios and achievements

## Troubleshooting

### Error: "relation already exists"
- This means the table/column already exists
- The migration uses `IF NOT EXISTS` so it should be safe
- You can ignore this error

### Error: "permission denied"
- Make sure you're using the service role key
- Or run the migration as a database admin

### Error: "column already exists"
- This means the column was already added
- The migration checks for existence first, so this shouldn't happen
- If it does, you can safely ignore it

### Still seeing errors after migration?
- Clear your browser cache
- Restart your development server
- Check the Supabase logs for any remaining errors
- Verify the migration was applied correctly using the verification queries above

## Next Steps

After applying the migration:

1. **Refresh your application**
   - The errors should be resolved
   - Portfolios should load correctly
   - Achievements should work

2. **Test the functionality**
   - Try creating a portfolio
   - Try earning an achievement
   - Check if the leaderboard works

3. **Monitor for errors**
   - Check the browser console
   - Check Supabase logs
   - Report any remaining issues

## Support

If you encounter any issues:
1. Check the Supabase logs
2. Verify your environment variables are correct
3. Make sure you're using the correct Supabase project
4. Check that the migration was applied successfully

