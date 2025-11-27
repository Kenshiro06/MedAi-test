-- ============================================
-- FIX: Allow Login Without Authentication
-- ============================================

-- Disable RLS temporarily for auth_accounts to allow login
ALTER TABLE public.auth_accounts DISABLE ROW LEVEL SECURITY;

-- Or create a policy that allows SELECT for login
DROP POLICY IF EXISTS "Allow login query" ON public.auth_accounts;

CREATE POLICY "Allow login query"
ON public.auth_accounts FOR SELECT
USING (true);  -- Allow anyone to query for login

-- Also ensure profiles can be read
ALTER TABLE public.lab_technician_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_officer_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathologist_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_officer_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profile DISABLE ROW LEVEL SECURITY;

-- Allow reading profiles
CREATE POLICY "Allow read lab_technician_profile" ON public.lab_technician_profile FOR SELECT USING (true);
CREATE POLICY "Allow read medical_officer_profile" ON public.medical_officer_profile FOR SELECT USING (true);
CREATE POLICY "Allow read pathologist_profile" ON public.pathologist_profile FOR SELECT USING (true);
CREATE POLICY "Allow read health_officer_profile" ON public.health_officer_profile FOR SELECT USING (true);
CREATE POLICY "Allow read admin_profile" ON public.admin_profile FOR SELECT USING (true);

-- Verify the demo accounts exist
SELECT id, email, role, status FROM public.auth_accounts;
