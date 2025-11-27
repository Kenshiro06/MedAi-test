-- ============================================
-- Check Reports Status
-- ============================================

-- 1. Check if there are any reports
SELECT 
    r.id,
    r.status,
    r.medical_officer_id,
    r.pathologist_id,
    r.mo_status,
    r.pathologist_status,
    a.email as submitted_by_email,
    mo.email as medical_officer_email
FROM reports r
LEFT JOIN auth_accounts a ON r.submitted_by = a.id
LEFT JOIN auth_accounts mo ON r.medical_officer_id = mo.id
ORDER BY r.created_at DESC;

-- 2. Check Medical Officer accounts
SELECT id, email, role, status 
FROM auth_accounts 
WHERE role = 'medical_officer';

-- 3. If no reports exist, you need to:
--    a) Login as Lab Technician
--    b) Go to AI Detector
--    c) Upload an image and analyze
--    d) Go to Submit Report
--    e) Select the analysis and assign to Medical Officer
--    f) Click Submit

-- 4. If reports exist but medical_officer_id is NULL, update them:
-- UPDATE reports 
-- SET medical_officer_id = (SELECT id FROM auth_accounts WHERE email = 'mo@medai.com' LIMIT 1),
--     status = 'mo_review',
--     mo_status = 'pending'
-- WHERE medical_officer_id IS NULL;
