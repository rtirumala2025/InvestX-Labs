-- Add xp and net_worth columns to user_profiles table
-- These columns are used by the leaderboard service

-- Add xp column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'xp'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN xp INTEGER DEFAULT 0 NOT NULL;
        
        RAISE NOTICE '✅ Added xp column to user_profiles table';
    ELSE
        RAISE NOTICE '✅ xp column already exists';
    END IF;
END $$;

-- Add net_worth column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'net_worth'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN net_worth DECIMAL(15, 2) DEFAULT 0 NOT NULL;
        
        RAISE NOTICE '✅ Added net_worth column to user_profiles table';
    ELSE
        RAISE NOTICE '✅ net_worth column already exists';
    END IF;
END $$;

-- Verify columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles' 
  AND column_name IN ('xp', 'net_worth')
ORDER BY column_name;
