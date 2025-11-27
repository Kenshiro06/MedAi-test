-- Add support for multiple images in analyses table
-- Run this in Supabase SQL Editor

-- Option 1: Add a new column for multiple images (recommended)
ALTER TABLE public.analyses 
ADD COLUMN IF NOT EXISTS image_paths JSONB DEFAULT '[]'::jsonb;

-- Option 2: If you want to convert existing image_path to array format
-- Uncomment the following lines:

-- UPDATE public.analyses 
-- SET image_paths = jsonb_build_array(image_path)
-- WHERE image_path IS NOT NULL AND image_paths = '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN public.analyses.image_paths IS 'Array of image URLs/paths for multiple microscope fields';

-- Verify the change
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'analyses' 
AND column_name IN ('image_path', 'image_paths');

SELECT 'Multiple images support added successfully!' as message;
