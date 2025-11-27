-- ========================================
-- CREATE STORAGE BUCKETS FOR IMAGES
-- Run this in Supabase SQL Editor
-- ========================================

-- Create malaria-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('malaria-images', 'malaria-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create leptospirosis-images bucket (also create lepto-images as alias)
INSERT INTO storage.buckets (id, name, public)
VALUES ('leptospirosis-images', 'leptospirosis-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('lepto-images', 'lepto-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set storage policies to allow public access
CREATE POLICY "Public Access for malaria-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'malaria-images');

CREATE POLICY "Allow uploads to malaria-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'malaria-images');

CREATE POLICY "Public Access for leptospirosis-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'leptospirosis-images');

CREATE POLICY "Allow uploads to leptospirosis-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'leptospirosis-images');

CREATE POLICY "Public Access for lepto-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'lepto-images');

CREATE POLICY "Allow uploads to lepto-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lepto-images');

-- Verify buckets created
SELECT * FROM storage.buckets WHERE name IN ('malaria-images', 'leptospirosis-images');
