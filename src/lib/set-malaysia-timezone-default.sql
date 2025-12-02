-- Set default timezone for analyzed_at to Malaysia time (GMT+8)
-- This ensures all NEW analyses use Malaysia timezone automatically

-- Change the default for analyzed_at column to use Malaysia timezone
ALTER TABLE analyses 
ALTER COLUMN analyzed_at 
SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur');

-- Also fix collection_datetime defaults for patient tables
ALTER TABLE malaria_patients
ALTER COLUMN collection_datetime
SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur');

ALTER TABLE leptospirosis_patients
ALTER COLUMN collection_datetime
SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur');

-- Fix reports timestamps
ALTER TABLE reports
ALTER COLUMN submitted_at
SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur');

ALTER TABLE reports
ALTER COLUMN created_at
SET DEFAULT (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur');

-- Verify the changes
SELECT 
    table_name,
    column_name,
    column_default
FROM information_schema.columns
WHERE table_name IN ('analyses', 'malaria_patients', 'leptospirosis_patients', 'reports')
    AND column_name IN ('analyzed_at', 'collection_datetime', 'submitted_at', 'created_at')
ORDER BY table_name, column_name;

-- Note: This only affects NEW records created after running this script
-- Existing records were already fixed by the previous script
