import { supabase } from '../lib/supabase';

export const patientService = {
    // Create malaria patient
    async createMalariaPatient(patientData, accountId) {
        try {
            const { data, error } = await supabase
                .from('malaria_patients')
                .insert([{
                    account_id: accountId,
                    name: patientData.name,
                    registration_number: patientData.registration_number,
                    ic_passport: patientData.ic_passport,
                    gender: patientData.gender,
                    age: patientData.age,
                    collection_datetime: patientData.collection_datetime,
                    health_facility: patientData.health_facility,
                    slide_number: patientData.slide_number,
                    smear_type: patientData.smear_type,
                    image_url: patientData.image_url
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Create leptospirosis patient
    async createLeptospirosisPatient(patientData, accountId) {
        try {
            const { data, error } = await supabase
                .from('leptospirosis_patients')
                .insert([{
                    account_id: accountId,
                    name: patientData.name,
                    registration_number: patientData.registration_number,
                    ic_passport: patientData.ic_passport,
                    gender: patientData.gender,
                    age: patientData.age,
                    collection_datetime: patientData.collection_datetime,
                    health_facility: patientData.health_facility,
                    slide_number: patientData.slide_number,
                    image_url: patientData.image_url
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get all malaria patients
    async getMalariaPatients() {
        try {
            const { data, error } = await supabase
                .from('malaria_patients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Get all leptospirosis patients
    async getLeptospirosisPatients() {
        try {
            const { data, error } = await supabase
                .from('leptospirosis_patients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};
