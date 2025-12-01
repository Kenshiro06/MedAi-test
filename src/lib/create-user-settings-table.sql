-- Create user_settings table to store essential user preferences
-- Run this in Supabase SQL Editor
--
-- SECURITY NOTE: This table uses custom authentication via auth_accounts table
-- RLS is disabled because app-level authentication handles access control

CREATE TABLE IF NOT EXISTS user_settings (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
    
    -- Notifications (Essential for medical workflow)
    email_notifications BOOLEAN DEFAULT true,
    report_notifications BOOLEAN DEFAULT true,
    
    -- Language (Essential for Malaysian users)
    language VARCHAR(10) DEFAULT 'en',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one settings record per user
    UNIQUE(account_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_account_id ON user_settings(account_id);

-- Disable RLS (using custom auth_accounts authentication)
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Create default settings for existing users
INSERT INTO user_settings (account_id)
SELECT id FROM auth_accounts
ON CONFLICT (account_id) DO NOTHING;

-- Verify
SELECT 
    us.*,
    aa.email,
    aa.role
FROM user_settings us
JOIN auth_accounts aa ON us.account_id = aa.id
ORDER BY aa.role;
