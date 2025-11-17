-- Fix Transactions Table - Ensure All Required Columns Exist
-- This migration ensures all columns used by the frontend exist in the transactions table
-- Idempotent: Safe to run multiple times

-- 1. Ensure transaction_date column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        -- Add transaction_date if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'transaction_date'
        ) THEN
            ALTER TABLE public.transactions 
            ADD COLUMN transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            
            -- Update existing rows that might have NULL transaction_date
            UPDATE public.transactions 
            SET transaction_date = COALESCE(transaction_date, created_at, NOW())
            WHERE transaction_date IS NULL;
            
            -- Create index if it doesn't exist
            CREATE INDEX IF NOT EXISTS idx_transactions_date 
            ON public.transactions(transaction_date);
            
            RAISE NOTICE '✅ Added transaction_date column to transactions table';
        ELSE
            RAISE NOTICE '✅ transaction_date column already exists in transactions table';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  transactions table does not exist';
    END IF;
END $$;

-- 2. Ensure transaction_type column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'transaction_type'
        ) THEN
            ALTER TABLE public.transactions 
            ADD COLUMN transaction_type TEXT 
            CHECK (transaction_type IN ('buy', 'sell', 'deposit', 'withdrawal'));
            
            RAISE NOTICE '✅ Added transaction_type column to transactions table';
        ELSE
            RAISE NOTICE '✅ transaction_type column already exists in transactions table';
        END IF;
    END IF;
END $$;

-- 3. Ensure total_amount column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'total_amount'
        ) THEN
            ALTER TABLE public.transactions 
            ADD COLUMN total_amount DECIMAL(15, 2);
            
            RAISE NOTICE '✅ Added total_amount column to transactions table';
        ELSE
            RAISE NOTICE '✅ total_amount column already exists in transactions table';
        END IF;
    END IF;
END $$;

-- 4. Ensure symbol column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'symbol'
        ) THEN
            ALTER TABLE public.transactions 
            ADD COLUMN symbol TEXT;
            
            RAISE NOTICE '✅ Added symbol column to transactions table';
        ELSE
            RAISE NOTICE '✅ symbol column already exists in transactions table';
        END IF;
    END IF;
END $$;

-- 5. Ensure shares column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'shares'
        ) THEN
            ALTER TABLE public.transactions 
            ADD COLUMN shares DECIMAL(15, 6);
            
            RAISE NOTICE '✅ Added shares column to transactions table';
        ELSE
            RAISE NOTICE '✅ shares column already exists in transactions table';
        END IF;
    END IF;
END $$;

-- 6. Ensure price column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'price'
        ) THEN
            ALTER TABLE public.transactions 
            ADD COLUMN price DECIMAL(15, 2);
            
            RAISE NOTICE '✅ Added price column to transactions table';
        ELSE
            RAISE NOTICE '✅ price column already exists in transactions table';
        END IF;
    END IF;
END $$;

-- 7. Ensure fees column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'fees'
        ) THEN
            ALTER TABLE public.transactions 
            ADD COLUMN fees DECIMAL(15, 2) DEFAULT 0;
            
            -- Set default for existing rows
            UPDATE public.transactions 
            SET fees = COALESCE(fees, 0)
            WHERE fees IS NULL;
            
            RAISE NOTICE '✅ Added fees column to transactions table';
        ELSE
            RAISE NOTICE '✅ fees column already exists in transactions table';
        END IF;
    END IF;
END $$;

-- 8. Ensure notes column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'notes'
        ) THEN
            ALTER TABLE public.transactions 
            ADD COLUMN notes TEXT;
            
            RAISE NOTICE '✅ Added notes column to transactions table';
        ELSE
            RAISE NOTICE '✅ notes column already exists in transactions table';
        END IF;
    END IF;
END $$;

-- 9. Ensure metadata column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'metadata'
        ) THEN
            ALTER TABLE public.transactions 
            ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
            
            -- Set default for existing rows
            UPDATE public.transactions 
            SET metadata = COALESCE(metadata, '{}'::jsonb)
            WHERE metadata IS NULL;
            
            RAISE NOTICE '✅ Added metadata column to transactions table';
        ELSE
            RAISE NOTICE '✅ metadata column already exists in transactions table';
        END IF;
    END IF;
END $$;

-- 10. Ensure user_id column exists (from previous migration, but double-check)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'user_id'
        ) THEN
            -- Add user_id if missing
            IF EXISTS (SELECT 1 FROM public.transactions LIMIT 1) THEN
                ALTER TABLE public.transactions ADD COLUMN user_id UUID;
                
                -- Populate from portfolios
                UPDATE public.transactions t
                SET user_id = p.user_id
                FROM public.portfolios p
                WHERE t.portfolio_id = p.id
                AND t.user_id IS NULL;
                
                -- Make NOT NULL if all rows updated
                IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE user_id IS NULL) THEN
                    ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL;
                    ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey 
                        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
                END IF;
            ELSE
                ALTER TABLE public.transactions 
                ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;
            END IF;
            
            -- Create index
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
            ON public.transactions(user_id);
            
            RAISE NOTICE '✅ Added user_id column to transactions table';
        ELSE
            RAISE NOTICE '✅ user_id column already exists in transactions table';
        END IF;
    END IF;
END $$;

-- 11. Ensure portfolio_id column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transactions'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'transactions' 
            AND column_name = 'portfolio_id'
        ) THEN
            ALTER TABLE public.transactions 
            ADD COLUMN portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE;
            
            -- Create index
            CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id 
            ON public.transactions(portfolio_id);
            
            RAISE NOTICE '✅ Added portfolio_id column to transactions table';
        ELSE
            RAISE NOTICE '✅ portfolio_id column already exists in transactions table';
        END IF;
    END IF;
END $$;

-- 12. Create/verify all indexes
DO $$
BEGIN
    -- transaction_date index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'transaction_date'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_transactions_date 
        ON public.transactions(transaction_date);
    END IF;
    
    -- user_id index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'user_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
        ON public.transactions(user_id);
    END IF;
    
    -- portfolio_id index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'portfolio_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id 
        ON public.transactions(portfolio_id);
    END IF;
END $$;

-- 13. Calculate total_amount from shares * price for rows where it's NULL (after all columns exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'total_amount'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'shares'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'price'
    ) THEN
        -- Calculate total_amount from shares * price if available and total_amount is NULL
        UPDATE public.transactions 
        SET total_amount = COALESCE(
            total_amount,
            CASE 
                WHEN shares IS NOT NULL AND price IS NOT NULL THEN shares * price
                ELSE 0
            END
        )
        WHERE total_amount IS NULL;
        
        RAISE NOTICE '✅ Updated total_amount for existing transactions';
    END IF;
END $$;

-- Comments for documentation
COMMENT ON COLUMN public.transactions.transaction_date IS 'Date and time of the transaction';
COMMENT ON COLUMN public.transactions.transaction_type IS 'Type of transaction: buy, sell, deposit, or withdrawal';
COMMENT ON COLUMN public.transactions.total_amount IS 'Total amount of the transaction (negative for buys, positive for sells)';
COMMENT ON COLUMN public.transactions.symbol IS 'Stock symbol or asset identifier';
COMMENT ON COLUMN public.transactions.user_id IS 'User who owns this transaction (for RLS)';

