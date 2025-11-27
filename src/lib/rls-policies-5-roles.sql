-- ============================================
-- Row Level Security Policies (5-Role System)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_technician_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_officer_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathologist_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_officer_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.malaria_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leptospirosis_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Auth Accounts Policies
-- ============================================

-- Everyone can read their own account
CREATE POLICY "Users can view own account"
ON public.auth_accounts FOR SELECT
USING (auth.uid()::text = id::text);

-- Admin can view all accounts
CREATE POLICY "Admin can view all accounts"
ON public.auth_accounts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.auth_accounts
        WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- ============================================
-- Profile Policies (All 5 Roles)
-- ============================================

-- Lab Technician Profile
CREATE POLICY "Lab technicians can view own profile"
ON public.lab_technician_profile FOR ALL
USING (account_id::text = auth.uid()::text);

-- Medical Officer Profile
CREATE POLICY "Medical officers can view own profile"
ON public.medical_officer_profile FOR ALL
USING (account_id::text = auth.uid()::text);

-- Pathologist Profile
CREATE POLICY "Pathologists can view own profile"
ON public.pathologist_profile FOR ALL
USING (account_id::text = auth.uid()::text);

-- Health Officer Profile
CREATE POLICY "Health officers can view own profile"
ON public.health_officer_profile FOR ALL
USING (account_id::text = auth.uid()::text);

-- Admin Profile
CREATE POLICY "Admins can view own profile"
ON public.admin_profile FOR ALL
USING (account_id::text = auth.uid()::text);

-- ============================================
-- Patient Policies
-- ============================================

-- All authenticated users can view patients
CREATE POLICY "All users can view malaria patients"
ON public.malaria_patients FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "All users can view leptospirosis patients"
ON public.leptospirosis_patients FOR SELECT
USING (auth.role() = 'authenticated');

-- Lab technicians can insert patients
CREATE POLICY "Lab technicians can insert malaria patients"
ON public.malaria_patients FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.auth_accounts
        WHERE id::text = auth.uid()::text AND role = 'lab_technician'
    )
);

CREATE POLICY "Lab technicians can insert leptospirosis patients"
ON public.leptospirosis_patients FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.auth_accounts
        WHERE id::text = auth.uid()::text AND role = 'lab_technician'
    )
);

-- ============================================
-- Analysis Policies (ALL USERS CAN USE AI)
-- ============================================

-- All authenticated users can view analyses
CREATE POLICY "All users can view analyses"
ON public.analyses FOR SELECT
USING (auth.role() = 'authenticated');

-- All authenticated users can insert analyses (AI Detector access)
CREATE POLICY "All users can insert analyses"
ON public.analyses FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own analyses
CREATE POLICY "Users can update own analyses"
ON public.analyses FOR UPDATE
USING (account_id::text = auth.uid()::text);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
ON public.analyses FOR DELETE
USING (account_id::text = auth.uid()::text);

-- ============================================
-- Reports Policies (Multi-Level Workflow)
-- ============================================

-- Lab technicians can view their submitted reports
CREATE POLICY "Lab technicians can view own reports"
ON public.reports FOR SELECT
USING (submitted_by::text = auth.uid()::text);

-- Medical officers can view assigned reports
CREATE POLICY "Medical officers can view assigned reports"
ON public.reports FOR SELECT
USING (medical_officer_id::text = auth.uid()::text);

-- Pathologists can view assigned reports
CREATE POLICY "Pathologists can view assigned reports"
ON public.reports FOR SELECT
USING (pathologist_id::text = auth.uid()::text);

-- Health officers can view all verified reports (read-only)
CREATE POLICY "Health officers can view verified reports"
ON public.reports FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.auth_accounts
        WHERE id::text = auth.uid()::text AND role = 'health_officer'
    ) AND status = 'verified'
);

-- Admin can view all reports (read-only)
CREATE POLICY "Admin can view all reports"
ON public.reports FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.auth_accounts
        WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- Lab technicians can insert reports
CREATE POLICY "Lab technicians can insert reports"
ON public.reports FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.auth_accounts
        WHERE id::text = auth.uid()::text AND role = 'lab_technician'
    )
);

-- Medical officers can update their assigned reports
CREATE POLICY "Medical officers can update assigned reports"
ON public.reports FOR UPDATE
USING (medical_officer_id::text = auth.uid()::text);

-- Pathologists can update their assigned reports
CREATE POLICY "Pathologists can update assigned reports"
ON public.reports FOR UPDATE
USING (pathologist_id::text = auth.uid()::text);

-- ============================================
-- Activity Logs Policies
-- ============================================

-- All users can insert their own logs
CREATE POLICY "Users can insert own activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (account_id::text = auth.uid()::text);

-- Admin can view all logs
CREATE POLICY "Admin can view all activity logs"
ON public.activity_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.auth_accounts
        WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- Users can view their own logs
CREATE POLICY "Users can view own activity logs"
ON public.activity_logs FOR SELECT
USING (account_id::text = auth.uid()::text);
