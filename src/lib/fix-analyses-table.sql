-- Fix analyses table for AI detection
-- Run this in Supabase SQL Editor

-- 1. Add image_paths column for multiple images support
ALTER TABLE public.analyses 
ADD COLUMN IF NOT EXISTS image_paths JSONB DEFAULT '[]'::jsonb;

-- 2. Verify the table structure
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'analyses' 
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled and policies exist
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'analyses';

-- 4. Ensure RLS policy allows inserts
DROP POLICY IF EXISTS "Allow all access" ON public.analyses;
CREATE POLICY "Allow all access" ON public.analyses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. Test insert (should work)
DO $$
DECLARE
    test_account_id INT;
    test_patient_id INT;
BEGIN
    -- Get a test account
    SELECT id INTO test_account_id FROM auth_accounts LIMIT 1;
    
    -- Get a test patient
    SELECT id INTO test_patient_id FROM malaria_patients LIMIT 1;
    
    IF test_account_id IS NOT NULL AND test_patient_id IS NOT NULL THEN
        -- Try inserting a test analysis
        INSERT INTO analyses (
            account_id,
            patient_type,
            patient_id,
            image_path,
            image_paths,
            ai_result,
            confidence_score
        ) VALUES (
            test_account_id,
            'malaria',
            test_patient_id,
            'test_image.jpg',
            '["test1.jpg", "test2.jpg"]'::jsonb,
            'Positive - Malaria Detected',
            0.95
        );
        
        RAISE NOTICE 'Test insert successful!';
        
        -- Clean up test data
        DELETE FROM analyses WHERE image_path = 'test_image.jpg';
    ELSE
        RAISE NOTICE 'No test data available. Please ensure auth_accounts and malaria_patients have data.';
    END IF;
END $$;

-- 6. Show recent analyses
SELECT 
    id,
    account_id,
    patient_type,
    patient_id,
    ai_result,
    confidence_score,
    analyzed_at,
    CASE 
        WHEN image_paths IS NOT NULL THEN jsonb_array_length(image_paths)
        ELSE 0
    END as image_count
FROM analyses
ORDER BY analyzed_at DESC
LIMIT 5;

SELECT '✅ Analyses table is ready for AI detection!' as status;
