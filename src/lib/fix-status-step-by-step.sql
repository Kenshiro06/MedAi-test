-- ============================================
-- FIX Status Constraint - Step by Step
-- ============================================

-- Step 1: Check current status values
SELECT DISTINCT status FROM reports;

-- Step 2: Update existing reports FIRST (before changing constraint)
UPDATE reports SET status = 'pending' WHERE status IN ('mo_review', 'pathologist_review');
UPDATE reports SET status = 'approved' WHERE status = 'verified';

-- Step 3: Drop the old constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;

-- Step 4: Add new constraint with simple status values
ALTER TABLE reports 
ADD CONSTRAINT reports_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Step 5: Verify
SELECT id, status FROM reports;
