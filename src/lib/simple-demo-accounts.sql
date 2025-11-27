-- ============================================
-- Simple Demo Accounts (Plain Text Passwords)
-- ============================================

-- First, disable RLS on auth_accounts to allow login
ALTER TABLE public.auth_accounts DISABLE ROW LEVEL SECURITY;

-- Delete existing demo accounts if any
DELETE FROM public.auth_accounts WHERE email LIKE '%@medai.com';

-- Insert demo accounts with PLAIN TEXT passwords (for testing)
-- In production, you should hash these!
INSERT INTO public.auth_accounts (email, password_hash, role, status) VALUES
('admin@medai.com', 'password123', 'admin', 'approved'),
('technician@medai.com', 'password123', 'lab_technician', 'approved'),
('mo@medai.com', 'password123', 'medical_officer', 'approved'),
('pathologist@medai.com', 'password123', 'pathologist', 'approved'),
('health@medai.com', 'password123', 'health_officer', 'approved');

-- Insert profiles
INSERT INTO public.admin_profile (account_id, full_name, phone, position) 
SELECT id, 'Admin User', '+60123456789', 'System Administrator' 
FROM public.auth_accounts WHERE email = 'admin@medai.com';

INSERT INTO public.lab_technician_profile (account_id, full_name, license_no, laboratory, specialization) 
SELECT id, 'John Technician', 'LT-2024-001', 'Central Laboratory KL', 'Hematology' 
FROM public.auth_accounts WHERE email = 'technician@medai.com';

INSERT INTO public.medical_officer_profile (account_id, full_name, license_no, department, hospital) 
SELECT id, 'Dr. Sarah Medical', 'MO-2024-001', 'Pathology Department', 'General Hospital KL' 
FROM public.auth_accounts WHERE email = 'mo@medai.com';

INSERT INTO public.pathologist_profile (account_id, full_name, license_no, specialization, hospital, years_experience) 
SELECT id, 'Dr. Ahmad Pathologist', 'PATH-2024-001', 'Clinical Pathology', 'General Hospital KL', 15 
FROM public.auth_accounts WHERE email = 'pathologist@medai.com';

INSERT INTO public.health_officer_profile (account_id, full_name, district, state, department) 
SELECT id, 'Officer Health', 'Kuala Lumpur', 'Federal Territory', 'Disease Control Division' 
FROM public.auth_accounts WHERE email = 'health@medai.com';

-- Verify accounts were created
SELECT id, email, role, status FROM public.auth_accounts WHERE email LIKE '%@medai.com';

-- ============================================
-- Demo Login Credentials
-- ============================================
-- Email: admin@medai.com | Password: password123
-- Email: technician@medai.com | Password: password123
-- Email: mo@medai.com | Password: password123
-- Email: pathologist@medai.com | Password: password123
-- Email: health@medai.com | Password: password123
