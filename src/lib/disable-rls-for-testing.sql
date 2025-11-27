-- ============================================
-- DISABLE RLS FOR TESTING (Development Only!)
-- ============================================
-- WARNING: Only use this in development/testing
-- Re-enable RLS for production!

-- Disable RLS on all tables to allow testing
ALTER TABLE public.auth_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_technician_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_officer_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathologist_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_officer_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.malaria_patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leptospirosis_patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'auth_accounts', 
    'malaria_patients', 
    'leptospirosis_patients', 
    'analyses', 
    'reports'
)
ORDER BY tablename;

-- Expected result: rowsecurity = false for all tables
