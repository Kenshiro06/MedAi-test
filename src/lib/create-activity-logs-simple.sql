-- Create Activity Logs Table (Simple Version)
-- Run this in Supabase SQL Editor

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.activity_logs CASCADE;

-- Create activity_logs table
CREATE TABLE public.activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES public.auth_accounts(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);

-- Grant permissions
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE activity_logs_id_seq TO authenticated;

-- Disable RLS for testing (you can enable it later)
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

-- Optional: Enable RLS and create policies
-- ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Admins can view all activity logs"
-- ON public.activity_logs FOR SELECT
-- TO authenticated
-- USING (
--     EXISTS (
--         SELECT 1 FROM auth_accounts
--         WHERE auth_accounts.id = auth.uid()::int
--         AND auth_accounts.role = 'admin'
--     )
-- );

-- CREATE POLICY "Users can insert their own activity logs"
-- ON public.activity_logs FOR INSERT
-- TO authenticated
-- WITH CHECK (user_id = auth.uid()::int);

COMMENT ON TABLE public.activity_logs IS 'System-wide activity audit trail';

-- Success message
SELECT 'Activity logs table created successfully!' as message;
