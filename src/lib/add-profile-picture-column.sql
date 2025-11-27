-- Add profile_picture_url column to all profile tables
-- Run this in Supabase SQL Editor

-- Add to admin_profile
ALTER TABLE public.admin_profile 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add to lab_technician_profile
ALTER TABLE public.lab_technician_profile 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add to medical_officer_profile
ALTER TABLE public.medical_officer_profile 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add to pathologist_profile
ALTER TABLE public.pathologist_profile 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add to health_officer_profile
ALTER TABLE public.health_officer_profile 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Verify columns were added
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN (
    'admin_profile',
    'lab_technician_profile',
    'medical_officer_profile',
    'pathologist_profile',
    'health_officer_profile'
)
AND column_name = 'profile_picture_url'
ORDER BY table_name;

SELECT '✅ Profile picture column added to all profile tables!' as status;
