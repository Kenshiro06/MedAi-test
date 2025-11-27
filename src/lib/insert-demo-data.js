// Run this script to insert demo accounts into Supabase
// Usage: node src/lib/insert-demo-data.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gchjnljaulusulythgzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaGpubGphdWx1c3VseXRoZ3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjYzNDAsImV4cCI6MjA3OTIwMjM0MH0.54-8Jijp5b6GBotYODIlgEzIUz-Q598XJeST29qKDGc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertDemoAccounts() {
    console.log('🚀 Inserting demo accounts...\n');

    // Insert accounts
    const accounts = [
        { email: 'admin@medai.com', password_hash: 'admin123', role: 'admin', status: 'approved' },
        { email: 'doctor@medai.com', password_hash: 'doctor123', role: 'doctor', status: 'approved' },
        { email: 'staff@medai.com', password_hash: 'staff123', role: 'staff', status: 'approved' }
    ];

    for (const account of accounts) {
        const { data, error } = await supabase
            .from('auth_accounts')
            .insert([account])
            .select();

        if (error) {
            console.error(`❌ Error inserting ${account.role}:`, error.message);
        } else {
            console.log(`✅ ${account.role} account created:`, data[0].email);
            
            // Insert profile based on role
            const accountId = data[0].id;
            
            if (account.role === 'admin') {
                await supabase.from('admin_profile').insert([{
                    account_id: accountId,
                    full_name: 'Admin User',
                    phone: '+60123456789',
                    position: 'System Administrator'
                }]);
            } else if (account.role === 'doctor') {
                await supabase.from('doctor_profile').insert([{
                    account_id: accountId,
                    full_name: 'Dr. Sarah Johnson',
                    department: 'Pathology',
                    license_no: 'MD-2024-001',
                    specialization: 'Clinical Pathology'
                }]);
            } else if (account.role === 'staff') {
                await supabase.from('staff_profile').insert([{
                    account_id: accountId,
                    full_name: 'John Smith',
                    organization: 'General Hospital',
                    level: 'Senior Lab Technician'
                }]);
            }
        }
    }

    console.log('\n✨ Demo accounts setup complete!');
    console.log('\n📝 Login credentials:');
    console.log('Admin: admin@medai.com / admin123');
    console.log('Doctor: doctor@medai.com / doctor123');
    console.log('Staff: staff@medai.com / staff123');
}

insertDemoAccounts();
