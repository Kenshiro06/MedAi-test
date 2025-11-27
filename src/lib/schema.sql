-- Drop existing tables if they exist (to ensure clean slate)
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.analyses CASCADE;
DROP TABLE IF EXISTS public.malaria_patients CASCADE;
DROP TABLE IF EXISTS public.leptospirosis_patients CASCADE;
DROP TABLE IF EXISTS public.staff_profile CASCADE;
DROP TABLE IF EXISTS public.doctor_profile CASCADE;
DROP TABLE IF EXISTS public.admin_profile CASCADE;
DROP TABLE IF EXISTS public.auth_accounts CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- 1. Auth Accounts
CREATE TABLE public.auth_accounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL,   -- admin / doctor / staff
    status VARCHAR(20) DEFAULT 'pending', -- pending / approved
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Profiles
CREATE TABLE public.admin_profile (
    id SERIAL PRIMARY KEY,
    account_id INT UNIQUE REFERENCES public.auth_accounts(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    position VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.doctor_profile (
    id SERIAL PRIMARY KEY,
    account_id INT UNIQUE REFERENCES public.auth_accounts(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    license_no VARCHAR(255),
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.staff_profile (
    id SERIAL PRIMARY KEY,
    account_id INT UNIQUE REFERENCES public.auth_accounts(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Patients
CREATE TABLE public.malaria_patients (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL, -- who uploaded
    name VARCHAR(255) NOT NULL,                                     -- patient name
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    ic_passport VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    age INT,
    collection_datetime TIMESTAMP NOT NULL,
    health_facility VARCHAR(255) NOT NULL,
    slide_number VARCHAR(100) NOT NULL,
    smear_type VARCHAR(10) NOT NULL, -- thick/thin
    image_url TEXT,                  -- Supabase Storage link
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.leptospirosis_patients (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL, -- who uploaded
    name VARCHAR(255) NOT NULL,                                     -- patient name
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    ic_passport VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    age INT,
    collection_datetime TIMESTAMP NOT NULL,
    health_facility VARCHAR(255) NOT NULL,
    slide_number VARCHAR(100) NOT NULL,
    image_url TEXT,                  -- Supabase Storage link
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Analysis & Reports
CREATE TABLE public.analyses (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,  -- who uploaded/analyzed

    patient_type VARCHAR(20) NOT NULL,  -- malaria / leptospirosis
    patient_id INT NOT NULL,            -- points to correct table (dynamic)

    image_path TEXT,                    -- Supabase Storage URL
    ai_result VARCHAR(50),
    confidence_score NUMERIC(5,2),
    analyzed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.reports (
    id SERIAL PRIMARY KEY,
    analysis_id INT REFERENCES public.analyses(id) ON DELETE CASCADE,

    submitted_by INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',   -- pending / approved / rejected

    reviewed_by INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,

    summary_note TEXT,
    report_file_path TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Logs & Settings
CREATE TABLE public.activity_logs (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    action_type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.malaria_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leptospirosis_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create simple "Allow All" policies for development
-- In production, these should be restricted based on auth.uid()
CREATE POLICY "Allow all access" ON public.auth_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.admin_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.doctor_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.staff_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.malaria_patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.leptospirosis_patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- =========================
-- VIEWS FOR DASHBOARD
-- =========================

-- View: Analyses with Patient Names
CREATE OR REPLACE VIEW analyses_with_patient AS
SELECT 
    a.id AS analysis_id,
    a.patient_type,
    CASE 
        WHEN a.patient_type='malaria' THEN mp.name
        WHEN a.patient_type='leptospirosis' THEN lp.name
    END AS patient_name,
    a.ai_result,
    a.confidence_score,
    a.analyzed_at,
    au.email AS analyzed_by,
    au.role AS analyzer_role
FROM analyses a
LEFT JOIN malaria_patients mp ON a.patient_type='malaria' AND a.patient_id = mp.id
LEFT JOIN leptospirosis_patients lp ON a.patient_type='leptospirosis' AND a.patient_id = lp.id
LEFT JOIN auth_accounts au ON a.account_id = au.id;

-- View: Dashboard Statistics
CREATE OR REPLACE VIEW dashboard AS
SELECT 
    COUNT(*) AS total_analyses,
    COUNT(*) FILTER (WHERE ai_result = 'positive') AS total_positive,
    COUNT(*) FILTER (WHERE ai_result = 'negative') AS total_negative,
    COUNT(*) FILTER (WHERE patient_type = 'malaria') AS total_malaria,
    COUNT(*) FILTER (WHERE patient_type = 'leptospirosis') AS total_leptospirosis,
    MAX(analyzed_at) AS last_analyzed_at
FROM analyses;

-- =========================
-- INSERT DEMO ACCOUNTS
-- =========================

-- Insert demo accounts
INSERT INTO auth_accounts (email, password_hash, role, status) VALUES
('admin@medai.com', 'admin123', 'admin', 'approved'),
('doctor@medai.com', 'doctor123', 'doctor', 'approved'),
('staff@medai.com', 'staff123', 'staff', 'approved')
ON CONFLICT (email) DO NOTHING;

-- Create profiles for demo accounts
DO $$
DECLARE
    admin_id INT;
    doctor_id INT;
    staff_id INT;
BEGIN
    -- Get account IDs
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

-- =========================
-- INSERT SAMPLE DATA (Optional)
-- =========================

-- Sample Malaria Patient
DO $$
DECLARE
    staff_account_id INT;
BEGIN
    SELECT id INTO staff_account_id FROM auth_accounts WHERE email = 'staff@medai.com';
    
    INSERT INTO malaria_patients (account_id, name, registration_number, ic_passport, gender, age, collection_datetime, health_facility, slide_number, smear_type)
    VALUES (staff_account_id, 'Ahmad bin Ali', 'MAL-2024-001', '920101-01-1234', 'Male', 32, NOW() - INTERVAL '2 days', 'General Hospital KL', 'SLD-001', 'thick')
    ON CONFLICT (registration_number) DO NOTHING;
END $$;

-- Sample Leptospirosis Patient
DO $$
DECLARE
    staff_account_id INT;
BEGIN
    SELECT id INTO staff_account_id FROM auth_accounts WHERE email = 'staff@medai.com';
    
    INSERT INTO leptospirosis_patients (account_id, name, registration_number, ic_passport, gender, age, collection_datetime, health_facility, slide_number)
    VALUES (staff_account_id, 'Siti binti Hassan', 'LEPTO-2024-001', '880505-02-5678', 'Female', 36, NOW() - INTERVAL '1

-- Sample Analysis (link to malaria patient)
DO $$
DECLARE
    staff_account_id INT;
    malaria_patient_id INT;
BEGIN
    SELECT id INTO staff_account_id FROM auth_accounts WHERE email = 'staff@medai.com';
    SELECT id INTO malaria_patient_id FROM malaria_patients WHERE registration_number = 'MAL-2024-001';
    
    INSERT INTO analyses (account_id, patient_type, patient_id, ai_result, confidence_score, wbc_count, parasite_count)
    VALUES (staff_account_id, 'malaria', malaria_patient_id, 'positive', 95.5, 8500, 120);
END $$;

-- =========================
-- VERIFICATION
-- =========================

-- Verify demo accounts
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
SELECT '✅ Database setup complete! Demo accounts ready.' as message;
