-- Diagnostic script for AI Detection issues
-- Run this in Supabase SQL Editor to check system health

-- ============================================
-- 1. CHECK ANALYSES TABLE STRUCTURE
-- ============================================
SELECT '=== ANALYSES TABLE STRUCTURE ===' as section;

SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'analyses' 
ORDER BY ordinal_position;

-- ============================================
-- 2. CHECK RLS POLICIES
-- ============================================
SELECT '=== RLS POLICIES ===' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'analyses';

-- ============================================
-- 3. CHECK AUTH ACCOUNTS
-- ============================================
SELECT '=== AUTH ACCOUNTS ===' as section;

SELECT 
    id,
    email,
    role,
    created_at
FROM auth_accounts
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 4. CHECK RECENT PATIENTS
-- ============================================
SELECT '=== RECENT MALARIA PATIENTS ===' as section;

SELECT 
    id,
    account_id,
    name,
    registration_number,
    age,
    created_at
FROM malaria_patients
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 5. CHECK RECENT ANALYSES
-- ============================================
SELECT '=== RECENT ANALYSES ===' as section;

SELECT 
    a.id,
    a.account_id,
    aa.email as analyzed_by,
    a.patient_type,
    a.patient_id,
    a.ai_result,
    a.confidence_score,
    a.analyzed_at,
    CASE 
        WHEN a.image_paths IS NOT NULL 
        THEN jsonb_array_length(a.image_paths)
        ELSE 0
    END as image_count
FROM analyses a
LEFT JOIN auth_accounts aa ON a.account_id = aa.id
ORDER BY a.analyzed_at DESC
LIMIT 10;

-- ============================================
-- 6. CHECK STORAGE BUCKETS
-- ============================================
SELECT '=== STORAGE BUCKETS ===' as section;

SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE name IN ('malaria-images', 'lepto-images');

-- ============================================
-- 7. TEST INSERT CAPABILITY
-- ============================================
SELECT '=== TESTING INSERT CAPABILITY ===' as section;

DO $$
DECLARE
    test_account_id INT;
    test_patient_id INT;
    test_analysis_id INT;
BEGIN
    -- Get test IDs
    SELECT id INTO test_account_id FROM auth_accounts WHERE role = 'Lab Technician' LIMIT 1;
    SELECT id INTO test_patient_id FROM malaria_patients LIMIT 1;
    
    IF test_account_id IS NULL THEN
        RAISE NOTICE '❌ No Lab Technician account found!';
        RETURN;
    END IF;
    
    IF test_patient_id IS NULL THEN
        RAISE NOTICE '❌ No malaria patients found!';
        RETURN;
    END IF;
    
    -- Try test insert
    BEGIN
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
            'diagnostic_test.jpg',
            '["test1.jpg", "test2.jpg"]'::jsonb,
            'Test - Diagnostic',
            0.99
        ) RETURNING id INTO test_analysis_id;
        
        RAISE NOTICE '✅ Test insert successful! Analysis ID: %', test_analysis_id;
        
        -- Clean up
        DELETE FROM analyses WHERE id = test_analysis_id;
        RAISE NOTICE '✅ Test cleanup successful!';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Test insert failed: %', SQLERRM;
    END;
END $$;

-- ============================================
-- 8. SUMMARY
-- ============================================
SELECT '=== SYSTEM HEALTH SUMMARY ===' as section;

SELECT 
    (SELECT COUNT(*) FROM auth_accounts) as total_accounts,
    (SELECT COUNT(*) FROM auth_accounts WHERE role = 'Lab Technician') as lab_technicians,
    (SELECT COUNT(*) FROM malaria_patients) as total_malaria_patients,
    (SELECT COUNT(*) FROM leptospirosis_patients) as total_lepto_patients,
    (SELECT COUNT(*) FROM analyses) as total_analyses,
    (SELECT COUNT(*) FROM analyses WHERE analyzed_at > NOW() - INTERVAL '1 day') as analyses_today,
    (SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'analyses' AND column_name = 'image_paths'
    )) as has_image_paths_column;

SELECT '=== DIAGNOSTIC COMPLETE ===' as section;
