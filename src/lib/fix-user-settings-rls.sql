-- Quick fix to disable RLS on existing user_settings table
-- Run this if you already created the table with RLS enabled

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

-- Disable RLS
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_settings';
-- Should show: rowsecurity = false

-- Test query to verify RLS is disabled (just for verification, doesn't affect app)
-- This only displays first 5 rows in SQL editor for quick check
SELECT * FROM user_settings LIMIT 5;

-- To see ALL users' settings, run this instead:
-- SELECT * FROM user_settings;
