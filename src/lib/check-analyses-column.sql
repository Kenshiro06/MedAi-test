-- Quick check: Does analyses table have image_paths column?
-- Run this in Supabase SQL Editor

SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'analyses' 
AND column_name IN ('image_path', 'image_paths')
ORDER BY column_name;

-- If you only see 'image_path' and NOT 'image_paths', run this:
-- ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS image_paths JSONB DEFAULT '[]'::jsonb;
