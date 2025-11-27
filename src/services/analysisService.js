import { supabase } from '../lib/supabase';

export const analysisService = {
    // Create analysis record
    async createAnalysis(analysisData) {
        try {
            const { data, error } = await supabase
                .from('analyses')
                .insert([{
                    account_id: analysisData.account_id,
                    patient_type: analysisData.patient_type,
                    patient_id: analysisData.patient_id,
                    image_path: analysisData.image_path,
                    ai_result: analysisData.ai_result,
                    confidence_score: analysisData.confidence_score
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get all analyses with patient info
    async getAnalysesWithPatient() {
        try {
            const { data, error } = await supabase
                .from('analyses_with_patient')
                .select('*')
                .order('analyzed_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get analyses by user
    async getAnalysesByUser(accountId) {
        try {
            // First, get analyses for this user
            const { data: analyses, error: analysesError } = await supabase
                .from('analyses')
                .select('*')
                .eq('account_id', accountId)
                .order('analyzed_at', { ascending: false });

            if (analysesError) throw analysesError;

            // Then, fetch patient data separately
            const { data: malariaPatients } = await supabase
                .from('malaria_patients')
                .select('*');

            const { data: leptoPatients } = await supabase
                .from('leptospirosis_patients')
                .select('*');

            // Map patient data to analyses
            const enrichedAnalyses = analyses.map(analysis => {
                let patient = null;
                if (analysis.patient_type === 'malaria') {
                    patient = malariaPatients?.find(p => p.id === analysis.patient_id);
                } else if (analysis.patient_type === 'leptospirosis') {
                    patient = leptoPatients?.find(p => p.id === analysis.patient_id);
                }

                return {
                    ...analysis,
                    patient_name: patient?.name || 'Unknown',
                    patient_data: patient
                };
            });

            return { success: true, data: enrichedAnalyses };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get dashboard stats
    async getDashboardStats() {
        try {
            const { data, error } = await supabase
                .from('dashboard')
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};
