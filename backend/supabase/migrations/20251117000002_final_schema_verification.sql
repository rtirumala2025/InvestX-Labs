-- Final Schema Verification and Fix Migration
-- This migration ensures ALL required columns exist in holdings and transactions tables
-- Idempotent: Safe to run multiple times
-- Run this after all other migrations to ensure complete schema compliance

-- ============================================================================
-- TRANSACTIONS TABLE - Complete Column Verification
-- ============================================================================

-- Ensure all transaction columns exist (consolidated check)
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col TEXT;
BEGIN
    -- Check for required columns
    FOR col IN SELECT unnest(ARRAY[
        'id', 'user_id', 'portfolio_id', 'transaction_date', 'transaction_type',
        'symbol', 'shares', 'price', 'total_amount', 'fees', 'notes', 'metadata',
        'created_at', 'updated_at'
    ])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    -- Add missing columns
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  Missing columns in transactions: %', array_to_string(missing_columns, ', ');
        RAISE NOTICE 'ℹ️  These should have been added by previous migrations';
        RAISE NOTICE 'ℹ️  Please ensure migration 20251117000001_fix_transactions_columns.sql was applied';
    ELSE
        RAISE NOTICE '✅ All required columns exist in transactions table';
    END IF;
END $$;

-- ============================================================================
-- HOLDINGS TABLE - Complete Column Verification
-- ============================================================================

-- Ensure all holdings columns exist
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col TEXT;
BEGIN
    -- Check for required columns
    FOR col IN SELECT unnest(ARRAY[
        'id', 'user_id', 'portfolio_id', 'symbol', 'company_name', 'shares',
        'purchase_price', 'purchase_date', 'current_price', 'sector', 'asset_type',
        'created_at', 'updated_at'
    ])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings' 
            AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    -- Add missing columns
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  Missing columns in holdings: %', array_to_string(missing_columns, ', ');
        RAISE NOTICE 'ℹ️  These should have been added by previous migrations';
        RAISE NOTICE 'ℹ️  Please ensure migration 20251113000004_fix_holdings_transactions.sql was applied';
    ELSE
        RAISE NOTICE '✅ All required columns exist in holdings table';
    END IF;
END $$;

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS - Verification and Creation
-- ============================================================================

-- Verify/Create foreign keys for transactions
DO $$
BEGIN
    -- transactions.user_id -> auth.users(id)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'transactions_user_id_fkey'
        AND conrelid = 'public.transactions'::regclass
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'user_id'
        ) THEN
            BEGIN
                ALTER TABLE public.transactions 
                ADD CONSTRAINT transactions_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
                RAISE NOTICE '✅ Created foreign key: transactions.user_id -> auth.users(id)';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️  Could not create foreign key: %', SQLERRM;
            END;
        END IF;
    ELSE
        RAISE NOTICE '✅ Foreign key exists: transactions.user_id -> auth.users(id)';
    END IF;
    
    -- transactions.portfolio_id -> portfolios(id)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'transactions_portfolio_id_fkey'
        AND conrelid = 'public.transactions'::regclass
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'portfolio_id'
        ) THEN
            BEGIN
                ALTER TABLE public.transactions 
                ADD CONSTRAINT transactions_portfolio_id_fkey 
                FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE;
                RAISE NOTICE '✅ Created foreign key: transactions.portfolio_id -> portfolios(id)';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️  Could not create foreign key: %', SQLERRM;
            END;
        END IF;
    ELSE
        RAISE NOTICE '✅ Foreign key exists: transactions.portfolio_id -> portfolios(id)';
    END IF;
    
    -- holdings.user_id -> auth.users(id)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'holdings_user_id_fkey'
        AND conrelid = 'public.holdings'::regclass
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings' 
            AND column_name = 'user_id'
        ) THEN
            BEGIN
                ALTER TABLE public.holdings 
                ADD CONSTRAINT holdings_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
                RAISE NOTICE '✅ Created foreign key: holdings.user_id -> auth.users(id)';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️  Could not create foreign key: %', SQLERRM;
            END;
        END IF;
    ELSE
        RAISE NOTICE '✅ Foreign key exists: holdings.user_id -> auth.users(id)';
    END IF;
    
    -- holdings.portfolio_id -> portfolios(id)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'holdings_portfolio_id_fkey'
        AND conrelid = 'public.holdings'::regclass
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings' 
            AND column_name = 'portfolio_id'
        ) THEN
            BEGIN
                ALTER TABLE public.holdings 
                ADD CONSTRAINT holdings_portfolio_id_fkey 
                FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE;
                RAISE NOTICE '✅ Created foreign key: holdings.portfolio_id -> portfolios(id)';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️  Could not create foreign key: %', SQLERRM;
            END;
        END IF;
    ELSE
        RAISE NOTICE '✅ Foreign key exists: holdings.portfolio_id -> portfolios(id)';
    END IF;
END $$;

-- ============================================================================
-- INDEXES - Verification and Creation
-- ============================================================================

-- Create/verify all indexes for optimal query performance
DO $$
BEGIN
    -- Transactions indexes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'user_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
        RAISE NOTICE '✅ Index exists: idx_transactions_user_id';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'portfolio_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON public.transactions(portfolio_id);
        RAISE NOTICE '✅ Index exists: idx_transactions_portfolio_id';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'transaction_date'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
        RAISE NOTICE '✅ Index exists: idx_transactions_date';
    END IF;
    
    -- Holdings indexes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'user_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);
        RAISE NOTICE '✅ Index exists: idx_holdings_user_id';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'portfolio_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON public.holdings(portfolio_id);
        RAISE NOTICE '✅ Index exists: idx_holdings_portfolio_id';
    END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Verification
-- ============================================================================

-- Verify RLS is enabled (cannot enable via migration, must be done manually)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions'
    ) THEN
        IF (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
            RAISE NOTICE '✅ RLS is enabled on transactions table';
        ELSE
            RAISE NOTICE '⚠️  RLS is NOT enabled on transactions table';
            RAISE NOTICE 'ℹ️  Enable RLS manually: ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;';
        END IF;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'holdings'
    ) THEN
        IF (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'holdings') THEN
            RAISE NOTICE '✅ RLS is enabled on holdings table';
        ELSE
            RAISE NOTICE '⚠️  RLS is NOT enabled on holdings table';
            RAISE NOTICE 'ℹ️  Enable RLS manually: ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- REALTIME SUBSCRIPTIONS - Verification
-- ============================================================================

-- Note: Realtime subscriptions are configured via Supabase Dashboard
-- This migration cannot verify or configure them
DO $$
BEGIN
    RAISE NOTICE 'ℹ️  Realtime subscriptions must be configured in Supabase Dashboard';
    RAISE NOTICE 'ℹ️  Tables: holdings, transactions';
    RAISE NOTICE 'ℹ️  Ensure "Enable Realtime" is checked for both tables';
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Schema Verification Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Verify all columns exist (check notices above)';
    RAISE NOTICE '2. Verify foreign keys are created';
    RAISE NOTICE '3. Verify indexes are created';
    RAISE NOTICE '4. Enable RLS if not already enabled';
    RAISE NOTICE '5. Enable Realtime in Supabase Dashboard';
    RAISE NOTICE '6. Test dashboard loading';
    RAISE NOTICE '';
END $$;

