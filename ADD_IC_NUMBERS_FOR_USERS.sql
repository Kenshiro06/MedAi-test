-- Add IC/MyKad numbers and address for all demo users
-- Run this in Supabase SQL Editor

-- First, add ic_number and address columns to auth_accounts if they don't exist
ALTER TABLE auth_accounts ADD COLUMN IF NOT EXISTS ic_number VARCHAR(20);
ALTER TABLE auth_accounts ADD COLUMN IF NOT EXISTS address TEXT;

-- Add ic_number and address columns to all profile tables
ALTER TABLE lab_technician_profile ADD COLUMN IF NOT EXISTS ic_number VARCHAR(20);
ALTER TABLE lab_technician_profile ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE medical_officer_profile ADD COLUMN IF NOT EXISTS ic_number VARCHAR(20);
ALTER TABLE medical_officer_profile ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE pathologist_profile ADD COLUMN IF NOT EXISTS ic_number VARCHAR(20);
ALTER TABLE pathologist_profile ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE health_officer_profile ADD COLUMN IF NOT EXISTS ic_number VARCHAR(20);
ALTER TABLE health_officer_profile ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE admin_profile ADD COLUMN IF NOT EXISTS ic_number VARCHAR(20);
ALTER TABLE admin_profile ADD COLUMN IF NOT EXISTS address TEXT;

-- Update existing users with demo IC numbers (without dashes)
-- Lab Technician (technician@medai.com)
UPDATE auth_accounts 
SET ic_number = '960202022345' 
WHERE email = 'technician@medai.com';

-- Medical Officer (mo@medai.com)
UPDATE auth_accounts 
SET ic_number = '880202025678' 
WHERE email = 'mo@medai.com';

-- Medical Officer (drakmal@medai.com)
UPDATE auth_accounts 
SET ic_number = '870303033456' 
WHERE email = 'drakmal@medai.com';

-- Pathologist
UPDATE auth_accounts 
SET ic_number = '750303039012' 
WHERE email = 'pathologist@medai.com';

-- Health Officer
UPDATE auth_accounts 
SET ic_number = '920404043456' 
WHERE email = 'health@medai.com';

-- Admin
UPDATE auth_accounts 
SET ic_number = '850505057890' 
WHERE email = 'admin@medai.com';

-- Update any remaining users without IC numbers (generic IC based on their ID)
UPDATE auth_accounts 
SET ic_number = CONCAT('99', LPAD(id::text, 10, '0'))
WHERE ic_number IS NULL;

-- Sync IC numbers from auth_accounts to profile tables
-- Lab Technician profiles
UPDATE lab_technician_profile ltp
SET ic_number = aa.ic_number
FROM auth_accounts aa
WHERE ltp.account_id = aa.id AND aa.ic_number IS NOT NULL;

-- Medical Officer profiles
UPDATE medical_officer_profile mop
SET ic_number = aa.ic_number
FROM auth_accounts aa
WHERE mop.account_id = aa.id AND aa.ic_number IS NOT NULL;

-- Pathologist profiles
UPDATE pathologist_profile pp
SET ic_number = aa.ic_number
FROM auth_accounts aa
WHERE pp.account_id = aa.id AND aa.ic_number IS NOT NULL;

-- Health Officer profiles
UPDATE health_officer_profile hop
SET ic_number = aa.ic_number
FROM auth_accounts aa
WHERE hop.account_id = aa.id AND aa.ic_number IS NOT NULL;

-- Admin profiles
UPDATE admin_profile ap
SET ic_number = aa.ic_number
FROM auth_accounts aa
WHERE ap.account_id = aa.id AND aa.ic_number IS NOT NULL;

-- Add sample home addresses for demo users (residential addresses, not workplace)
UPDATE auth_accounts 
SET address = 'No. 45, Jalan Melati 3/2, Taman Bunga Raya, 43000 Kajang, Selangor' 
WHERE email = 'technician@medai.com';

UPDATE auth_accounts 
SET address = 'Apartment Vista, Block C-12-05, Jalan Ampang Hilir, 55000 Kuala Lumpur' 
WHERE email = 'mo@medai.com';

UPDATE auth_accounts 
SET address = 'No. 88, Lorong Damai 5, Taman Sri Gombak, 53100 Kuala Lumpur' 
WHERE email = 'drakmal@medai.com';

UPDATE auth_accounts 
SET address = 'Condominium Seri Mutiara, Tower B-08-12, Jalan Ipoh, 51200 Kuala Lumpur' 
WHERE email = 'pathologist@medai.com';

UPDATE auth_accounts 
SET address = 'No. 23, Jalan Kenanga 7/3, Bandar Baru Bangi, 43650 Bangi, Selangor' 
WHERE email = 'health@medai.com';

UPDATE auth_accounts 
SET address = 'No. 156, Jalan Taman Desa 2/1, Taman Desa, 58100 Kuala Lumpur' 
WHERE email = 'admin@medai.com';

-- Sync addresses from auth_accounts to profile tables
UPDATE lab_technician_profile ltp
SET address = aa.address
FROM auth_accounts aa
WHERE ltp.account_id = aa.id AND aa.address IS NOT NULL;

UPDATE medical_officer_profile mop
SET address = aa.address
FROM auth_accounts aa
WHERE mop.account_id = aa.id AND aa.address IS NOT NULL;

UPDATE pathologist_profile pp
SET address = aa.address
FROM auth_accounts aa
WHERE pp.account_id = aa.id AND aa.address IS NOT NULL;

UPDATE health_officer_profile hop
SET address = aa.address
FROM auth_accounts aa
WHERE hop.account_id = aa.id AND aa.address IS NOT NULL;

UPDATE admin_profile ap
SET address = aa.address
FROM auth_accounts aa
WHERE ap.account_id = aa.id AND aa.address IS NOT NULL;

-- Verify the updates
SELECT id, email, ic_number, address, role, status 
FROM auth_accounts 
ORDER BY role;

-- Now users can login with either:
-- Email: technician@medai.com OR IC: 960202022345
-- Email: mo@medai.com OR IC: 880202025678
-- Email: drakmal@medai.com OR IC: 870303033456
-- Email: pathologist@medai.com OR IC: 750303039012
-- Email: health@medai.com OR IC: 920404043456
-- Email: admin@medai.com OR IC: 850505057890
-- Any other users will get auto-generated IC numbers
