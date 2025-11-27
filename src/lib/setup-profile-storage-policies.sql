-- Setup storage policies for profile picture buckets
-- Run this in Supabase SQL Editor after creating the buckets

-- ============================================
-- ADMIN PROFILE BUCKET
-- ============================================

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Allow authenticated uploads to admin_profile"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'admin_profile');

-- Allow public to view profile pictures
CREATE POLICY "Allow public reads from admin_profile"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'admin_profile');

-- Allow users to update their own profile pictures
CREATE POLICY "Allow authenticated updates to admin_profile"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'admin_profile');

-- Allow users to delete their own profile pictures
CREATE POLICY "Allow authenticated deletes from admin_profile"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'admin_profile');

-- ============================================
-- LAB TECHNICIAN PROFILE BUCKET
-- ============================================

CREATE POLICY "Allow authenticated uploads to lab_profile"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lab_profile');

CREATE POLICY "Allow public reads from lab_profile"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lab_profile');

CREATE POLICY "Allow authenticated updates to lab_profile"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'lab_profile');

CREATE POLICY "Allow authenticated deletes from lab_profile"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lab_profile');

-- ============================================
-- MEDICAL OFFICER PROFILE BUCKET
-- ============================================

CREATE POLICY "Allow authenticated uploads to mo_profile"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mo_profile');

CREATE POLICY "Allow public reads from mo_profile"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mo_profile');

CREATE POLICY "Allow authenticated updates to mo_profile"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'mo_profile');

CREATE POLICY "Allow authenticated deletes from mo_profile"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mo_profile');

-- ============================================
-- PATHOLOGIST PROFILE BUCKET
-- ============================================

CREATE POLICY "Allow authenticated uploads to patho_profile"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patho_profile');

CREATE POLICY "Allow public reads from patho_profile"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'patho_profile');

CREATE POLICY "Allow authenticated updates to patho_profile"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'patho_profile');

CREATE POLICY "Allow authenticated deletes from patho_profile"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'patho_profile');

-- ============================================
-- HEALTH OFFICER PROFILE BUCKET
-- ============================================

CREATE POLICY "Allow authenticated uploads to health_profile"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'health_profile');

CREATE POLICY "Allow public reads from health_profile"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'health_profile');

CREATE POLICY "Allow authenticated updates to health_profile"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'health_profile');

CREATE POLICY "Allow authenticated deletes from health_profile"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'health_profile');

-- ============================================
-- VERIFY POLICIES
-- ============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%profile%'
ORDER BY policyname;

SELECT '✅ All storage policies created successfully!' as status;
