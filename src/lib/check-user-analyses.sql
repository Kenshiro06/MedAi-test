-- Check if Health Officer has personal analyses
-- Replace USER_ID with actual health officer account ID

-- 1. Find Health Officer account ID
SELECT 
    a.id as account_id,
    a.email,
    a.role,
    h.full_name
FROM auth_accounts a
LEFT JOIN health_officer_profile h ON h.account_id = a.id
WHERE a.role = 'health_officer';

-- 2. Check analyses for specific user (replace 5 with actual account_id)
SELECT 
    id,
    account_id,
    patient_type,
    ai_result,
    confidence_score,
    analyzed_at
FROM analyses
WHERE account_id = 5  -- Replace with health officer account_id
ORDER BY analyzed_at DESC
LIMIT 10;

-- 3. Count analyses per user
SELECT 
    a.account_id,
    aa.email,
    aa.role,
    COUNT(*) as analysis_count
FROM analyses a
JOIN auth_accounts aa ON aa.id = a.account_id
GROUP BY a.account_id, aa.email, aa.role
ORDER BY analysis_count DESC;

-- 4. If no analyses, create a test one for health officer
-- INSERT INTO analyses (account_id, patient_type, patient_id, ai_result, confidence_score)
-- VALUES (5, 'malaria', 1, 'Positive - Plasmodium detected', 0.95);
