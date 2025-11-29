import { supabase } from '../lib/supabase';
import { activityLogger } from './activityLogger';

export const authService = {
    // Login with IC/MyKad or email and password
    async login(identifier, password) {
        try {
            // Query auth_accounts table - check both email and ic_number
            const { data, error } = await supabase
                .from('auth_accounts')
                .select('id, email, role, status, ic_number')
                .or(`email.eq.${identifier},ic_number.eq.${identifier}`)
                .eq('password_hash', password) // In production, use proper password hashing
                .single();

            if (error) throw error;

            if (!data) {
                throw new Error('Invalid credentials');
            }

            if (data.status !== 'approved') {
                throw new Error('Account pending approval');
            }

            // Store user session in localStorage
            localStorage.setItem('user', JSON.stringify(data));

            // Log login activity
            await activityLogger.logLogin(data);

            return {
                success: true,
                user: data
            };
        } catch (error) {
            // Handle "Row not found" error from .single()
            if (error.code === 'PGRST116' || error.message.includes('Cannot coerce') || error.message.includes('JSON object')) {
                return {
                    success: false,
                    error: 'Please check your password or username'
                };
            }

            return {
                success: false,
                error: error.message
            };
        }
    },

    // Get current user from localStorage
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Logout
    async logout() {
        const user = this.getCurrentUser();
        if (user) {
            await activityLogger.logLogout(user);
        }
        localStorage.removeItem('user');
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getCurrentUser();
    }
};
