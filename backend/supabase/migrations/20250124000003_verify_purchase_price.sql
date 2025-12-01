-- Verify purchase_price column exists and show table structure
-- Run this to confirm the column was added successfully

-- Show all columns in holdings table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'holdings'
ORDER BY ordinal_position;

-- Specifically check for purchase_price
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'holdings' 
            AND column_name = 'purchase_price'
        ) THEN '✅ purchase_price column EXISTS'
        ELSE '❌ purchase_price column DOES NOT EXIST'
    END AS verification_status;

-- If column exists, show sample data (if any)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'holdings' 
        AND column_name = 'purchase_price'
    ) THEN
        RAISE NOTICE '✅ purchase_price column verified!';
        RAISE NOTICE 'Sample data (first 5 rows):';
        -- This will show sample data if any exists
        PERFORM * FROM (
            SELECT id, symbol, shares, purchase_price, current_price 
            FROM public.holdings 
            LIMIT 5
        ) AS sample;
    ELSE
        RAISE NOTICE '❌ purchase_price column NOT FOUND';
        RAISE NOTICE 'Please run the migration to add it.';
    END IF;
END $$;
