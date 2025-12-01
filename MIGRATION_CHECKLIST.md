# Migration Checklist - Correct vs Wrong Project

## 🎯 Your Correct Project (InvestX Labs)
- **Project ID**: `oysuothaldgentevxzod`
- **URL**: `https://oysuothaldgentevxzod.supabase.co`
- **Frontend .env**: Points to this project ✅

## 📋 Migrations Created Today

### 1. `20250124000000_add_purchase_price_to_holdings.sql`
- **Purpose**: Initial attempt to add `purchase_price` to holdings
- **Status**: ⚠️ Superseded by `20250124000001`
- **Action**: Don't run this one

### 2. `20250124000001_add_purchase_price_simple.sql` ⭐ **IMPORTANT**
- **Purpose**: Creates `portfolios` and `holdings` tables if missing, adds `purchase_price` column
- **What it does**:
  - Creates `portfolios` table (if doesn't exist)
  - Creates `holdings` table with `purchase_price` (if doesn't exist)
  - Adds `purchase_price` column to existing `holdings` table
  - Sets up RLS policies and indexes
- **Run in CORRECT project**: ✅ YES
- **If you ran in wrong project**: May have created tables there (check)

### 3. `20250124000002_add_purchase_price_direct.sql`
- **Purpose**: Direct SQL to add `purchase_price` (simpler version)
- **Status**: Alternative to `20250124000001`
- **Action**: Use `20250124000001` instead (more comprehensive)

### 4. `20250124000003_verify_purchase_price.sql`
- **Purpose**: Verification script only
- **Action**: Run to verify, doesn't modify anything

### 5. `20250124000004_add_xp_networth_to_user_profiles.sql` ⭐ **IMPORTANT**
- **Purpose**: Adds `xp` and `net_worth` columns to `user_profiles` table
- **What it does**:
  - Adds `xp INTEGER DEFAULT 0 NOT NULL`
  - Adds `net_worth DECIMAL(15, 2) DEFAULT 0 NOT NULL`
- **Run in CORRECT project**: ✅ YES
- **If you ran in wrong project**: May have added columns there (check)

## 🔍 Step-by-Step Verification

### Step 1: Verify Correct Project
1. Go to Supabase Dashboard
2. Check the project URL matches: `oysuothaldgentevxzod.supabase.co`
3. Run `CHECKLIST_VERIFY_PROJECT.sql` in SQL Editor

### Step 2: Check What's Missing in CORRECT Project
Run the verification script - it will tell you:
- ✅ What exists
- ❌ What's missing
- Which migrations to run

### Step 3: Check What You Created in WRONG Project
1. Switch to the wrong project in Supabase Dashboard
2. Run `CHECK_WRONG_PROJECT.sql` in SQL Editor
3. It will show you what objects were created there

If you ran migrations in the wrong project, you may have:
- Created `portfolios` table
- Created `holdings` table  
- Added `purchase_price` column
- Added `xp` and `net_worth` columns to `user_profiles`

**To undo in wrong project** (if needed):
- If the project is not being used: You can leave them (they won't hurt)
- If the project is being used: Check if those tables/columns conflict with existing schema
- Only drop them if you're sure they're not needed and not being used

### Step 4: Run Missing Migrations in CORRECT Project
Based on verification results, run:
1. `20250124000001_add_purchase_price_simple.sql` (if holdings/portfolios missing or purchase_price missing)
2. `20250124000004_add_xp_networth_to_user_profiles.sql` (if xp/net_worth missing)

## 📝 Quick Reference

**Files to run in CORRECT project:**
- ✅ `20250124000001_add_purchase_price_simple.sql`
- ✅ `20250124000004_add_xp_networth_to_user_profiles.sql`

**Files that are just verification:**
- ℹ️ `20250124000003_verify_purchase_price.sql`
- ℹ️ `CHECKLIST_VERIFY_PROJECT.sql` (run in CORRECT project)
- ℹ️ `CHECK_WRONG_PROJECT.sql` (run in WRONG project to see what was created)

**Files to ignore:**
- ⚠️ `20250124000000_add_purchase_price_to_holdings.sql` (superseded)
- ⚠️ `20250124000002_add_purchase_price_direct.sql` (alternative, use 00001 instead)
