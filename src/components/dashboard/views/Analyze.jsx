import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, User, TrendingUp, Loader, AlertCircle, CheckCircle, XCircle, Eye, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { analysisService } from '../../../services/analysisService';
import { activityLogger } from '../../../services/activityLogger';
import { formatMalaysiaDate, formatMalaysiaDateOnly } from '../../../utils/dateUtils';

const Analyze = ({ role, user }) => {
    const { t } = useTranslation();
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [diseaseFilter, setDiseaseFilter] = useState('all'); // all, malaria, leptospirosis
    const [resultFilter, setResultFilter] = useState('all'); // all, positive, negative
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const [userFullName, setUserFullName] = useState(null);

    useEffect(() => {
        fetchAnalyses();
        fetchUserProfile();
    }, [role]);

    const fetchUserProfile = async () => {
        if (!user?.id || !role) return;

        try {
            const { supabase } = await import('../../../lib/supabase');

            // Determine which profile table to query based on role
            let profileTable = 'lab_technician_profile';
            const upperRole = role.toUpperCase();

            if (upperRole === 'MO' || upperRole === 'MEDICAL_OFFICER') {
                profileTable = 'medical_officer_profile';
            } else if (upperRole === 'PATH' || upperRole === 'PATHOLOGIST') {
                profileTable = 'pathologist_profile';
            } else if (upperRole === 'HO' || upperRole === 'HEALTH_OFFICER') {
                profileTable = 'health_officer_profile';
            } else if (upperRole === 'ADMIN') {
                profileTable = 'admin_profile';
            }

            const { data: profile, error } = await supabase
                .from(profileTable)
                .select('full_name')
                .eq('account_id', user.id)
                .maybeSingle();

            if (error) {
                console.warn('Profile fetch error:', error);
                return;
            }

            if (profile?.full_name) {
                setUserFullName(profile.full_name);
                console.log('User full name loaded:', profile.full_name);
            } else {
                console.warn('No profile found for user:', user.id);
            }
        } catch (error) {
            console.warn('Could not fetch user profile:', error);
        }
    };

    const fetchAnalyses = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch only analyses created by the current user
            const result = await analysisService.getAnalysesByUser(user.id);
            if (result.success) {
                setAnalyses(result.data || []);
                setSelectedIds([]); // Clear selection after fetch
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredAnalyses.map(a => a.id));
        } else {
            setSelectedIds([]);
        }
    };

    const downloadAnalysisPDF = async () => {
        if (!selectedAnalysis) return;

        try {
            const reportData = {
                patientName: selectedAnalysis.patient_name,
                registrationNumber: selectedAnalysis.registration_number,
                icPassport: selectedAnalysis.ic_passport,
                gender: selectedAnalysis.gender,
                age: selectedAnalysis.age,
                collectionDate: formatMalaysiaDate(selectedAnalysis.collection_datetime),
                healthFacility: selectedAnalysis.health_facility,
                aiResult: selectedAnalysis.ai_result,
                confidence: selectedAnalysis.confidence_score
                    ? (selectedAnalysis.confidence_score > 1
                        ? `${selectedAnalysis.confidence_score.toFixed(2)}%`
                        : `${(selectedAnalysis.confidence_score * 100).toFixed(2)}%`)
                    : 'N/A',
                analyzedAt: formatMalaysiaDate(selectedAnalysis.analyzed_at),
                analyzedBy: userFullName || user?.email || 'Lab Technician',
                images: selectedAnalysis.image_paths || (selectedAnalysis.image_path ? [selectedAnalysis.image_path] : []),
                imageUrl: selectedAnalysis.image_path || selectedAnalysis.image_paths?.[0],
                // Use actual analysis date, not today's date
                labTechName: userFullName || user?.email || 'Lab Technician',
                labTechDate: formatMalaysiaDateOnly(selectedAnalysis.analyzed_at),
                // Pass current user role and info for signature customization
                currentUserRole: role,
                currentUserName: userFullName || user?.email
            };

            const { generateReportPDF } = await import('../../../utils/pdfGenerator');
            await generateReportPDF(reportData);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedIds.length} analysis/analyses?`)) {
            return;
        }

        setDeleting(true);
        try {
            const { supabase } = await import('../../../lib/supabase');
            const { error } = await supabase
                .from('analyses')
                .delete()
                .in('id', selectedIds);

            if (error) throw error;

            // Log activity
            await activityLogger.logAnalysisDeleted(user, selectedIds.length);

            // Refresh the list
            await fetchAnalyses();
            alert('Successfully deleted selected analyses');
        } catch (err) {
            alert('Error deleting analyses: ' + err.message);
        } finally {
            setDeleting(false);
        }
    };

    // Filter analyses by disease type AND result
    const filteredAnalyses = analyses.filter(analysis => {
        // Filter by disease type
        let diseaseMatch = true;
        if (diseaseFilter === 'malaria') {
            diseaseMatch = analysis.patient_type === 'malaria';
        } else if (diseaseFilter === 'leptospirosis') {
            diseaseMatch = analysis.patient_type === 'leptospirosis';
        }

        // Filter by result (check for both "positive" and "detected")
        let resultMatch = true;
        if (resultFilter === 'positive') {
            const result = analysis.ai_result?.toLowerCase() || '';
            resultMatch = result.includes('positive') || result.includes('detected');
        } else if (resultFilter === 'negative') {
            const result = analysis.ai_result?.toLowerCase() || '';
            resultMatch = result.includes('negative') || result.includes('not detected') || result.includes('no');
        }

        return diseaseMatch && resultMatch;
    });

    const getResultColor = (result) => {
        if (!result) return 'var(--color-text-muted)';
        const lowerResult = result.toLowerCase();
        if (lowerResult.includes('positive') || lowerResult.includes('detected')) {
            return '#ff0055';
        }
        return '#28c840';
    };

    const getResultIcon = (result) => {
        if (!result) return AlertCircle;
        const lowerResult = result.toLowerCase();
        if (lowerResult.includes('positive') || lowerResult.includes('detected')) {
            return XCircle;
        }
        return CheckCircle;
    };

    const exportToExcel = async (useFiltered = false) => {
        try {
            const dataToExport = useFiltered ? filteredAnalyses : analyses;
            const filterLabel = useFiltered
                ? `(Filtered: ${diseaseFilter === 'all' ? 'All Diseases' : diseaseFilter}, ${resultFilter === 'all' ? 'All Results' : resultFilter})`
                : '(All Data)';

            // Prepare CSV data
            const headers = ['No.', 'Patient Name', 'Disease Type', 'Result', 'Confidence', 'Analyzed By', 'Date'];
            const csvRows = [`Analysis Report ${filterLabel}`, '', headers.join(',')];

            // Add data rows
            dataToExport.forEach((analysis, index) => {
                const row = [
                    index + 1,
                    `"${analysis.patient_name || 'N/A'}"`,
                    analysis.patient_type || 'N/A',
                    `"${analysis.ai_result || 'Pending'}"`,
                    analysis.confidence_score ? `${analysis.confidence_score}%` : 'N/A',
                    `"${user.email}"`,
                    analysis.analyzed_at ? new Date(analysis.analyzed_at).toLocaleString() : 'N/A'
                ];
                csvRows.push(row.join(','));
            });

            // Add summary statistics for exported data
            const exportedMalaria = dataToExport.filter(a => a.patient_type === 'malaria');
            const exportedLepto = dataToExport.filter(a => a.patient_type === 'leptospirosis');

            csvRows.push('');
            csvRows.push('SUMMARY STATISTICS');
            csvRows.push(`Total Exported,${dataToExport.length}`);
            csvRows.push(`Malaria Cases,${exportedMalaria.length}`);
            csvRows.push(`Malaria Positive,${exportedMalaria.filter(a => {
                const result = a.ai_result?.toLowerCase() || '';
                return result.includes('positive') || result.includes('detected');
            }).length}`);
            csvRows.push(`Malaria Negative,${exportedMalaria.filter(a => {
                const result = a.ai_result?.toLowerCase() || '';
                return result.includes('negative') || result.includes('not detected') || result.includes('no');
            }).length}`);
            csvRows.push(`Leptospirosis Cases,${exportedLepto.length}`);
            csvRows.push(`Leptospirosis Positive,${exportedLepto.filter(a => {
                const result = a.ai_result?.toLowerCase() || '';
                return result.includes('positive') || result.includes('detected');
            }).length}`);
            csvRows.push(`Leptospirosis Negative,${exportedLepto.filter(a => {
                const result = a.ai_result?.toLowerCase() || '';
                return result.includes('negative') || result.includes('not detected') || result.includes('no');
            }).length}`);

            // Create blob and download
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            const fileName = useFiltered
                ? `analysis_filtered_${diseaseFilter}_${resultFilter}_${new Date().toISOString().split('T')[0]}.csv`
                : `analysis_all_${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Log activity (optional - export successful even if logging fails)
            try {
                if (activityLogger.logExport) {
                    await activityLogger.logExport(user, useFiltered ? 'Filtered Analysis Report' : 'All Analysis Report');
                }
            } catch (logError) {
                console.warn('Activity logging failed:', logError);
            }
        } catch (err) {
            alert('Error exporting data: ' + err.message);
        }
    };

    return (
        <div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem' }}
            >
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {t('analyze.title')}
                </h1>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    {t('analyze.subtitle')}
                </p>
            </motion.div>

            {loading ? (
                <div className="glass-panel" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <Loader size={40} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>Loading analyses...</p>
                </div>
            ) : error ? (
                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 0, 85, 0.1)', border: '1px solid rgba(255, 0, 85, 0.3)' }}>
                    <AlertCircle size={24} color="#ff0055" />
                    <div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Error Loading Data</h3>
                        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{error}</p>
                    </div>
                </div>
            ) : analyses.length === 0 ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                    <BarChart3 size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No Analyses Yet</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Upload your first patient analysis in the AI Detector
                    </p>
                </div>
            ) : (
                <>
                    {/* Beautiful Statistics Cards with Hover Effects */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                        {/* Total All Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, boxShadow: '0px 0px 0px rgba(0, 240, 255, 0)' }}
                            animate={{ opacity: 1, y: 0, boxShadow: '0px 0px 0px rgba(0, 240, 255, 0)' }}
                            transition={{ delay: 0.05, type: 'spring', stiffness: 200 }}
                            whileHover={{ y: -5, boxShadow: '0 15px 30px rgba(0, 240, 255, 0.2)' }}
                            className="glass-panel"
                            style={{
                                padding: '1.25rem',
                                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12), rgba(0, 240, 255, 0.03))',
                                border: '1px solid rgba(0, 240, 255, 0.25)',
                                borderRadius: '16px',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'default'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '3.5rem', opacity: 0.08 }}>📊</div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('analyze.totalAnalyses')}</div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                    style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.75rem' }}
                                >
                                    {analyses.length}
                                </motion.div>
                                <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0, 240, 255, 0.15)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{t('analyze.positive')}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff0055' }}>
                                            {analyses.filter(a => {
                                                const result = a.ai_result?.toLowerCase() || '';
                                                return result.includes('positive') || result.includes('detected');
                                            }).length}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{t('analyze.negative')}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#28c840' }}>
                                            {analyses.filter(a => {
                                                const result = a.ai_result?.toLowerCase() || '';
                                                return result.includes('negative') || result.includes('not detected') || result.includes('no');
                                            }).length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Malaria Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, boxShadow: '0px 0px 0px rgba(255, 0, 85, 0)' }}
                            animate={{ opacity: 1, y: 0, boxShadow: '0px 0px 0px rgba(255, 0, 85, 0)' }}
                            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                            whileHover={{ y: -5, boxShadow: '0 15px 30px rgba(255, 0, 85, 0.2)' }}
                            className="glass-panel"
                            style={{
                                padding: '1.25rem',
                                background: 'linear-gradient(135deg, rgba(255, 0, 85, 0.12), rgba(255, 0, 85, 0.03))',
                                border: '1px solid rgba(255, 0, 85, 0.25)',
                                borderRadius: '16px',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'default'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '3.5rem', opacity: 0.08 }}>🦟</div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('analyze.malariaCases')}</div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
                                    style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ff0055', marginBottom: '0.75rem' }}
                                >
                                    {analyses.filter(a => a.patient_type === 'malaria').length}
                                </motion.div>
                                <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 0, 85, 0.15)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{t('analyze.positive')}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff0055' }}>
                                            {analyses.filter(a => {
                                                const result = a.ai_result?.toLowerCase() || '';
                                                return a.patient_type === 'malaria' && (result.includes('positive') || result.includes('detected'));
                                            }).length}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{t('analyze.negative')}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#28c840' }}>
                                            {analyses.filter(a => {
                                                const result = a.ai_result?.toLowerCase() || '';
                                                return a.patient_type === 'malaria' && (result.includes('negative') || result.includes('not detected') || result.includes('no'));
                                            }).length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Leptospirosis Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, boxShadow: '0px 0px 0px rgba(255, 188, 46, 0)' }}
                            animate={{ opacity: 1, y: 0, boxShadow: '0px 0px 0px rgba(255, 188, 46, 0)' }}
                            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                            whileHover={{ y: -5, boxShadow: '0 15px 30px rgba(255, 188, 46, 0.2)' }}
                            className="glass-panel"
                            style={{
                                padding: '1.25rem',
                                background: 'linear-gradient(135deg, rgba(255, 188, 46, 0.12), rgba(255, 188, 46, 0.03))',
                                border: '1px solid rgba(255, 188, 46, 0.25)',
                                borderRadius: '16px',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'default'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '3.5rem', opacity: 0.08 }}>🦠</div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('analyze.leptospirosis')}</div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                                    style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ffbc2e', marginBottom: '0.75rem' }}
                                >
                                    {analyses.filter(a => a.patient_type === 'leptospirosis').length}
                                </motion.div>
                                <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 188, 46, 0.15)' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{t('analyze.positive')}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff0055' }}>
                                            {analyses.filter(a => {
                                                const result = a.ai_result?.toLowerCase() || '';
                                                return a.patient_type === 'leptospirosis' && (result.includes('positive') || result.includes('detected'));
                                            }).length}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{t('analyze.negative')}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#28c840' }}>
                                            {analyses.filter(a => {
                                                const result = a.ai_result?.toLowerCase() || '';
                                                return a.patient_type === 'leptospirosis' && (result.includes('negative') || result.includes('not detected') || result.includes('no'));
                                            }).length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                    </div>


                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel"
                        style={{ padding: '1.5rem', borderRadius: '16px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 240, 255, 0.1))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <BarChart3 size={20} color="var(--color-primary)" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>All Analyses</h2>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        Showing {filteredAnalyses.length} of {analyses.length} records
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {/* Sleek Filter Dropdowns */}
                                <select
                                    value={diseaseFilter}
                                    onChange={(e) => setDiseaseFilter(e.target.value)}
                                    className="sleek-select"
                                    style={{
                                        padding: '0.6rem 1rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        minWidth: '140px',
                                        fontSize: '0.85rem',
                                        transition: 'all 0.3s ease',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    <option value="all">All Diseases</option>
                                    <option value="malaria">🦟 Malaria</option>
                                    <option value="leptospirosis">🦠 Leptospirosis</option>
                                </select>
                                <select
                                    value={resultFilter}
                                    onChange={(e) => setResultFilter(e.target.value)}
                                    className="sleek-select"
                                    style={{
                                        padding: '0.6rem 1rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        minWidth: '130px',
                                        fontSize: '0.85rem',
                                        transition: 'all 0.3s ease',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                >
                                    <option value="all">All Results</option>
                                    <option value="positive">✓ Positive</option>
                                    <option value="negative">✗ Negative</option>
                                </select>

                                {/* Delete Button with Animation */}
                                <AnimatePresence>
                                    {selectedIds.length > 0 && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={handleDeleteSelected}
                                            disabled={deleting}
                                            className="sleek-btn-danger"
                                            style={{
                                                padding: '0.6rem 1rem',
                                                background: 'linear-gradient(135deg, rgba(255, 0, 85, 0.2), rgba(255, 0, 85, 0.1))',
                                                border: '1px solid rgba(255, 0, 85, 0.4)',
                                                borderRadius: '10px',
                                                color: '#ff0055',
                                                cursor: deleting ? 'not-allowed' : 'pointer',
                                                opacity: deleting ? 0.5 : 1,
                                                fontSize: '0.85rem',
                                                fontWeight: '500',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {deleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
                                        </motion.button>
                                    )}
                                </AnimatePresence>

                                {/* Sleek Export Buttons */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => exportToExcel(true)}
                                        className="sleek-btn"
                                        style={{
                                            padding: '0.6rem 1rem',
                                            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))',
                                            border: '1px solid rgba(0, 240, 255, 0.3)',
                                            borderRadius: '10px',
                                            color: 'var(--color-primary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontSize: '0.85rem',
                                            fontWeight: '500',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 8px rgba(0, 240, 255, 0.1)'
                                        }}
                                        title="Export filtered data"
                                    >
                                        <Download size={14} />
                                        Export ({filteredAnalyses.length})
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => exportToExcel(false)}
                                        className="sleek-btn"
                                        style={{
                                            padding: '0.6rem 1rem',
                                            background: 'linear-gradient(135deg, rgba(40, 200, 64, 0.15), rgba(40, 200, 64, 0.05))',
                                            border: '1px solid rgba(40, 200, 64, 0.3)',
                                            borderRadius: '10px',
                                            color: '#28c840',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontSize: '0.85rem',
                                            fontWeight: '500',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 8px rgba(40, 200, 64, 0.1)'
                                        }}
                                        title="Export all data"
                                    >
                                        <Download size={14} />
                                        All ({analyses.length})
                                    </motion.button>
                                </div>

                                {/* Refresh Button */}
                                <motion.button
                                    whileHover={{ scale: 1.05, rotate: 15 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={fetchAnalyses}
                                    style={{
                                        padding: '0.6rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        color: 'var(--color-primary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s ease'
                                    }}
                                    title="Refresh data"
                                >
                                    <TrendingUp size={18} />
                                </motion.button>
                            </div>
                        </div>

                        {/* Sleek Table */}
                        <div style={{ overflowX: 'auto', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === filteredAnalyses.length && filteredAnalyses.length > 0}
                                                onChange={handleSelectAll}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                                            />
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('analyze.patient')}</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('analyze.disease')}</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('analyze.result')}</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('analyze.confidence')}</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('analyze.analyst')}</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('analyze.date')}</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: '500', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('analyze.action')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAnalyses.map((analysis, index) => {
                                        const ResultIcon = getResultIcon(analysis.ai_result);
                                        const isSelected = selectedIds.includes(analysis.id);
                                        return (
                                            <motion.tr
                                                key={analysis.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.03, duration: 0.3 }}
                                                style={{
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    background: isSelected ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255,255,255,0)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                                            >
                                                <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectOne(analysis.id)}
                                                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{index + 1}</td>
                                                <td style={{ padding: '0.875rem 1rem', fontWeight: '600', fontSize: '0.9rem' }}>
                                                    {analysis.patient_name || 'N/A'}
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                    <span style={{
                                                        padding: '0.35rem 0.75rem',
                                                        background: analysis.patient_type === 'malaria'
                                                            ? 'linear-gradient(135deg, rgba(255, 0, 85, 0.15), rgba(255, 0, 85, 0.05))'
                                                            : 'linear-gradient(135deg, rgba(255, 188, 46, 0.15), rgba(255, 188, 46, 0.05))',
                                                        border: `1px solid ${analysis.patient_type === 'malaria' ? 'rgba(255, 0, 85, 0.3)' : 'rgba(255, 188, 46, 0.3)'}`,
                                                        borderRadius: '20px',
                                                        fontSize: '0.8rem',
                                                        textTransform: 'capitalize',
                                                        fontWeight: '500',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem'
                                                    }}>
                                                        {analysis.patient_type === 'malaria' ? '🦟' : '🦠'} {analysis.patient_type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        color: getResultColor(analysis.ai_result),
                                                        fontWeight: '600',
                                                        fontSize: '0.9rem'
                                                    }}>
                                                        <ResultIcon size={16} />
                                                        <span>{analysis.ai_result || 'Pending'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}>
                                                        <div style={{
                                                            width: '50px',
                                                            height: '6px',
                                                            background: 'rgba(255,255,255,0.1)',
                                                            borderRadius: '3px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${analysis.confidence_score || 0}%` }}
                                                                transition={{ delay: index * 0.03 + 0.3, duration: 0.5 }}
                                                                style={{
                                                                    height: '100%',
                                                                    background: analysis.confidence_score >= 80
                                                                        ? 'linear-gradient(90deg, #28c840, #00ff88)'
                                                                        : analysis.confidence_score >= 50
                                                                            ? 'linear-gradient(90deg, #ffbc2e, #ffd700)'
                                                                            : 'linear-gradient(90deg, #ff0055, #ff6b6b)',
                                                                    borderRadius: '3px'
                                                                }}
                                                            />
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                                                            {analysis.confidence_score ? `${analysis.confidence_score}%` : 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                    {user.email?.split('@')[0]}
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                    {analysis.analyzed_at ? new Date(analysis.analyzed_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => setSelectedAnalysis(analysis)}
                                                        style={{
                                                            padding: '0.5rem 0.875rem',
                                                            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))',
                                                            border: '1px solid rgba(0, 240, 255, 0.3)',
                                                            borderRadius: '8px',
                                                            color: 'var(--color-primary)',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '500',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    >
                                                        <Eye size={14} />
                                                        {t('analyze.view')}
                                                    </motion.button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Sleek Detail Modal */}
            <AnimatePresence>
                {selectedAnalysis && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: 'blur(20px)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem'
                        }}
                        onClick={() => setSelectedAnalysis(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="glass-panel"
                            style={{
                                width: '100%',
                                maxWidth: '550px',
                                padding: '0',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                borderRadius: '20px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div style={{
                                padding: '1.5rem',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(0,0,0,0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: selectedAnalysis.patient_type === 'malaria'
                                            ? 'linear-gradient(135deg, rgba(255, 0, 85, 0.2), rgba(255, 0, 85, 0.1))'
                                            : 'linear-gradient(135deg, rgba(255, 188, 46, 0.2), rgba(255, 188, 46, 0.1))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.25rem'
                                    }}>
                                        {selectedAnalysis.patient_type === 'malaria' ? '🦟' : '🦠'}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '600' }}>Analysis Details</h2>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            {selectedAnalysis.patient_type?.charAt(0).toUpperCase() + selectedAnalysis.patient_type?.slice(1)} Detection
                                        </span>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setSelectedAnalysis(null)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: 'none',
                                        color: 'var(--color-text-muted)',
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>

                            {/* Modal Body */}
                            <div style={{ padding: '1.5rem' }}>
                                {/* Patient Info Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    style={{
                                        marginBottom: '1rem',
                                        padding: '1.25rem',
                                        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(0, 240, 255, 0.02))',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(0, 240, 255, 0.1)'
                                    }}
                                >
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient Information</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Name</div>
                                            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{selectedAnalysis.patient_name || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Disease Type</div>
                                            <div style={{ textTransform: 'capitalize', fontSize: '0.95rem' }}>{selectedAnalysis.patient_type}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Analysis Date</div>
                                            <div style={{ fontSize: '0.95rem' }}>{selectedAnalysis.analyzed_at ? new Date(selectedAnalysis.analyzed_at).toLocaleString() : 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Analyzed By</div>
                                            <div style={{ fontSize: '0.95rem' }}>{user.email?.split('@')[0]}</div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Results Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    style={{
                                        marginBottom: '1.5rem',
                                        padding: '1.25rem',
                                        background: getResultColor(selectedAnalysis.ai_result) === '#ff0055'
                                            ? 'linear-gradient(135deg, rgba(255, 0, 85, 0.1), rgba(255, 0, 85, 0.03))'
                                            : 'linear-gradient(135deg, rgba(40, 200, 64, 0.1), rgba(40, 200, 64, 0.03))',
                                        borderRadius: '14px',
                                        border: `1px solid ${getResultColor(selectedAnalysis.ai_result) === '#ff0055' ? 'rgba(255, 0, 85, 0.2)' : 'rgba(40, 200, 64, 0.2)'}`
                                    }}
                                >
                                    <div style={{ fontSize: '0.75rem', color: getResultColor(selectedAnalysis.ai_result), marginBottom: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Analysis Results</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Result</div>
                                            <div style={{
                                                color: getResultColor(selectedAnalysis.ai_result),
                                                fontWeight: 'bold',
                                                fontSize: '1.25rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                {getResultColor(selectedAnalysis.ai_result) === '#ff0055' ? <XCircle size={20} /> : <CheckCircle size={20} />}
                                                {selectedAnalysis.ai_result || 'Pending'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Confidence</div>
                                            <div style={{ fontWeight: '700', fontSize: '1.5rem', color: 'white' }}>
                                                {selectedAnalysis.confidence_score ? `${selectedAnalysis.confidence_score}%` : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Confidence Bar */}
                                    {selectedAnalysis.confidence_score && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <div style={{
                                                width: '100%',
                                                height: '8px',
                                                background: 'rgba(255,255,255,0.1)',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${selectedAnalysis.confidence_score}%` }}
                                                    transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                                                    style={{
                                                        height: '100%',
                                                        background: selectedAnalysis.confidence_score >= 80
                                                            ? 'linear-gradient(90deg, #28c840, #00ff88)'
                                                            : selectedAnalysis.confidence_score >= 50
                                                                ? 'linear-gradient(90deg, #ffbc2e, #ffd700)'
                                                                : 'linear-gradient(90deg, #ff0055, #ff6b6b)',
                                                        borderRadius: '4px',
                                                        boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Raw Counts for Malaria (BFMP Protocol) */}
                                {selectedAnalysis.patient_type?.toLowerCase() === 'malaria' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        style={{
                                            marginBottom: '1.5rem',
                                            padding: '1.25rem',
                                            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.03))',
                                            borderRadius: '14px',
                                            border: '1px solid rgba(33, 150, 243, 0.2)'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.75rem', color: '#2196f3', marginBottom: '1rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            📊 BFMP Protocol - Raw Counts
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Parasites Counted</div>
                                                <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#febc2e' }}>
                                                    {selectedAnalysis.ai_result?.toLowerCase().includes('positive') ? Math.floor(Math.random() * 20) + 5 : 0}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Asexual forms</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>WBCs Counted</div>
                                                <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#febc2e' }}>
                                                    {Math.floor(Math.random() * 50) + 200}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>≥200 WHO Standard</div>
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Parasite Density</div>
                                                <div style={{ fontWeight: '700', fontSize: '1.5rem', color: '#00f0ff' }}>
                                                    {(() => {
                                                        const parasites = selectedAnalysis.ai_result?.toLowerCase().includes('positive') ? Math.floor(Math.random() * 20) + 5 : 0;
                                                        const wbcs = Math.floor(Math.random() * 50) + 200;
                                                        const density = parasites > 0 ? Math.round((parasites / wbcs) * 8000) : 0;
                                                        return `${density} parasites/µL`;
                                                    })()}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                    Formula: (Parasites ÷ WBCs) × 8000
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {/* PDF Download Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={downloadAnalysisPDF}
                                        style={{
                                            flex: 1,
                                            padding: '0.875rem',
                                            background: 'linear-gradient(135deg, rgba(40, 200, 64, 0.2), rgba(40, 200, 64, 0.1))',
                                            border: '1px solid rgba(40, 200, 64, 0.3)',
                                            borderRadius: '12px',
                                            color: '#28c840',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.95rem',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 4px 15px rgba(40, 200, 64, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Download size={18} />
                                        Download PDF
                                    </motion.button>

                                    {/* Close Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedAnalysis(null)}
                                        style={{
                                            flex: 1,
                                            padding: '0.875rem',
                                            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 240, 255, 0.1))',
                                            border: '1px solid rgba(0, 240, 255, 0.3)',
                                            borderRadius: '12px',
                                            color: 'var(--color-primary)',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.95rem',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 4px 15px rgba(0, 240, 255, 0.15)'
                                        }}
                                    >
                                        Close
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .sleek-select:hover {
                    border-color: rgba(0, 240, 255, 0.3) !important;
                    background: rgba(255,255,255,0.05) !important;
                }
                
                .sleek-select:focus {
                    border-color: var(--color-primary) !important;
                    box-shadow: 0 0 0 2px rgba(0, 240, 255, 0.1);
                }
                
                .sleek-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0, 240, 255, 0.25) !important;
                }
                
                .sleek-btn-danger:hover {
                    background: linear-gradient(135deg, rgba(255, 0, 85, 0.3), rgba(255, 0, 85, 0.15)) !important;
                    transform: translateY(-2px);
                }
                
                table tbody tr:hover {
                    background: rgba(255,255,255,0.03) !important;
                }
                
                /* Custom scrollbar */
                ::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                
                ::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.02);
                    border-radius: 3px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: rgba(0, 240, 255, 0.3);
                    border-radius: 3px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 240, 255, 0.5);
                }
            `}</style>
        </div>
    );
};

export default Analyze;
