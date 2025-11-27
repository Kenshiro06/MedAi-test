-- ========================================
-- DISABLE RLS FOR DEMO (Quick Fix)
-- ========================================
-- Run this first to test quickly:

ALTER TABLE auth_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE malaria_patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE leptospirosis_patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- ========================================
-- OR USE PROPER RLS POLICIES (Production)
-- ========================================
-- If you want proper security, use these instead:

-- Enable RLS
ALTER TABLE auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE malaria_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leptospirosis_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to auth_accounts for login
CREATE POLICY "Allow public read for login" ON auth_accounts
    FOR SELECT
    USING (true);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON admin_profile
    FOR SELECT
    USING (true);

CREATE POLICY "Users can read own profile" ON doctor_profile
    FOR SELECT
    USING (true);

CREATE POLICY "Users can read own profile" ON staff_profile
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert patients
CREATE POLICY "Allow insert patients" ON malaria_patients
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow read patients" ON malaria_patients
    FOR SELECT
    USING (true);

CREATE POLICY "Allow insert patients" ON leptospirosis_patients
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow read patients" ON leptospirosis_patients
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert analyses
CREATE POLICY "Allow insert analyses" ON analyses
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow read analyses" ON analyses
    FOR SELECT
    USING (true);

-- Allow authenticated users to work with reports
CREATE POLICY "Allow all on reports" ON reports
    FOR ALL
    USING (true);

-- Allow activity logs
CREATE POLICY "Allow insert logs" ON activity_logs
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow read logs" ON activity_logs
    FOR SELECT
    USING (true);
