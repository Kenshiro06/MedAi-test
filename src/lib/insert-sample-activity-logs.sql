-- Insert Sample Activity Logs
-- Run this AFTER creating the activity_logs table

-- First, let's insert logs for each existing user
-- This will work with whatever users you have in your database

INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'Login',
    'User logged into the system',
    NOW() - INTERVAL '1 hour'
FROM auth_accounts
WHERE role = 'lab_technician'
LIMIT 1;

INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'Analysis Created',
    'Created new malaria analysis',
    NOW() - INTERVAL '45 minutes'
FROM auth_accounts
WHERE role = 'lab_technician'
LIMIT 1;

INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'Report Submitted',
    'Submitted report for Medical Officer review',
    NOW() - INTERVAL '30 minutes'
FROM auth_accounts
WHERE role = 'lab_technician'
LIMIT 1;

INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'Login',
    'User logged into the system',
    NOW() - INTERVAL '25 minutes'
FROM auth_accounts
WHERE role = 'medical_officer'
LIMIT 1;

INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'Report Reviewed',
    'Approved report and forwarded to Pathologist',
    NOW() - INTERVAL '20 minutes'
FROM auth_accounts
WHERE role = 'medical_officer'
LIMIT 1;

INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'Login',
    'User logged into the system',
    NOW() - INTERVAL '15 minutes'
FROM auth_accounts
WHERE role = 'pathologist'
LIMIT 1;

INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'Report Verified',
    'Final verification completed - Report approved',
    NOW() - INTERVAL '10 minutes'
FROM auth_accounts
WHERE role = 'pathologist'
LIMIT 1;

INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'Login',
    'User logged into the system',
    NOW() - INTERVAL '5 minutes'
FROM auth_accounts
WHERE role = 'admin'
LIMIT 1;

INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'Dashboard Viewed',
    'Accessed activity logs dashboard',
    NOW() - INTERVAL '2 minutes'
FROM auth_accounts
WHERE role = 'admin'
LIMIT 1;

INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'System Settings',
    'Viewed user management panel',
    NOW() - INTERVAL '1 minute'
FROM auth_accounts
WHERE role = 'admin'
LIMIT 1;

-- Add some more varied activities
INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'Analysis Deleted',
    'Deleted old analysis record',
    NOW() - INTERVAL '3 hours'
FROM auth_accounts
WHERE role = 'lab_technician'
LIMIT 1;

INSERT INTO activity_logs (user_id, user_email, user_role, action, details, created_at)
SELECT 
    id,
    email,
    role,
    'Report Rejected',
    'Rejected report - needs revision',
    NOW() - INTERVAL '2 hours'
FROM auth_accounts
WHERE role = 'medical_officer'
LIMIT 1;

-- Success message
SELECT 'Sample activity logs inserted successfully!' as message,
       COUNT(*) as total_logs
FROM activity_logs;
