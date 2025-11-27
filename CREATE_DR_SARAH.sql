-- Quick script to create Dr. Sarah Johnson account
-- Run this in Supabase SQL Editor

-- 1. Create Dr. Sarah's account (Password: doctor123)
INSERT INTO auth_accounts (email, password_hash, role, status)
VALUES ('dr.sarah@hospital.com', 'doctor123', 'doctor', 'approved')
ON CONFLICT (email) DO UPDATE SET
    password_hash = 'doctor123',
    role = 'doctor',
    status = 'approved';

-- 2. Create Dr. Sarah's profile
INSERT INTO doctor_profile (account_id, full_name, department, specialization)
SELECT id, 'Dr. Sarah Johnson', 'Infectious Diseases', 'Malaria Specialist'
FROM auth_accounts WHERE email = 'dr.sarah@hospital.com'
ON CONFLICT (account_id) DO UPDATE SET
    full_name = 'Dr. Sarah Johnson',
    department = 'Infectious Diseases',
    specialization = 'Malaria Specialist';

-- Done! Now you can login with:
-- Email: dr.sarah@hospital.com
-- Password: doctor123
