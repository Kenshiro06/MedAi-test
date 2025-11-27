import { supabase } from '../lib/supabase';

/**
 * Activity Logger Service
 * Logs user actions to activity_logs table in real-time
 */

export const activityLogger = {
    /**
     * Log any activity
     * @param {Object} user - Current user object
     * @param {string} action - Action name (e.g., "Login", "AI Detector Used")
     * @param {string} details - Additional details about the action
     */
    async log(user, action, details = '') {
        try {
            if (!user) return;

            await supabase.from('activity_logs').insert({
                user_id: user.id,
                user_email: user.email,
                user_role: user.role,
                action,
                details
            });
        } catch (error) {
            console.error('Activity logging error:', error);
            // Don't throw - logging should never break the app
        }
    },

    // Specific action loggers
    async logLogin(user) {
        await this.log(user, 'Login', 'User logged into the system');
    },

    async logLogout(user) {
        await this.log(user, 'Logout', 'User logged out');
    },

    async logAIDetectorUsed(user, diseaseType) {
        await this.log(user, 'AI Detector Used', `Analyzed ${diseaseType} sample`);
    },

    async logAnalysisCreated(user, diseaseType, result) {
        await this.log(user, 'Analysis Created', `Created ${diseaseType} analysis - Result: ${result}`);
    },

    async logAnalysisDeleted(user, count = 1) {
        await this.log(user, 'Analysis Deleted', `Deleted ${count} analysis/analyses`);
    },

    async logReportSubmitted(user, reportId, patientName, doctorName) {
        await this.log(user, 'Report Submitted', `Submitted report #${reportId} for patient "${patientName}" to Dr. ${doctorName}`);
    },

    async logReportApprovedByMO(user, reportId, patientName) {
        await this.log(user, 'Report Approved (MO)', `Approved report #${reportId} for patient "${patientName}" - Forwarded to Pathologist`);
    },

    async logReportRejectedByMO(user, reportId, patientName) {
        await this.log(user, 'Report Rejected (MO)', `Rejected report #${reportId} for patient "${patientName}"`);
    },

    async logReportApprovedByPathologist(user, reportId, patientName, labTechEmail = '', moEmail = '') {
        const details = `Final approval of report #${reportId} for patient "${patientName}"${labTechEmail ? ` - Lab Tech: ${labTechEmail}` : ''}${moEmail ? ` - MO: ${moEmail}` : ''}`;
        await this.log(user, 'Report Verified (Pathologist)', details);
    },

    async logReportRejectedByPathologist(user, reportId, patientName, labTechEmail = '', moEmail = '') {
        const details = `Rejected report #${reportId} for patient "${patientName}" - Final decision${labTechEmail ? ` - Lab Tech: ${labTechEmail}` : ''}${moEmail ? ` - MO: ${moEmail}` : ''}`;
        await this.log(user, 'Report Rejected (Pathologist)', details);
    },

    async logAnalysisEdited(user, analysisId, patientName) {
        await this.log(user, 'Analysis Edited', `Modified analysis #${analysisId} for patient "${patientName}"`);
    },

    async logDashboardViewed(user, dashboardType) {
        await this.log(user, 'Dashboard Viewed', `Accessed ${dashboardType} dashboard`);
    },

    async logUserManagement(user, action, targetUser) {
        await this.log(user, 'User Management', `${action} user: ${targetUser}`);
    },

    async logDataExport(user, dataType) {
        await this.log(user, 'Data Export', `Exported ${dataType} data`);
    }
};

export default activityLogger;
