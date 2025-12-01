-- FINAL FIX: Grant permissions to anon role to remove 406 error
-- Run this in Supabase SQL Editor

-- 1. Disable RLS on all tables (if not already done)
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE malaria_patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE leptospirosis_patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE lab_technician_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_officer_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE pathologist_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE health_officer_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profile DISABLE ROW LEVEL SECURITY;

-- 2. Grant ALL permissions to anon role (this is what's missing!)
GRANT ALL ON reports TO anon, authenticated;
GRANT ALL ON analyses TO anon, authenticated;
GRANT ALL ON activity_logs TO anon, authenticated;
GRANT ALL ON user_settings TO anon, authenticated;
GRANT ALL ON auth_accounts TO anon, authenticated;
GRANT ALL ON malaria_patients TO anon, authenticated;
GRANT ALL ON leptospirosis_patients TO anon, authenticated;
GRANT ALL ON lab_technician_profile TO anon, authenticated;
GRANT ALL ON medical_officer_profile TO anon, authenticated;
GRANT ALL ON pathologist_profile TO anon, authenticated;
GRANT ALL ON health_officer_profile TO anon, authenticated;
GRANT ALL ON admin_profile TO anon, authenticated;
GRANT ALL ON dashboard_summary TO anon, authenticated;
GRANT ALL ON system_settings TO anon, authenticated;

-- 3. Grant sequence permissions (needed for INSERT)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. Verify permissions
SELECT 
    table_name,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) as permissions
FROM information_schema.role_table_grants
WHERE grantee IN ('anon', 'authenticated')
    AND table_schema = 'public'
    AND table_name IN ('reports', 'analyses', 'user_settings', 'auth_accounts')
GROUP BY table_name
ORDER BY table_name;

-- 5. Test query as anon (this should work now)
SET ROLE anon;
SELECT 'SUCCESS! Anon can query reports' as message, COUNT(*) as count FROM reports;
SELECT 'SUCCESS! Anon can query analyses' as message, COUNT(*) as count FROM analyses;
RESET ROLE;

-- Expected output:
-- ✅ All tables show: SELECT, INSERT, UPDATE, DELETE permissions
-- ✅ Test queries return success messages
-- ✅ 406 error will disappear after this!
