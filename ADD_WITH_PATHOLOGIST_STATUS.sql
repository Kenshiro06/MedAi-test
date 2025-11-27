-- Add 'submitted' status to reports table
-- Run this in Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;

-- Add new constraint with 'submitted' status
ALTER TABLE reports ADD CONSTRAINT reports_status_check 
CHECK (status IN ('pending', 'submitted', 'approved', 'rejected'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'reports'::regclass 
AND conname = 'reports_status_check';
