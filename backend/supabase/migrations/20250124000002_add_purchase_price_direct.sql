-- Direct SQL to add purchase_price column
-- Run this if the previous migrations didn't work
-- This is the simplest possible approach

-- Step 1: Verify table exists and show current columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'holdings'
ORDER BY ordinal_position;

-- Step 2: Add purchase_price column (will error if already exists, that's fine)
ALTER TABLE public.holdings 
ADD COLUMN purchase_price DECIMAL(15, 2);

-- Step 3: Populate existing rows
UPDATE public.holdings 
SET purchase_price = COALESCE(current_price, 0)
WHERE purchase_price IS NULL;

-- Step 4: Set default
ALTER TABLE public.holdings 
ALTER COLUMN purchase_price SET DEFAULT 0;

-- Step 5: Verify it was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'holdings' 
  AND column_name = 'purchase_price';

-- If Step 5 returns a row, the column exists ✅
-- If Step 2 gives an error "column already exists", that's also ✅
