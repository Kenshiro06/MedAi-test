-- ============================================
-- FIX: Allow All Users to Insert Patients
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Lab technicians can insert malaria patients" ON public.malaria_patients;
DROP POLICY IF EXISTS "Lab technicians can insert leptospirosis patients" ON public.leptospirosis_patients;

-- Allow ALL authenticated users to insert patients (since all roles can use AI Detector)
CREATE POLICY "All users can insert malaria patients"
ON public.malaria_patients FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All users can insert leptospirosis patients"
ON public.leptospirosis_patients FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Also ensure they can update their own patients
DROP POLICY IF EXISTS "Users can update own malaria patients" ON public.malaria_patients;
DROP POLICY IF EXISTS "Users can update own leptospirosis patients" ON public.leptospirosis_patients;

CREATE POLICY "Users can update own malaria patients"
ON public.malaria_patients FOR UPDATE
USING (account_id::text = auth.uid()::text);

CREATE POLICY "Users can update own leptospirosis patients"
ON public.leptospirosis_patients FOR UPDATE
USING (account_id::text = auth.uid()::text);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('malaria_patients', 'leptospirosis_patients')
ORDER BY tablename, policyname;
