-- Fix the latest analyses that were created after the first timezone fix
-- This adds 8 hours to any analyses with UTC timestamps (time < 12:00)

-- Fix analyses with UTC timestamps (assuming Malaysia time should be > 12:00 if created during daytime)
UPDATE analyses
SET analyzed_at = analyzed_at + INTERVAL '8 hours'
WHERE analyzed_at::time < '12:00:00'::time
  AND analyzed_at > NOW() - INTERVAL '1 day';

-- Fix recent patient records
UPDATE malaria_patients
SET collection_datetime = collection_datetime + INTERVAL '8 hours'
WHERE collection_datetime::time < '12:00:00'::time
  AND collection_datetime > NOW() - INTERVAL '1 day';

UPDATE leptospirosis_patients
SET collection_datetime = collection_datetime + INTERVAL '8 hours'
WHERE collection_datetime::time < '12:00:00'::time
  AND collection_datetime > NOW() - INTERVAL '1 day';

-- Verify
SELECT 
    id,
    patient_id,
    ai_result,
    analyzed_at,
    analyzed_at::time as time_only
FROM analyses
ORDER BY analyzed_at DESC
LIMIT 10;
