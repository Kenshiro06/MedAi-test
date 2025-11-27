-- ============================================
-- Debug: Check Reports After MO Approval
-- ============================================

-- 1. Check all reports
SELECT 
    id,
    status,
    medical_officer_id,
    pathologist_id,
    submitted_by,
    created_at
FROM reports
ORDER BY created_at DESC;

-- 2. Check pathologist account ID
SELECT id, email, role FROM auth_accounts WHERE role = 'pathologist';

-- 3. If pathologist_id is NULL after MO approval, manually assign:
UPDATE reports 
SET pathologist_id = (SELECT id FROM auth_accounts WHERE email = 'pathologist@medai.com' LIMIT 1)
WHERE pathologist_id IS NULL AND status = 'pending';

-- 4. Verify
SELECT 
    r.id,
    r.status,
    mo.email as medical_officer,
    p.email as pathologist
FROM reports r
LEFT JOIN auth_accounts mo ON r.medical_officer_id = mo.id
LEFT JOIN auth_accounts p ON r.pathologist_id = p.id;
