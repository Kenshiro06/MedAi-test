-- Fix Activity Logs Timestamp to use TIMESTAMPTZ
-- Run this in Supabase SQL Editor if you already have the activity_logs table

-- Option 1: If you want to keep existing data
-- Alter the column type to TIMESTAMPTZ
ALTER TABLE public.activity_logs 
ALTER COLUMN created_at TYPE TIMESTAMPTZ 
USING created_at AT TIME ZONE 'UTC';

-- Update the default to use NOW() with timezone
ALTER TABLE public.activity_logs 
ALTER COLUMN created_at SET DEFAULT NOW();

-- Option 2: If you want to recreate the table (WARNING: This will delete all existing logs)
-- Uncomment the lines below if you want to start fresh

-- DROP TABLE IF EXISTS public.activity_logs CASCADE;
-- 
-- CREATE TABLE public.activity_logs (
--     id SERIAL PRIMARY KEY,
--     user_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
--     user_email VARCHAR(255),
--     user_role VARCHAR(50),
--     action VARCHAR(255) NOT NULL,
--     details TEXT,
--     ip_address VARCHAR(50),
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );
-- 
-- CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
-- CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
-- CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
-- 
-- GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE activity_logs_id_seq TO authenticated;
-- 
-- ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name = 'activity_logs' 
AND column_name = 'created_at';

-- Success message
SELECT 'Activity logs timestamp fixed! Now using TIMESTAMPTZ for proper timezone handling.' as message;
