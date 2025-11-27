-- Verify auth_accounts table structure
-- Run this in Supabase SQL Editor to check your table

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'auth_accounts'
ORDER BY ordinal_position;

-- Expected columns:
-- id (integer)
-- email (character varying)
-- password_hash (text) ← Important: Must be password_hash, not password
-- role (character varying)
-- status (character varying)
-- created_at (timestamp)
-- updated_at (timestamp)

-- If you see 'password' instead of 'password_hash', run this:
-- ALTER TABLE auth_accounts RENAME COLUMN password TO password_hash;

-- View existing accounts
SELECT id, email, role, status, created_at 
FROM auth_accounts 
ORDER BY created_at DESC;
