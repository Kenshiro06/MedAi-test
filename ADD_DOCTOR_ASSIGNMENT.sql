-- Add doctor assignment feature to reports table
-- Run this in Supabase SQL Editor

-- 1. Add assigned_doctor_id column to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS assigned_doctor_id INT REFERENCES auth_accounts(id);

-- 2. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_assigned_doctor ON reports(assigned_doctor_id);

-- 3. Create some demo doctor accounts (if you don't have them yet)
-- Doctor 1: Malaria Specialist (Password: doctor123)
INSERT INTO auth_accounts (email, password_hash, role, status)
VALUES ('dr.sarah@hospital.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', 'approved')
ON CONFLICT (email) DO NOTHING;

INSERT INTO doctor_profile (account_id, full_name, department, specialization)
SELECT id, 'Dr. Sarah Johnson', 'Infectious Diseases', 'Malaria Specialist'
FROM auth_accounts WHERE email = 'dr.sarah@hospital.com'
ON CONFLICT (account_id) DO NOTHING;

-- Doctor 2: Leptospirosis Specialist  
INSERT INTO auth_accounts (email, password_hash, role, status)
VALUES ('dr.michael@hospital.com', '$2a$10$dummyhash2', 'doctor', 'approved')
ON CONFLICT (email) DO NOTHING;

INSERT INTO doctor_profile (account_id, full_name, department, specialization)
SELECT id, 'Dr. Michael Chen', 'Tropical Medicine', 'Leptospirosis Specialist'
FROM auth_accounts WHERE email = 'dr.michael@hospital.com'
ON CONFLICT (account_id) DO NOTHING;

-- Doctor 3: General Specialist
INSERT INTO auth_accounts (email, password_hash, role, status)
VALUES ('dr.emily@hospital.com', '$2a$10$dummyhash3', 'doctor', 'approved')
ON CONFLICT (email) DO NOTHING;

INSERT INTO doctor_profile (account_id, full_name, department, specialization)
SELECT id, 'Dr. Emily Brown', 'General Medicine', 'General Practitioner'
FROM auth_accounts WHERE email = 'dr.emily@hospital.com'
ON CONFLICT (account_id) DO NOTHING;

-- Done! Now staff can assign reports to specific doctors
