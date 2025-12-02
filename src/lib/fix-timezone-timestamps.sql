-- Fix existing timestamps to Malaysia timezone (GMT+8)
-- This adds 8 hours to all UTC timestamps in the database
-- Run this ONCE in Supabase SQL Editor

-- Fix malaria_patients collection_datetime
UPDATE malaria_patients
SET collection_datetime = collection_datetime + INTERVAL '8 hours'
WHERE collection_datetime IS NOT NULL;

-- Fix leptospirosis_patients collection_datetime  
UPDATE leptospirosis_patients
SET collection_datetime = collection_datetime + INTERVAL '8 hours'
WHERE collection_datetime IS NOT NULL;

-- Fix analyses analyzed_at
UPDATE analyses
SET analyzed_at = analyzed_at + INTERVAL '8 hours'
WHERE analyzed_at IS NOT NULL;

-- Fix reports timestamps
UPDATE reports
SET submitted_at = submitted_at + INTERVAL '8 hours'
WHERE submitted_at IS NOT NULL;

UPDATE reports
SET mo_reviewed_at = mo_reviewed_at + INTERVAL '8 hours'
WHERE mo_reviewed_at IS NOT NULL;

UPDATE reports
SET pathologist_reviewed_at = pathologist_reviewed_at + INTERVAL '8 hours'
WHERE pathologist_reviewed_at IS NOT NULL;

-- Verify the changes
SELECT 
    'malaria_patients' as table_name,
    COUNT(*) as total_records,
    MIN(collection_datetime) as earliest,
    MAX(collection_datetime) as latest
FROM malaria_patients
UNION ALL
SELECT 
    'analyses' as table_name,
    COUNT(*) as total_records,
    MIN(analyzed_at) as earliest,
    MAX(analyzed_at) as latest
FROM analyses;

-- Note: This script should only be run ONCE
-- Running it multiple times will add 8 hours each time!
