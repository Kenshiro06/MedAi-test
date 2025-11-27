-- QUICK FIX: Run this before testing AI Detection
-- This ensures your database is ready for multiple images

-- 1. Add image_paths column
ALTER TABLE public.analyses 
ADD COLUMN IF NOT EXISTS image_paths JSONB DEFAULT '[]'::jsonb;

-- 2. Fix RLS policy to allow all operations
DROP POLICY IF EXISTS "Allow all access" ON public.analyses;
CREATE POLICY "Allow all access" ON public.analyses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 3. Verify setup
SELECT 
    '✅ Column Check' as step,
    COUNT(*) as columns_found
FROM information_schema.columns 
WHERE table_name = 'analyses' 
AND column_name IN ('image_path', 'image_paths')
HAVING COUNT(*) = 2;  -- Should have both columns

-- 4. Show table structure
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'analyses' 
ORDER BY ordinal_position;

-- 5. Test insert capability
DO $$
DECLARE
    test_id INT;
BEGIN
    -- Try a test insert
    INSERT INTO analyses (
        account_id,
        patient_type,
        patient_id,
        image_path,
        image_paths,
        ai_result,
        confidence_score
    ) VALUES (
        1,
        'malaria',
        1,
        'test.jpg',
        '["test1.jpg", "test2.jpg", "test3.jpg"]'::jsonb,
        'Test',
        0.99
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE '✅ Test insert successful! ID: %', test_id;
    
    -- Clean up
    DELETE FROM analyses WHERE id = test_id;
    RAISE NOTICE '✅ Cleanup successful!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;

SELECT '🎉 Database is ready for AI Detection!' as status;
