-- Demo Accounts for Testing
-- Insert these into your Supabase database

-- Admin Account
INSERT INTO auth_accounts (email, password_hash, role, status) 
VALUES ('admin@medai.com', 'admin123', 'admin', 'approved');

-- Doctor Account
INSERT INTO auth_accounts (email, password_hash, role, status) 
VALUES ('doctor@medai.com', 'doctor123', 'doctor', 'approved');

-- Staff Account
INSERT INTO auth_accounts (email, password_hash, role, status) 
VALUES ('staff@medai.com', 'staff123', 'staff', 'approved');

-- Get the account IDs for profile creation
-- After running above, run these to create profiles:

-- Admin Profile (replace account_id with actual ID from auth_accounts)
INSERT INTO admin_profile (account_id, full_name, phone, position)
VALUES (1, 'Admin User', '+60123456789', 'System Administrator');

-- Doctor Profile (replace account_id with actual ID from auth_accounts)
INSERT INTO doctor_profile (account_id, full_name, department, license_no, specialization)
VALUES (2, 'Dr. Sarah Johnson', 'Pathology', 'MD-2024-001', 'Clinical Pathology');

-- Staff Profile (replace account_id with actual ID from auth_accounts)
INSERT INTO staff_profile (account_id, full_name, organization, level)
VALUES (3, 'John Smith', 'General Hospital', 'Senior Lab Technician');
