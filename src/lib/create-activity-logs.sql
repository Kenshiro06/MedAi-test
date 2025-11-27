-- Create Activity Logs Table
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
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);

-- Insert sample activity logs (only for existing users)
-- First, let's check what user IDs exist
DO $$
DECLARE
    v_user_id INT;
    v_email VARCHAR;
    v_role VARCHAR;
BEGIN
    -- Loop through existing users and create sample logs
    FOR v_user_id, v_email, v_role IN 
        SELECT id, email, role FROM auth_accounts LIMIT 5
    LOOP
        INSERT INTO activity_logs (user_id, user_email, user_role, action, details) 
        VALUES (v_user_id, v_email, v_role, 'Login', 'User logged into the system');
        
        INSERT INTO activity_logs (user_id, user_email, user_role, action, details) 
        VALUES (v_user_id, v_email, v_role, 'Dashboard Viewed', 'Accessed dashboard overview');
    END LOOP;
END $$;

-- Grant permissions
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE activity_logs_id_seq TO authenticated;

-- RLS Policy (optional - disable for testing)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin can see all logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth_accounts
        WHERE auth_accounts.id = auth.uid()::int
        AND auth_accounts.role = 'admin'
    )
);

-- Users can insert their own logs
CREATE POLICY "Users can insert their own activity logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::int);

COMMENT ON TABLE public.activity_logs IS 'System-wide activity audit trail';
