-- Verify and Refresh Schema
-- This script verifies all columns exist and helps refresh Supabase's schema cache

-- 1. Verify portfolios table columns
DO $$
DECLARE
    missing_cols TEXT[] := ARRAY[]::TEXT[];
    required_cols TEXT[] := ARRAY['id', 'user_id', 'name', 'description', 'is_simulation', 'virtual_balance', 'created_at', 'updated_at', 'metadata'];
    col TEXT;
BEGIN
    RAISE NOTICE '=== Verifying portfolios table ===';
    
    FOREACH col IN ARRAY required_cols
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'portfolios' 
            AND column_name = col
        ) THEN
            missing_cols := array_append(missing_cols, col);
            RAISE NOTICE '❌ Missing column: portfolios.%', col;
        ELSE
            RAISE NOTICE '✅ Column exists: portfolios.%', col;
        END IF;
    END LOOP;
    
    IF array_length(missing_cols, 1) > 0 THEN
        RAISE NOTICE '⚠️  Missing columns detected: %', array_to_string(missing_cols, ', ');
    ELSE
        RAISE NOTICE '✅ All required columns exist in portfolios table';
    END IF;
END $$;

-- 2. Verify leaderboard_scores table columns
DO $$
DECLARE
    missing_cols TEXT[] := ARRAY[]::TEXT[];
    required_cols TEXT[] := ARRAY['id', 'user_id', 'username', 'score', 'rank', 'portfolio_return', 'achievements_count', 'trades_count', 'learning_progress', 'lessons_completed', 'updated_at'];
    col TEXT;
BEGIN
    RAISE NOTICE '=== Verifying leaderboard_scores table ===';
    
    FOREACH col IN ARRAY required_cols
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'leaderboard_scores' 
            AND column_name = col
        ) THEN
            missing_cols := array_append(missing_cols, col);
            RAISE NOTICE '❌ Missing column: leaderboard_scores.%', col;
        ELSE
            RAISE NOTICE '✅ Column exists: leaderboard_scores.%', col;
        END IF;
    END LOOP;
    
    IF array_length(missing_cols, 1) > 0 THEN
        RAISE NOTICE '⚠️  Missing columns detected: %', array_to_string(missing_cols, ', ');
    ELSE
        RAISE NOTICE '✅ All required columns exist in leaderboard_scores table';
    END IF;
END $$;

-- 3. Force add any still-missing columns (comprehensive fix)
DO $$
BEGIN
    -- Portfolios table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'virtual_balance'
    ) THEN
        ALTER TABLE public.portfolios ADD COLUMN virtual_balance DECIMAL(15, 2) DEFAULT 0;
        RAISE NOTICE '✅ Added virtual_balance to portfolios';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'description'
    ) THEN
        ALTER TABLE public.portfolios ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Added description to portfolios';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.portfolios ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at to portfolios';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'is_simulation'
    ) THEN
        ALTER TABLE public.portfolios ADD COLUMN is_simulation BOOLEAN DEFAULT FALSE;
        RAISE NOTICE '✅ Added is_simulation to portfolios';
    END IF;
    
    -- Leaderboard_scores table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'username'
    ) THEN
        ALTER TABLE public.leaderboard_scores ADD COLUMN username TEXT;
        RAISE NOTICE '✅ Added username to leaderboard_scores';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'leaderboard_scores' AND column_name = 'lessons_completed'
    ) THEN
        ALTER TABLE public.leaderboard_scores ADD COLUMN lessons_completed INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Added lessons_completed to leaderboard_scores';
    END IF;
END $$;

-- 4. List all actual columns (for debugging)
SELECT 
    'portfolios' as table_name,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'portfolios'
UNION ALL
SELECT 
    'leaderboard_scores' as table_name,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leaderboard_scores';

-- 5. Note about Supabase schema cache
-- Supabase uses PostgREST which caches the schema
-- After adding columns, you may need to:
-- 1. Wait a few minutes for auto-refresh
-- 2. Or restart your Supabase project (if using local)
-- 3. Or clear browser cache and hard refresh (Cmd+Shift+R)

