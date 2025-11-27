-- ========================================
-- COMPLETE SUPABASE SETUP SCRIPT
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Disable RLS for demo/testing
ALTER TABLE IF EXISTS auth_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS doctor_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS malaria_patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leptospirosis_patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_settings DISABLE ROW LEVEL SECURITY;

-- Step 2: Insert Demo Accounts
INSERT INTO auth_accounts (email, password_hash, role, status) VALUES
('admin@medai.com', 'admin123', 'admin', 'approved'),
('doctor@medai.com', 'doctor123', 'doctor', 'approved'),
('staff@medai.com', 'staff123', 'staff', 'approved')
ON CONFLICT (email) DO NOTHING;

-- Step 3: Get account IDs and create profiles
DO $$
DECLARE
    admin_id INT;
    doctor_id INT;
    staff_id INT;
BEGIN
    -- Get IDs
    SELECT id INTO admin_id FROM auth_accounts WHERE email = 'admin@medai.com';
    SELECT id INTO doctor_id FROM auth_accounts WHERE email = 'doctor@medai.com';
    SELECT id INTO staff_id FROM auth_accounts WHERE email = 'staff@medai.com';

    -- Insert profiles
    INSERT INTO admin_profile (account_id, full_name, phone, position) 
    VALUES (admin_id, 'Admin User', '+60123456789', 'System Administrator')
    ON CONFLICT (account_id) DO NOTHING;

    INSERT INTO doctor_profile (account_id, full_name, department, license_no, specialization)
    VALUES (doctor_id, 'Dr. Sarah Johnson', 'Pathology', 'MD-2024-001', 'Clinical Pathology')
    ON CONFLICT (account_id) DO NOTHING;

    INSERT INTO staff_profile (account_id, full_name, organization, level)
    VALUES (staff_id, 'John Smith', 'General Hospital', 'Senior Lab Technician')
    ON CONFLICT (account_id) DO NOTHING;
END $$;

-- Step 4: Verify setup
SELECT 
    a.id,
    a.email,
    a.role,
    a.status,
    CASE 
        WHEN a.role = 'admin' THEN ap.full_name
        WHEN a.role = 'doctor' THEN dp.full_name
        WHEN a.role = 'staff' THEN sp.full_name
    END as full_name
FROM auth_accounts a
LEFT JOIN admin_profile ap ON a.id = ap.account_id
LEFT JOIN doctor_profile dp ON a.id = dp.account_id
LEFT JOIN staff_profile sp ON a.id = sp.account_id
WHERE a.email IN ('admin@medai.com', 'doctor@medai.com', 'staff@medai.com');

-- Success message
SELECT '✅ Setup complete! You can now login with demo accounts.' as message;
