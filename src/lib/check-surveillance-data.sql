-- Check Surveillance Dashboard Data
-- Run this in Supabase SQL Editor to verify you have approved reports

-- 1. Check total reports by status
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM reports
GROUP BY status;

-- 2. Check approved reports with pathologist review dates
SELECT 
    id,
    status,
    submitted_at,
    mo_reviewed_at,
    pathologist_reviewed_at,
    EXTRACT(EPOCH FROM (pathologist_reviewed_at - submitted_at))/3600 as approval_hours
FROM reports
WHERE status = 'approved'
AND pathologist_reviewed_at IS NOT NULL
ORDER BY pathologist_reviewed_at DESC
LIMIT 10;

-- 3. Check if you have any approved reports in last 30 days
SELECT COUNT(*) as approved_last_30_days
FROM reports
WHERE status = 'approved'
AND pathologist_reviewed_at >= NOW() - INTERVAL '30 days';

-- 4. Check if you have any approved reports at all
SELECT COUNT(*) as total_approved
FROM reports
WHERE status = 'approved';

-- 5. If no approved reports, check what you have
SELECT 
    status,
    COUNT(*) as count,
    STRING_AGG(DISTINCT 
        CASE 
            WHEN pathologist_reviewed_at IS NULL THEN 'No pathologist review'
            ELSE 'Has pathologist review'
        END, ', ') as review_status
FROM reports
GROUP BY status;

-- 6. Sample of reports that need approval
SELECT 
    id,
    status,
    submitted_by,
    medical_officer_id,
    pathologist_id,
    mo_reviewed_at,
    pathologist_reviewed_at
FROM reports
WHERE status != 'approved'
LIMIT 5;
