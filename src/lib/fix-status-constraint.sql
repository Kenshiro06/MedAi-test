-- ============================================
-- FIX: Update Status Constraint to Simple Values
-- ============================================

-- Drop the old constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;

-- Add new constraint with simple status values
ALTER TABLE reports 
ADD CONSTRAINT reports_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Also update mo_status and pathologist_status constraints if they exist
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_mo_status_check;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_pathologist_status_check;

-- Make mo_status and pathologist_status optional (can be NULL)
ALTER TABLE reports 
ADD CONSTRAINT reports_mo_status_check 
CHECK (mo_status IS NULL OR mo_status IN ('pending', 'approved', 'rejected', 'needs_revision'));

ALTER TABLE reports 
ADD CONSTRAINT reports_pathologist_status_check 
CHECK (pathologist_status IS NULL OR pathologist_status IN ('pending', 'verified', 'rejected'));

-- Update any existing reports with old status values
UPDATE reports SET status = 'pending' WHERE status IN ('mo_review', 'pathologist_review');
UPDATE reports SET status = 'approved' WHERE status = 'verified';

-- Verify the constraint
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'reports'::regclass 
AND conname LIKE '%status%';
