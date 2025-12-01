# Settings Feature Checklist ✅

## Database Setup
- [ ] **IMPORTANT**: If you already created the table, run `src/lib/fix-user-settings-rls.sql` first!
- [ ] Run `src/lib/create-user-settings-table.sql` in Supabase SQL Editor
- [ ] Verify table created: `user_settings`
- [ ] Check RLS is **DISABLED** (using custom auth)
- [ ] Confirm default settings created for existing users

## Settings Component Features

### 1. Email Notifications ✅
- **Database Field**: `email_notifications` (BOOLEAN)
- **Default**: `true`
- **UI**: Toggle switch
- **Function**: Receive important updates via email

### 2. Report Notifications ✅
- **Database Field**: `report_notifications` (BOOLEAN)
- **Default**: `true`
- **UI**: Toggle switch
- **Function**: Get notified when reports are reviewed/approved/rejected

### 3. Language Selection ✅
- **Database Field**: `language` (VARCHAR)
- **Default**: `'en'`
- **Options**: 
  - 🇬🇧 English (`en`)
  - 🇲🇾 Bahasa Malaysia (`ms`)
- **UI**: Dropdown select

## Testing Steps

### Test 1: Load Settings
1. Login to dashboard
2. Navigate to Settings page
3. **Expected**: Settings load from database
4. **Check**: Loading spinner appears briefly, then settings display

### Test 2: Toggle Email Notifications
1. Click Email Notifications toggle
2. Click "Save Settings"
3. **Expected**: "✅ Settings saved successfully!" alert
4. Refresh page
5. **Expected**: Toggle state persists

### Test 3: Toggle Report Notifications
1. Click Report Notifications toggle
2. Click "Save Settings"
3. **Expected**: Settings save successfully
4. Refresh page
5. **Expected**: Toggle state persists

### Test 4: Change Language
1. Select "🇲🇾 Bahasa Malaysia" from dropdown
2. Click "Save Settings"
3. **Expected**: Settings save successfully
4. Refresh page
5. **Expected**: Language selection persists

### Test 5: Export Data
1. Click "Export Data" button
2. **Expected**: JSON file downloads with user settings

### Test 6: Multi-User Isolation
1. Login as User A, change settings
2. Logout, login as User B
3. **Expected**: User B sees their own settings, not User A's

## Database Verification

Run in Supabase SQL Editor:
```sql
-- Check all user settings
SELECT 
    us.*,
    aa.email,
    aa.role
FROM user_settings us
JOIN auth_accounts aa ON us.account_id = aa.id
ORDER BY aa.email;
```

## Security Verification

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_settings';

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'user_settings';
```

## Common Issues & Solutions

### Issue: 401 Unauthorized Error
- **Solution**: Run `src/lib/fix-user-settings-rls.sql` to disable RLS
- **Reason**: Using custom auth_accounts, not Supabase Auth

### Issue: Settings don't load
- **Check**: User is logged in (`user` prop exists)
- **Check**: `user_settings` table exists in Supabase
- **Check**: RLS is disabled (not using Supabase Auth)

### Issue: Settings don't save
- **Check**: `account_id` matches logged-in user's ID
- **Check**: Browser console for error messages
- **Check**: Table has UNIQUE constraint on account_id

### Issue: Settings reset after refresh
- **Check**: `saveSettings()` function completes successfully
- **Check**: Database actually updated (run verification query)
- **Check**: `loadSettings()` runs on component mount

## Files Involved
- ✅ `src/components/dashboard/views/Settings.jsx` - UI Component
- ✅ `src/lib/create-user-settings-table.sql` - Database Schema
- ✅ `src/lib/supabase.js` - Database Connection

## Status: Ready for Testing! 🚀
All code is in place. Run the SQL in Supabase and test the features above.
