-- Add gradcam_paths column to analyses table for storing Grad-CAM visualization URLs
-- Run this in Supabase SQL Editor

-- Add gradcam_paths column (array of text/URLs) to store Grad-CAM image URLs
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS gradcam_paths TEXT[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN analyses.gradcam_paths IS 'Array of URLs to Grad-CAM visualization images stored in Supabase Storage';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'analyses' 
AND column_name = 'gradcam_paths';
