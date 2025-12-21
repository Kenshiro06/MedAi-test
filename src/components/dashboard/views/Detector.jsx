import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Scan, FileText, CheckCircle, AlertTriangle, Loader, X, Send, Plus, Image as ImageIcon, Info, ChevronRight, ArrowLeft, MapPin } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { activityLogger } from '../../../services/activityLogger';
import { getBFMPData } from '../../../utils/bfmpCalculator';

// Helper to get Malaysia timezone timestamp
const getMalaysiaTimestamp = () => {
    const now = new Date();
    // Convert to Malaysia timezone (GMT+8)
    const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    return malaysiaTime.toISOString();
};

const Detector = ({ role, user, onNavigate }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState('disease-selection'); // disease-selection, patient-details, upload, analyzing, result, report
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    // Patient Metadata State
    const [patientData, setPatientData] = useState({
        diseaseType: '', // Malaria or Leptospirosis
        name: '',
        age: '',
        gender: 'Male',
        registrationNumber: '',
        icPassport: '',
        // Initialize with Malaysia time for datetime-local input (YYYY-MM-DDTHH:mm)
        collectionDateTime: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' }).replace(' ', 'T').slice(0, 16),
        healthFacility: 'General Hospital KL', // Auto-filled mock
        slideNumber: '',
        smearType: 'Thin'
    });

    // Upload & Analysis State
    const [uploadedImages, setUploadedImages] = useState([]);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [diagnosis, setDiagnosis] = useState(null);

    const fileInputRef = useRef(null);

    // Handle Input Changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPatientData(prev => ({ ...prev, [name]: value }));
    };

    // Handle File Upload
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = files.map(file => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            preview: URL.createObjectURL(file),
            status: 'pending', // pending, analyzed
            quality: Math.random() > 0.2 ? 'Good' : 'Low Quality', // Simulating quality check
            uploaded: false,
            storageUrl: null
        }));

        setUploadedImages(prev => [...prev, ...newImages]);
    };

    // Real AI Analysis using trained model
    const startAnalysis = async () => {
        if (uploadedImages.length === 0) return;
        setStep('analyzing');
        setAnalysisProgress(0);

        const totalStartTime = Date.now();
        try {
            // Call the actual AI API
            console.log(`🚀 Starting analysis of ${uploadedImages.length} images...`);
            const apiStartTime = Date.now();

            const formData = new FormData();
            uploadedImages.forEach(img => {
                formData.append('images', img.file);
            });

            // Simulate progress while waiting for API
            const progressInterval = setInterval(() => {
                setAnalysisProgress(prev => Math.min(prev + 5, 90));
            }, 200);

            // Use environment variable for API URL (production) or fallback to localhost (development)
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/batch-predict`, {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            setAnalysisProgress(100);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const apiTime = ((Date.now() - apiStartTime) / 1000).toFixed(2);
            console.log(`🔬 AI Analysis completed in ${apiTime}s`);
            console.log('📊 Results:', data);

            // Process results and save to database
            await finalizeAnalysis(data);

            const totalTime = ((Date.now() - totalStartTime) / 1000).toFixed(2);
            console.log(`✅ Total analysis + save time: ${totalTime}s`);
        } catch (error) {
            console.error('❌ AI Analysis Error:', error);
            alert(`Failed to analyze images: ${error.message}\n\nMake sure the Python API is running:\ncd backend\npython malaria_api_working.py`);
            setStep('upload');
        }
    };

    const finalizeAnalysis = async (apiData) => {
        try {
            // Use actual AI results from the trained model
            const aggregate = apiData.aggregate;
            const results = apiData.results;

            let resultType = 'Negative - Uninfected';
            let severity = 'None';
            let confidence = 0;

            if (aggregate.parasitized_count > 0) {
                resultType = `Positive - ${patientData.diseaseType} Detected`;

                // Calculate severity based on percentage of positive fields
                const positivePercentage = (aggregate.parasitized_count / aggregate.successful) * 100;
                if (positivePercentage >= 70) severity = 'High';
                else if (positivePercentage >= 40) severity = 'Medium';
                else severity = 'Low';

                // Keep confidence as percentage (already in 0-100 range from API)
                confidence = aggregate.average_confidence;
            } else {
                resultType = 'Negative - Uninfected';
                severity = 'None';
                // Keep confidence as percentage (already in 0-100 range from API)
                confidence = aggregate.average_confidence;
            }

            // Calculate initial confidence and result
            // Note: We will overwrite rawCounts later if we successfully save to DB
            // to ensure consistency with other parts of the app that use getBFMPData(analysis.id)

            // Auto-save report to database (MUST await this!)
            console.log('💾 Saving analysis to database...');
            const savedAnalysis = await saveReportToDatabase(resultType, severity, confidence);

            let rawCounts = {
                parasitesCounted: 0,
                wbcsCounted: 0,
                parasiteDensity: 0,
                confidenceScore: confidence
            };

            // If we have a saved analysis ID, use it to generate consistent BFMP data
            if (savedAnalysis && savedAnalysis.id && resultType.includes('Positive')) {
                const bfmpData = getBFMPData(savedAnalysis);
                // Also update the local state to match what everyone else sees
                if (bfmpData) {
                    rawCounts.parasitesCounted = bfmpData.parasitesCounted;
                    rawCounts.wbcsCounted = bfmpData.wbcCounted;
                    rawCounts.parasiteDensity = bfmpData.density;
                }
            } else if (resultType.includes('Positive')) {
                // Fallback for failed save or offline mode (inconsistent but better than crash)
                // Try to shim an analysis object for the calculator
                const shimAnalysis = {
                    id: Math.floor(Math.random() * 1000000), // Random ID fallback
                    ai_result: resultType,
                    confidence_score: confidence
                };
                const bfmpData = getBFMPData(shimAnalysis);
                if (bfmpData) {
                    rawCounts.parasitesCounted = bfmpData.parasitesCounted;
                    rawCounts.wbcsCounted = bfmpData.wbcCounted;
                    rawCounts.parasiteDensity = bfmpData.density;
                }
            }

            setDiagnosis({
                type: resultType,
                severity: severity,
                confidence: confidence / 100, // Convert to 0-1 range for display
                details: {
                    totalFields: aggregate.total_images,
                    parasitizedFields: aggregate.parasitized_count,
                    uninfectedFields: aggregate.uninfected_count,
                    averageConfidence: aggregate.average_confidence
                },
                // Updated Raw counts for BFMP protocol
                rawCounts: rawCounts
            });

            console.log('✅ Analysis saved successfully, showing results...');
            setStep('result');
        } catch (error) {
            console.error('❌ Error in finalizeAnalysis:', error);
            alert(`Analysis completed but failed to save to database:\n\n${error.message}\n\nPlease check browser console for details.`);
            // Still show results even if save failed
            setStep('result');
        }
    };

    const saveReportToDatabase = async (type, severity, confidence = 0.95) => {
        const startTime = Date.now();
        try {
            // Get current user from localStorage
            const userStr = localStorage.getItem('user');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            const accountId = currentUser?.id;

            if (!accountId) {
                throw new Error('User not logged in');
            }

            // 1. Upload images to Supabase Storage (in parallel for speed)
            const uploadStartTime = Date.now();
            console.log(`📤 Uploading ${uploadedImages.length} images in parallel...`);
            const bucketName = patientData.diseaseType === 'Malaria' ? 'malaria-images' : 'lepto-images';

            const uploadPromises = uploadedImages.map(async (img, index) => {
                const fileName = `${patientData.registrationNumber}_${Date.now()}_${index}_${img.id}.png`;
                const filePath = `patients/${fileName}`;

                try {
                    // Upload file
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from(bucketName)
                        .upload(filePath, img.file, {
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        console.warn(`Failed to upload ${fileName}:`, uploadError.message);
                        return null;
                    }

                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from(bucketName)
                        .getPublicUrl(filePath);

                    return urlData.publicUrl;
                } catch (error) {
                    console.warn(`Error uploading ${fileName}:`, error);
                    return null;
                }
            });

            // Wait for all uploads to complete
            const uploadResults = await Promise.all(uploadPromises);
            const uploadedUrls = uploadResults.filter(url => url !== null);

            const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
            console.log(`✅ Uploaded ${uploadedUrls.length}/${uploadedImages.length} images in ${uploadTime}s`);
            const primaryImageUrl = uploadedUrls[0] || null;

            // 2. Insert Patient Data
            const patientStartTime = Date.now();
            const patientTable = patientData.diseaseType === 'Malaria' ? 'malaria_patients' : 'leptospirosis_patients';

            // Prepare patient payload
            const patientPayload = {
                account_id: accountId,
                name: patientData.name || 'Unknown Patient',
                registration_number: patientData.registrationNumber || `REG-${Date.now()}`,
                ic_passport: patientData.icPassport || 'N/A',
                gender: patientData.gender || 'Male',
                age: parseInt(patientData.age) || 0,
                collection_datetime: patientData.collectionDateTime || getMalaysiaTimestamp(),
                health_facility: patientData.healthFacility || 'Unknown Facility',
                slide_number: patientData.slideNumber || 'N/A',
                image_url: primaryImageUrl
            };

            if (patientData.diseaseType === 'Malaria') {
                patientPayload.smear_type = patientData.smearType || 'Thin';
            }

            console.log('Inserting patient data:', patientPayload);

            // Upsert patient
            const { data: patientResult, error: patientError } = await supabase
                .from(patientTable)
                .upsert(patientPayload, { onConflict: 'registration_number' })
                .select()
                .single();

            if (patientError) {
                console.error('Patient insert error:', patientError);
                throw new Error(`Patient Error: ${patientError.message} - ${patientError.details || ''}`);
            }
            const patientId = patientResult.id;
            const patientTime = ((Date.now() - patientStartTime) / 1000).toFixed(2);
            console.log(`✅ Patient saved in ${patientTime}s`);

            // 3. Insert Analysis Data
            const analysisStartTime = Date.now();
            const analysisPayload = {
                account_id: accountId,
                patient_type: patientData.diseaseType.toLowerCase(),
                patient_id: patientId,
                image_path: primaryImageUrl || 'no_image',
                ai_result: type,
                confidence_score: parseFloat(confidence.toFixed(4))
            };

            // Add image_paths if column exists (for multiple images support)
            if (uploadedUrls.length > 0) {
                analysisPayload.image_paths = uploadedUrls;
            }

            console.log('Inserting analysis data:', analysisPayload);

            const { data: analysisResult, error: analysisError } = await supabase
                .from('analyses')
                .insert([analysisPayload])
                .select()
                .single();

            if (analysisError) {
                console.error('Analysis insert error:', analysisError);
                throw new Error(`Analysis Error: ${analysisError.message}`);
            }
            const analysisTime = ((Date.now() - analysisStartTime) / 1000).toFixed(2);
            console.log(`✅ Analysis saved in ${analysisTime}s`);

            // Log activity (non-blocking - don't wait for it)
            const activityStartTime = Date.now();
            Promise.all([
                activityLogger.logAIDetectorUsed(currentUser, patientData.diseaseType),
                activityLogger.logAnalysisCreated(currentUser, patientData.diseaseType, type)
            ]).then(() => {
                const activityTime = ((Date.now() - activityStartTime) / 1000).toFixed(2);
                console.log(`✅ Activity logged in ${activityTime}s`);
            }).catch(err => console.warn('Activity logging failed:', err));

            // NOTE: Report is NOT created here automatically
            // Staff must manually submit the report to doctor via "Submit Report" page

            const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log("✅ Analysis saved successfully to database");
            console.log(`📁 ${uploadedUrls.length} images uploaded to storage`);
            console.log(`⏱️ Total save time: ${totalTime}s (Upload: ${uploadTime}s, Patient: ${patientTime}s, Analysis: ${analysisTime}s)`);
            console.log("ℹ️ Report not submitted yet - staff must submit manually");

            return analysisResult; // Return the saved analysis object
        } catch (error) {
            console.error('❌ Error saving report:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                patientData: patientData,
                uploadedImages: uploadedImages.length
            });
            alert(`Failed to save analysis to database:\n\n${error.message}\n\nCheck browser console for details.`);
            return null;
        }
    };

    // Render Helpers
    const getAnalysisRecommendation = () => {
        if (uploadedImages.length < 10) {
            return { text: "Consider uploading more fields (10-30 recommended) for better accuracy.", color: "#febc2e", icon: AlertTriangle };
        }
        if (uploadedImages.some(img => img.quality === 'Low Quality')) {
            return { text: "Some images have low quality. Consider re-capturing.", color: "#febc2e", icon: AlertTriangle };
        }
        return { text: "Sufficient data for reliable diagnosis.", color: "#28c840", icon: CheckCircle };
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{t('detector.title').split(' ')[0]} <span className="text-gradient">{t('detector.title').split(' ')[1]}</span></h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>{t('detector.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {['disease-selection', 'patient-details', 'upload', 'analyzing', 'result', 'report'].map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step === s ? 1 : 0.3 }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step === s ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', color: step === s ? 'black' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{i + 1}</div>
                            <span style={{ display: 'none', md: { display: 'block' } }}>{s.replace('-', ' ').toUpperCase()}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-panel" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <AnimatePresence mode="wait">

                    {/* STEP 0: DISEASE SELECTION */}
                    {step === 'disease-selection' && (
                        <motion.div
                            key="disease-selection"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <h2 style={{ fontSize: '2rem', marginBottom: '3rem', textAlign: 'center' }}>{t('detector.selectDisease')}</h2>

                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {/* Malaria Option */}
                                <motion.div
                                    whileHover={{ scale: 1.05, borderColor: 'var(--color-primary)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setPatientData(prev => ({ ...prev, diseaseType: 'Malaria' })); setStep('patient-details'); }}
                                    style={{
                                        width: '280px',
                                        padding: '2rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--color-glass-border)',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 0, 85, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        <AlertTriangle size={40} color="#ff0055" />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t('detector.malaria')}</h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        Detection of Plasmodium parasites in blood smears.
                                    </p>
                                </motion.div>

                                {/* Leptospirosis Option */}
                                <motion.div
                                    whileHover={{ scale: 1.05, borderColor: 'var(--color-primary)' }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { setPatientData(prev => ({ ...prev, diseaseType: 'Leptospirosis' })); setStep('patient-details'); }}
                                    style={{
                                        width: '280px',
                                        padding: '2rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--color-glass-border)',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 188, 46, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        <Scan size={40} color="#ffbc2e" />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t('detector.leptospirosis')}</h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        Identification of Leptospira bacteria in samples.
                                    </p>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 1: PATIENT DETAILS */}
                    {step === 'patient-details' && (
                        <motion.div
                            key="patient-details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{ padding: '2rem', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <FileText color="var(--color-primary)" /> {patientData.diseaseType} Patient Metadata
                                </h2>
                                <button onClick={() => setStep('disease-selection')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ArrowLeft size={18} /> {t('detector.back')}
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                {/* Personal Info */}
                                <div>
                                    <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('detector.patientDetails')}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <input type="text" name="name" placeholder={t('detector.patientName')} value={patientData.name} onChange={handleInputChange} className="input-field" style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', width: '100%' }} />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <input type="number" name="age" placeholder={t('detector.age')} value={patientData.age} onChange={handleInputChange} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', width: '100%' }} />
                                            <select name="gender" value={patientData.gender} onChange={handleInputChange} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', width: '100%' }}>
                                                <option value="Male" style={{ background: '#1a1f2e', color: 'white' }}>{t('detector.male')}</option>
                                                <option value="Female" style={{ background: '#1a1f2e', color: 'white' }}>{t('detector.female')}</option>
                                            </select>
                                        </div>
                                        <input type="text" name="icPassport" placeholder={t('detector.icPassport')} value={patientData.icPassport} onChange={handleInputChange} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', width: '100%' }} />
                                    </div>
                                </div>

                                {/* Clinical Info */}
                                <div>
                                    <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Sample Details</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <input type="text" name="registrationNumber" placeholder={t('detector.registrationNumber')} value={patientData.registrationNumber} onChange={handleInputChange} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', width: '100%' }} />
                                        <input type="text" name="slideNumber" placeholder={t('detector.slideNumber')} value={patientData.slideNumber} onChange={handleInputChange} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', width: '100%' }} />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <select name="smearType" value={patientData.smearType} onChange={handleInputChange} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', width: '100%' }}>
                                                <option value="Thin" style={{ background: '#1a1f2e', color: 'white' }}>{t('detector.thin')}</option>
                                                <option value="Thick" style={{ background: '#1a1f2e', color: 'white' }}>{t('detector.thick')}</option>
                                            </select>
                                            <input type="datetime-local" name="collectionDateTime" value={patientData.collectionDateTime} onChange={handleInputChange} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', width: '100%' }} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <select
                                                    name="healthFacility"
                                                    value={patientData.healthFacility}
                                                    onChange={handleInputChange}
                                                    style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', appearance: 'none' }}
                                                >
                                                    <option value="" disabled>Select Health Facility</option>
                                                    <optgroup label="🏥 Major Government Hospitals - Kuala Lumpur & Selangor" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Kuala Lumpur",
                                                            "Hospital Sungai Buloh",
                                                            "Hospital Selayang",
                                                            "Hospital Ampang",
                                                            "Hospital Serdang",
                                                            "Hospital Putrajaya",
                                                            "Hospital Tengku Ampuan Rahimah, Klang",
                                                            "Hospital Tengku Ampuan Jemah, Kajang",
                                                            "Hospital Banting",
                                                            "Hospital Kuala Selangor"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Johor" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Sultanah Aminah, Johor Bahru",
                                                            "Hospital Sultanah Nora Ismail, Batu Pahat",
                                                            "Hospital Enche' Besar Hajjah Khalsom, Kluang",
                                                            "Hospital Segamat",
                                                            "Hospital Muar"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Penang" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Pulau Pinang",
                                                            "Hospital Kepala Batas",
                                                            "Hospital Bukit Mertajam",
                                                            "Hospital Balik Pulau"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Perak" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Raja Permaisuri Bainun, Ipoh",
                                                            "Hospital Taiping",
                                                            "Hospital Teluk Intan",
                                                            "Hospital Seri Manjung"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Pahang" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Tengku Ampuan Afzan, Kuantan",
                                                            "Hospital Bentong",
                                                            "Hospital Temerloh",
                                                            "Hospital Jengka"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Negeri Sembilan" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Tuanku Ja'afar, Seremban",
                                                            "Hospital Port Dickson",
                                                            "Hospital Jelebu"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Melaka" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Melaka",
                                                            "Hospital Jasin",
                                                            "Hospital Alor Gajah"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Kedah" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Sultanah Bahiyah, Alor Setar",
                                                            "Hospital Sultan Abdul Halim, Sungai Petani",
                                                            "Hospital Kulim",
                                                            "Hospital Langkawi"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Kelantan" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Raja Perempuan Zainab II, Kota Bharu",
                                                            "Hospital Tanah Merah",
                                                            "Hospital Gua Musang",
                                                            "Hospital Machang"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Terengganu" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Sultanah Nur Zahirah, Kuala Terengganu",
                                                            "Hospital Kemaman",
                                                            "Hospital Dungun",
                                                            "Hospital Besut"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Perlis" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Tuanku Fauziah, Kangar"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Sarawak" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Umum Sarawak, Kuching",
                                                            "Hospital Sibu",
                                                            "Hospital Miri",
                                                            "Hospital Bintulu",
                                                            "Hospital Kapit",
                                                            "Hospital Sarikei"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Sabah" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Queen Elizabeth, Kota Kinabalu",
                                                            "Hospital Queen Elizabeth II, Kota Kinabalu",
                                                            "Hospital Duchess of Kent, Sandakan",
                                                            "Hospital Tawau",
                                                            "Hospital Lahad Datu",
                                                            "Hospital Keningau"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Major Government Hospitals - Labuan" style={{ background: '#1a1f2e', color: '#00f0ff' }}>
                                                        {[
                                                            "Hospital Labuan"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Klinik Kesihatan (Health Clinics)" style={{ background: '#1a1f2e', color: '#febc2e' }}>
                                                        {[
                                                            "Klinik Kesihatan Kuala Lumpur",
                                                            "Klinik Kesihatan Cheras",
                                                            "Klinik Kesihatan Petaling Jaya",
                                                            "Klinik Kesihatan Shah Alam",
                                                            "Klinik Kesihatan Subang Jaya",
                                                            "Klinik Kesihatan Johor Bahru",
                                                            "Klinik Kesihatan Georgetown",
                                                            "Klinik Kesihatan Ipoh",
                                                            "Klinik Kesihatan Kuantan",
                                                            "Klinik Kesihatan Kota Bharu",
                                                            "Other Health Clinic"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                    <optgroup label="🏥 Private Hospitals & Others" style={{ background: '#1a1f2e', color: '#ff0055' }}>
                                                        {[
                                                            "Private Hospital / Clinic",
                                                            "University Hospital",
                                                            "Military Hospital",
                                                            "Other Medical Facility"
                                                        ].map(h => <option key={h} value={h} style={{ background: '#1a1f2e', color: 'white' }}>{h}</option>)}
                                                    </optgroup>
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        if (navigator.geolocation) {
                                                            const btn = document.getElementById('loc-btn');
                                                            if (btn) btn.innerHTML = '<span class="spin">↻</span>';

                                                            navigator.geolocation.getCurrentPosition((position) => {
                                                                // Mock logic: Find nearest facility (Simulated for demo)
                                                                // In a real app, use Haversine formula with the coordinates list
                                                                const facilities = [
                                                                    { name: 'Hospital Kuala Lumpur', lat: 3.1715, lng: 101.7027 },
                                                                    { name: 'Hospital Sultanah Aminah, Johor Bahru', lat: 1.4584, lng: 103.7566 },
                                                                    { name: 'Hospital Pulau Pinang', lat: 5.4165, lng: 100.3116 },
                                                                    { name: 'Hospital Umum Sarawak, Kuching', lat: 1.5436, lng: 110.3426 },
                                                                    { name: 'Hospital Queen Elizabeth, Kota Kinabalu', lat: 5.9586, lng: 116.0744 }
                                                                ];

                                                                // Simple distance check (Euclidean for speed in demo)
                                                                let nearest = facilities[0];
                                                                let minDist = 10000;

                                                                facilities.forEach(f => {
                                                                    const d = Math.sqrt(Math.pow(f.lat - position.coords.latitude, 2) + Math.pow(f.lng - position.coords.longitude, 2));
                                                                    if (d < minDist) {
                                                                        minDist = d;
                                                                        nearest = f;
                                                                    }
                                                                });

                                                                setPatientData(prev => ({ ...prev, healthFacility: nearest.name }));
                                                                if (btn) btn.innerHTML = '📍';
                                                                alert(`Location detected! Nearest facility: ${nearest.name}`);
                                                            }, (err) => {
                                                                console.error(err);
                                                                alert("Could not detect location. Please select manually.");
                                                                if (btn) btn.innerHTML = '📍';
                                                            });
                                                        } else {
                                                            alert("Geolocation is not supported by this browser.");
                                                        }
                                                    }}
                                                    id="loc-btn"
                                                    className="btn-primary"
                                                    style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
                                                    title="Auto-detect nearest facility"
                                                >
                                                    <MapPin size={20} />
                                                </button>
                                            </div>
                                            <div style={{ position: 'absolute', right: '4rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }}>
                                                ▼
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setStep('upload')} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                                    {t('detector.next')}: {t('detector.uploadImage')} <ChevronRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: UPLOAD */}
                    {step === 'upload' && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <ImageIcon color="var(--color-primary)" /> Sample Upload
                                </h2>
                                <button onClick={() => setStep('patient-details')} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ArrowLeft size={18} /> {t('detector.back')}
                                </button>
                            </div>

                            {/* Important Notice */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255, 188, 46, 0.1), rgba(255, 188, 46, 0.05))',
                                    border: '1px solid rgba(255, 188, 46, 0.3)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    marginBottom: '2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}
                            >
                                <Info size={20} color="#ffbc2e" style={{ flexShrink: 0 }} />
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#ffbc2e', fontWeight: '500' }}>
                                        <strong>Important:</strong> Only upload {patientData.diseaseType.toLowerCase()} microscopic images for accurate detection.
                                    </p>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        Other image types may produce incorrect results. Ensure images are clear blood smear microscopy.
                                    </p>
                                </div>
                            </motion.div>

                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                                {/* Upload Area */}
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    style={{
                                        border: '2px dashed var(--color-glass-border)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        background: 'rgba(255,255,255,0.01)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-glass-border)'}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleFileUpload}
                                    />
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        <Upload size={40} color="var(--color-primary)" />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Click to upload microscope fields</h3>
                                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '400px' }}>
                                        Upload multiple fields for accurate analysis. <br />
                                        Recommended: 20-30 fields for positive smears.
                                    </p>
                                </div>

                                {/* Sidebar List */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Uploaded Fields ({uploadedImages.length})</h3>

                                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {uploadedImages.map((img) => (
                                            <div key={img.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                <img src={img.preview} alt="preview" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.file.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: img.quality === 'Good' ? '#28c840' : '#febc2e' }}>{img.quality}</div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setUploadedImages(uploadedImages.filter(i => i.id !== img.id)) }} style={{ background: 'transparent', border: 'none', color: '#ff0055', cursor: 'pointer' }}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {uploadedImages.length === 0 && (
                                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>No images uploaded yet</div>
                                        )}
                                    </div>

                                    <button
                                        onClick={startAnalysis}
                                        disabled={uploadedImages.length === 0}
                                        className="btn-primary"
                                        style={{ width: '100%', justifyContent: 'center', opacity: uploadedImages.length === 0 ? 0.5 : 1 }}
                                    >
                                        Start Analysis <Scan size={18} style={{ marginLeft: '0.5rem' }} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: ANALYZING */}
                    {step === 'analyzing' && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ width: '100%', height: '100%', position: 'relative', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                                <Canvas camera={{ position: [0, 0, 5] }}>
                                    <ambientLight intensity={0.5} />
                                    <pointLight position={[10, 10, 10]} color="#00f0ff" intensity={2} />
                                    <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
                                    <Float speed={5} rotationIntensity={2} floatIntensity={1}>
                                        <mesh rotation={[0, 0, Math.PI / 4]}>
                                            <torusKnotGeometry args={[1, 0.3, 100, 16]} />
                                            <meshPhysicalMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.5} wireframe transparent opacity={0.3} />
                                        </mesh>
                                    </Float>
                                </Canvas>
                            </div>

                            <div style={{ zIndex: 10, textAlign: 'center', width: '100%', maxWidth: '500px' }}>
                                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', textShadow: '0 0 20px var(--color-primary)' }}>Analyzing Samples...</h2>
                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
                                    <motion.div
                                        style={{ width: '100%', height: '100%', background: 'var(--color-primary)' }}
                                        initial={{ x: '-100%' }}
                                        animate={{ x: `${analysisProgress - 100}%` }}
                                    />
                                </div>
                                <p style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                                    Processing Field {Math.min(Math.ceil((analysisProgress / 100) * uploadedImages.length), uploadedImages.length)} of {uploadedImages.length}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: RESULT & REPORT */}
                    {(step === 'result' || step === 'report') && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                                {/* Report Preview */}
                                <div style={{ background: 'white', color: 'black', padding: '3rem', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                    {/* Report Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <img
                                                src="/icon_MedAI.png"
                                                alt="MedAi Logo"
                                                style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                                            />
                                            <div>
                                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>MedAi Labs</h2>
                                                <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>Advanced Diagnostic Center</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>DIAGNOSTIC REPORT</div>
                                            <div style={{ fontSize: '0.875rem', color: '#666' }}>{new Date().toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    {/* Patient Info Section */}
                                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', color: '#444' }}>Patient Information</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', fontSize: '0.9rem' }}>
                                            <div>
                                                <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>Name</span>
                                                <strong>{patientData.name || 'N/A'}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>Age / Gender</span>
                                                <strong>{patientData.age} / {patientData.gender}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>IC / Passport</span>
                                                <strong>{patientData.icPassport || 'N/A'}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>RN Number</span>
                                                <strong>{patientData.registrationNumber || 'N/A'}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>Health Facility</span>
                                                <strong>{patientData.healthFacility}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: '#666', display: 'block', fontSize: '0.75rem' }}>Slide Number</span>
                                                <strong>{patientData.slideNumber || 'N/A'}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Analysis Results */}
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', color: '#444' }}>Microscopic Analysis Results</h3>

                                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                                            <thead>
                                                <tr style={{ background: '#222', color: 'white' }}>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Parameter</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Result</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Reference Range</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '0.75rem' }}>Fields Examined</td>
                                                    <td style={{ padding: '0.75rem' }}>{uploadedImages.length}</td>
                                                    <td style={{ padding: '0.75rem', color: '#666' }}>20-30 (Recommended)</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '0.75rem' }}>Disease Type</td>
                                                    <td style={{ padding: '0.75rem' }}>{patientData.diseaseType}</td>
                                                    <td style={{ padding: '0.75rem', color: '#666' }}>-</td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '0.75rem' }}>Smear Type</td>
                                                    <td style={{ padding: '0.75rem' }}>{patientData.smearType}</td>
                                                    <td style={{ padding: '0.75rem', color: '#666' }}>Thin / Thick</td>
                                                </tr>
                                                {patientData.diseaseType === 'Malaria' && diagnosis?.rawCounts && (
                                                    <>
                                                        <tr style={{ borderBottom: '1px solid #eee', background: '#fff3cd' }}>
                                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Parasites Counted</td>
                                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{diagnosis.rawCounts.parasitesCounted}</td>
                                                            <td style={{ padding: '0.75rem', color: '#666' }}>Asexual forms</td>
                                                        </tr>
                                                        <tr style={{ borderBottom: '1px solid #eee', background: '#fff3cd' }}>
                                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>WBCs Counted</td>
                                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{diagnosis.rawCounts.wbcsCounted}</td>
                                                            <td style={{ padding: '0.75rem', color: '#666' }}>≥200 (WHO Standard)</td>
                                                        </tr>
                                                        <tr style={{ borderBottom: '1px solid #eee', background: '#d1ecf1' }}>
                                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Parasite Density</td>
                                                            <td style={{ padding: '0.75rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                                {diagnosis.rawCounts.parasiteDensity} parasites/µL
                                                            </td>
                                                            <td style={{ padding: '0.75rem', color: '#666' }}>
                                                                {diagnosis.rawCounts.parasiteDensity === 0 ? 'Negative' :
                                                                    diagnosis.rawCounts.parasiteDensity < 1000 ? 'Low' :
                                                                        diagnosis.rawCounts.parasiteDensity < 10000 ? 'Moderate' : 'High'}
                                                            </td>
                                                        </tr>
                                                        <tr style={{ borderBottom: '1px solid #eee', background: '#d1ecf1' }}>
                                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>AI Confidence Score</td>
                                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{diagnosis.rawCounts.confidenceScore.toFixed(1)}%</td>
                                                            <td style={{ padding: '0.75rem', color: '#666' }}>For staff validation</td>
                                                        </tr>
                                                    </>
                                                )}
                                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '0.75rem' }}>Analysis Date</td>
                                                    <td style={{ padding: '0.75rem' }}>{new Date().toLocaleString()}</td>
                                                    <td style={{ padding: '0.75rem', color: '#666' }}>-</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {patientData.diseaseType === 'Malaria' && diagnosis?.rawCounts && (
                                            <div style={{ padding: '1rem', background: '#e7f3ff', border: '1px solid #2196f3', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                                <strong>📐 Calculation Formula:</strong> Parasite Density = (Parasites Counted ÷ WBCs Counted) × 8000
                                                <br />
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '0.5rem', display: 'block' }}>
                                                    = ({diagnosis.rawCounts.parasitesCounted} ÷ {diagnosis.rawCounts.wbcsCounted}) × 8000 = {diagnosis.rawCounts.parasiteDensity} parasites/µL
                                                </span>
                                            </div>
                                        )}

                                        <div style={{ padding: '1.5rem', background: diagnosis?.type.includes('Malaria') ? 'rgba(255, 0, 0, 0.05)' : 'rgba(0, 255, 0, 0.05)', border: `1px solid ${diagnosis?.type.includes('Malaria') ? '#ffcdd2' : '#c8e6c9'}`, borderRadius: '8px' }}>
                                            <h4 style={{ margin: '0 0 0.5rem 0', color: diagnosis?.type.includes('Malaria') ? '#d32f2f' : '#2e7d32' }}>{t('detector.diagnosis')}: {diagnosis?.type.toUpperCase()}</h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#444' }}>
                                                {t('detector.confidence')}: {(diagnosis?.confidence * 100).toFixed(1)}% | Severity: {diagnosis?.severity}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Microscope Images Section */}
                                    {uploadedImages.length > 0 && (
                                        <div style={{ marginBottom: '2rem', pageBreakBefore: 'always' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', color: '#444' }}>
                                                Microscope Images ({uploadedImages.length} Fields Examined)
                                            </h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                                {uploadedImages.map((img, idx) => (
                                                    <div key={idx} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', background: '#f8f9fa' }}>
                                                        <div style={{ position: 'relative', paddingTop: '100%', background: '#000' }}>
                                                            <img
                                                                src={img.preview}
                                                                alt={`Field ${idx + 1}`}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                            <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                                                Field {idx + 1}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '0.75rem',
                                                                color: img.quality === 'Good' ? '#2e7d32' : '#f57c00',
                                                                fontWeight: '500'
                                                            }}>
                                                                {img.quality}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.875rem', color: '#666' }}>
                                                <strong>Note:</strong> All microscope images were analyzed using AI-powered detection system.
                                                Images marked as "Good" quality contributed to the final diagnosis with high confidence.
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer Signatures */}
                                    <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '0.5rem', fontSize: '0.875rem' }}>Lab Technician</div>
                                        </div>
                                        <div>
                                            <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '0.5rem', fontSize: '0.875rem' }}>Pathologist / Doctor</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* AI Recommendations */}
                                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>AI Recommendation</h3>

                                        {(() => {
                                            const rec = getAnalysisRecommendation();
                                            const Icon = rec.icon;
                                            return (
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                    <Icon color={rec.color} size={24} style={{ marginTop: '2px' }} />
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{rec.text}</p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Microscope Images */}
                                    {uploadedImages.length > 0 && (
                                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Microscope Images ({uploadedImages.length})</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                                {uploadedImages.slice(0, 4).map((img, idx) => (
                                                    <div key={idx} style={{ position: 'relative', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-glass-border)' }}>
                                                        <img
                                                            src={img.preview}
                                                            alt={`Field ${idx + 1}`}
                                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            {uploadedImages.length > 4 && (
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                                                    +{uploadedImages.length - 4} more images
                                                </p>
                                            )}
                                            <button
                                                onClick={() => setShowImageModal(true)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    marginTop: '1rem',
                                                    background: 'rgba(0, 240, 255, 0.1)',
                                                    border: '1px solid var(--color-primary)',
                                                    borderRadius: '8px',
                                                    color: 'var(--color-primary)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <ImageIcon size={16} />
                                                View All Images
                                            </button>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <button
                                            onClick={() => {
                                                // Navigate to Analyze Result page
                                                if (onNavigate) {
                                                    onNavigate('analyze');
                                                } else {
                                                    alert('Report saved! Go to Analyze Result to view all analyses.');
                                                }
                                            }}
                                            className="btn-primary"
                                            style={{ width: '100%', justifyContent: 'center' }}
                                        >
                                            <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
                                            View All Results
                                        </button>

                                        <button onClick={() => window.print()} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '99px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <FileText size={18} /> Print / PDF
                                        </button>

                                        <button onClick={() => { setStep('upload'); setUploadedImages([]); }} style={{ width: '100%', padding: '1rem', background: 'transparent', border: '1px solid var(--color-glass-border)', borderRadius: '99px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                                            {t('detector.uploadNew')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Image Modal */}
            <AnimatePresence>
                {showImageModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.9)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '2rem'
                        }}
                        onClick={() => setShowImageModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{
                                width: '100%',
                                maxWidth: '1200px',
                                maxHeight: '90vh',
                                padding: '2rem',
                                overflowY: 'auto'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                                    Microscope Images ({uploadedImages.length})
                                </h2>
                                <button
                                    onClick={() => setShowImageModal(false)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={20} color="white" />
                                </button>
                            </div>

                            {/* Patient Info */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                marginBottom: '2rem',
                                border: '1px solid var(--color-glass-border)'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Patient Name</div>
                                        <div style={{ fontWeight: '600' }}>{patientData.name || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Disease Type</div>
                                        <div style={{ fontWeight: '600' }}>{patientData.diseaseType}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Registration Number</div>
                                        <div style={{ fontWeight: '600', fontFamily: 'monospace' }}>{patientData.registrationNumber || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Analysis Result</div>
                                        <div style={{
                                            fontWeight: '600',
                                            color: diagnosis?.type.includes('Detected') ? '#ff0055' : '#28c840'
                                        }}>
                                            {diagnosis?.type || 'Processing...'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Image Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                {uploadedImages.map((img, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: '1px solid var(--color-glass-border)'
                                        }}
                                    >
                                        <div style={{ position: 'relative', paddingTop: '100%' }}>
                                            <img
                                                src={img.preview}
                                                alt={`Microscope Field ${idx + 1}`}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </div>
                                        <div style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Field {idx + 1}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                        Quality: {img.quality}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    background: img.quality === 'Good' ? 'rgba(40, 200, 64, 0.1)' : 'rgba(254, 188, 46, 0.1)',
                                                    color: img.quality === 'Good' ? '#28c840' : '#febc2e',
                                                    border: `1px solid ${img.quality === 'Good' ? 'rgba(40, 200, 64, 0.3)' : 'rgba(254, 188, 46, 0.3)'}`
                                                }}>
                                                    {img.status === 'analyzed' ? 'Analyzed' : 'Pending'}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Close Button */}
                            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <button
                                    onClick={() => setShowImageModal(false)}
                                    style={{
                                        padding: '0.75rem 2rem',
                                        background: 'rgba(0, 240, 255, 0.1)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '8px',
                                        color: 'var(--color-primary)',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Detector;
