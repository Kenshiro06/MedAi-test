-- ============================================
-- Demo Accounts for 5-Role System
-- Password for all: password123
-- ============================================

-- Insert demo accounts (all approved)
INSERT INTO public.auth_accounts (email, password_hash, role, status) VALUES
('admin@medai.com', '$2a$10$rZ5qH8vK9xJ2yL3mN4pQ6.eX7wT8vU9sA1bC2dE3fG4hI5jK6lM7n', 'admin', 'approved'),
('technician@medai.com', '$2a$10$rZ5qH8vK9xJ2yL3mN4pQ6.eX7wT8vU9sA1bC2dE3fG4hI5jK6lM7n', 'lab_technician', 'approved'),
('mo@medai.com', '$2a$10$rZ5qH8vK9xJ2yL3mN4pQ6.eX7wT8vU9sA1bC2dE3fG4hI5jK6lM7n', 'medical_officer', 'approved'),
('pathologist@medai.com', '$2a$10$rZ5qH8vK9xJ2yL3mN4pQ6.eX7wT8vU9sA1bC2dE3fG4hI5jK6lM7n', 'pathologist', 'approved'),
('health@medai.com', '$2a$10$rZ5qH8vK9xJ2yL3mN4pQ6.eX7wT8vU9sA1bC2dE3fG4hI5jK6lM7n', 'health_officer', 'approved');

-- Insert profiles
INSERT INTO public.admin_profile (account_id, full_name, phone, position) VALUES
(1, 'Admin User', '+60123456789', 'System Administrator');

INSERT INTO public.lab_technician_profile (account_id, full_name, license_no, laboratory, specialization) VALUES
(2, 'John Technician', 'LT-2024-001', 'Central Laboratory KL', 'Hematology');

INSERT INTO public.medical_officer_profile (account_id, full_name, license_no, department, hospital) VALUES
(3, 'Dr. Sarah Medical', 'MO-2024-001', 'Pathology Department', 'General Hospital KL');

INSERT INTO public.pathologist_profile (account_id, full_name, license_no, specialization, hospital, years_experience) VALUES
(4, 'Dr. Ahmad Pathologist', 'PATH-2024-001', 'Clinical Pathology', 'General Hospital KL', 15);

INSERT INTO public.health_officer_profile (account_id, full_name, district, state, department) VALUES
(5, 'Officer Health', 'Kuala Lumpur', 'Federal Territory', 'Disease Control Division');

-- ============================================
-- Demo Login Credentials
-- ============================================
-- Email: admin@medai.com | Password: password123 | Role: Admin
-- Email: technician@medai.com | Password: password123 | Role: Lab Technician
-- Email: mo@medai.com | Password: password123 | Role: Medical Officer
-- Email: pathologist@medai.com | Password: password123 | Role: Pathologist
-- Email: health@medai.com | Password: password123 | Role: Health Officer
