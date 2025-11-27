-- ============================================
-- MedAI 5-Role System Database Schema
-- ============================================

-- Drop existing tables
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.analyses CASCADE;
DROP TABLE IF EXISTS public.malaria_patients CASCADE;
DROP TABLE IF EXISTS public.leptospirosis_patients CASCADE;
DROP TABLE IF EXISTS public.health_officer_profile CASCADE;
DROP TABLE IF EXISTS public.pathologist_profile CASCADE;
DROP TABLE IF EXISTS public.medical_officer_profile CASCADE;
DROP TABLE IF EXISTS public.lab_technician_profile CASCADE;
DROP TABLE IF EXISTS public.staff_profile CASCADE;
DROP TABLE IF EXISTS public.doctor_profile CASCADE;
DROP TABLE IF EXISTS public.admin_profile CASCADE;
DROP TABLE IF EXISTS public.auth_accounts CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- ============================================
-- 1. Auth Accounts (5 Roles)
-- ============================================
CREATE TABLE public.auth_accounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'lab_technician', 'medical_officer', 'pathologist', 'health_officer')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. Profile Tables (5 Roles)
-- ============================================

-- Admin Profile
CREATE TABLE public.admin_profile (
    id SERIAL PRIMARY KEY,
    account_id INT UNIQUE REFERENCES public.auth_accounts(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    position VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lab Technician Profile
CREATE TABLE public.lab_technician_profile (
    id SERIAL PRIMARY KEY,
    account_id INT UNIQUE REFERENCES public.auth_accounts(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    license_no VARCHAR(255),
    laboratory VARCHAR(255),
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Medical Officer Profile
CREATE TABLE public.medical_officer_profile (
    id SERIAL PRIMARY KEY,
    account_id INT UNIQUE REFERENCES public.auth_accounts(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    license_no VARCHAR(255),
    department VARCHAR(255),
    hospital VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pathologist Profile
CREATE TABLE public.pathologist_profile (
    id SERIAL PRIMARY KEY,
    account_id INT UNIQUE REFERENCES public.auth_accounts(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    license_no VARCHAR(255),
    specialization VARCHAR(255),
    hospital VARCHAR(255),
    years_experience INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Health Officer Profile
CREATE TABLE public.health_officer_profile (
    id SERIAL PRIMARY KEY,
    account_id INT UNIQUE REFERENCES public.auth_accounts(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    district VARCHAR(255),
    state VARCHAR(255),
    department VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. Patient Tables
-- ============================================

CREATE TABLE public.malaria_patients (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    ic_passport VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    age INT,
    collection_datetime TIMESTAMP NOT NULL,
    health_facility VARCHAR(255) NOT NULL,
    slide_number VARCHAR(100) NOT NULL,
    smear_type VARCHAR(10) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.leptospirosis_patients (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    ic_passport VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    age INT,
    collection_datetime TIMESTAMP NOT NULL,
    health_facility VARCHAR(255) NOT NULL,
    slide_number VARCHAR(100) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. Analysis Table
-- ============================================

CREATE TABLE public.analyses (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    patient_type VARCHAR(20) NOT NULL,
    patient_id INT NOT NULL,
    image_path TEXT,
    ai_result VARCHAR(50),
    confidence_score NUMERIC(5,2),
    analyzed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. Reports Table (Multi-Level Approval)
-- ============================================

CREATE TABLE public.reports (
    id SERIAL PRIMARY KEY,
    analysis_id INT UNIQUE REFERENCES public.analyses(id) ON DELETE CASCADE,
    
    -- Submitter (Lab Technician)
    submitted_by INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP DEFAULT NOW(),
    
    -- Medical Officer Review
    medical_officer_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    mo_status VARCHAR(20) CHECK (mo_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    mo_reviewed_at TIMESTAMP,
    mo_notes TEXT,
    
    -- Pathologist Verification (Required for positive cases)
    pathologist_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    pathologist_status VARCHAR(20) CHECK (pathologist_status IN ('pending', 'verified', 'rejected')),
    pathologist_reviewed_at TIMESTAMP,
    pathologist_notes TEXT,
    
    -- Overall Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'mo_review', 'pathologist_review', 'verified', 'rejected', 'needs_revision')),
    
    summary_note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. Activity Logs
-- ============================================

CREATE TABLE public.activity_logs (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. System Settings
-- ============================================

CREATE TABLE public.system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_by INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_analyses_account ON public.analyses(account_id);
CREATE INDEX idx_analyses_patient ON public.analyses(patient_type, patient_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_mo ON public.reports(medical_officer_id);
CREATE INDEX idx_reports_pathologist ON public.reports(pathologist_id);
CREATE INDEX idx_activity_logs_account ON public.activity_logs(account_id);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE public.auth_accounts IS '5-role authentication: admin, lab_technician, medical_officer, pathologist, health_officer';
COMMENT ON TABLE public.reports IS 'Multi-level approval workflow: Lab Tech → Medical Officer → Pathologist';
COMMENT ON COLUMN public.reports.status IS 'pending → mo_review → pathologist_review → verified';
