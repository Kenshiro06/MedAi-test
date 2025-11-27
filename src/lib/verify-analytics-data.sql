-- Verify Analytics Data Quantities
-- Run this in Supabase SQL Editor to check your data

-- 1. Total Samples (All Analyses)
SELECT 
    'Total Samples' as metric,
    COUNT(*) as count
FROM analyses;

-- 2. Positive Cases (All diseases)
SELECT 
    'Positive Cases' as metric,
    COUNT(*) as count
FROM analyses
WHERE ai_result ILIKE '%positive%';

-- 3. Breakdown by Disease Type
SELECT 
    patient_type as disease,
    COUNT(*) as total_analyses,
    COUNT(CASE WHEN ai_result ILIKE '%positive%' THEN 1 END) as positive_cases,
    COUNT(CASE WHEN ai_result ILIKE '%negative%' THEN 1 END) as negative_cases
FROM analyses
GROUP BY patient_type;

-- 4. Pending Reports
SELECT 
    'Pending Reviews' as metric,
    COUNT(*) as count
FROM reports
WHERE status = 'pending';

-- 5. Total Reports Generated
SELECT 
    'Reports Generated' as metric,
    COUNT(*) as count
FROM reports;

-- 6. Reports by Status
SELECT 
    status,
    COUNT(*) as count
FROM reports
GROUP BY status
ORDER BY count DESC;

-- 7. Last 7 Days Analysis Activity
SELECT 
    DATE(analyzed_at) as date,
    COUNT(*) as analyses_count,
    COUNT(CASE WHEN ai_result ILIKE '%positive%' THEN 1 END) as positive_count
FROM analyses
WHERE analyzed_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(analyzed_at)
ORDER BY date DESC;

-- 8. Summary Overview
SELECT 
    (SELECT COUNT(*) FROM analyses) as total_samples,
    (SELECT COUNT(*) FROM analyses WHERE ai_result ILIKE '%positive%') as positive_cases,
    (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reviews,
    (SELECT COUNT(*) FROM reports) as reports_generated,
    (SELECT COUNT(*) FROM analyses WHERE analyzed_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days_analyses;
