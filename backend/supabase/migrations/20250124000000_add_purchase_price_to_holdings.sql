-- Add purchase_price column to holdings table if it doesn't exist
-- This fixes the error: column holdings.purchase_price does not exist

DO $$
BEGIN
    -- Check if holdings table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'holdings'
    ) THEN
        -- Add purchase_price column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings' 
            AND column_name = 'purchase_price'
        ) THEN
            -- Add column as nullable first
            ALTER TABLE public.holdings 
            ADD COLUMN purchase_price DECIMAL(15, 2);
            
            RAISE NOTICE '✅ Added purchase_price column to holdings table';
            
            -- If there are existing rows, set purchase_price to current_price or 0
            UPDATE public.holdings 
            SET purchase_price = COALESCE(current_price, 0)
            WHERE purchase_price IS NULL;
            
            -- Make it NOT NULL after populating existing rows (only if no NULLs remain)
            -- Check if there are any NULL values first
            IF NOT EXISTS (SELECT 1 FROM public.holdings WHERE purchase_price IS NULL) THEN
                ALTER TABLE public.holdings 
                ALTER COLUMN purchase_price SET NOT NULL;
                RAISE NOTICE '✅ Set purchase_price to NOT NULL';
            ELSE
                RAISE NOTICE '⚠️  Some holdings have NULL purchase_price - keeping column nullable';
            END IF;
        ELSE
            RAISE NOTICE '✅ purchase_price column already exists in holdings table';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  holdings table does not exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error adding purchase_price column: %', SQLERRM;
        RAISE;
END $$;