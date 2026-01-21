import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Search, Filter, RefreshCw, X, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { activityLogger } from '../../../services/activityLogger';
import { formatMalaysiaDate, formatMalaysiaDateOnly } from '../../../utils/dateUtils';
import { getBFMPData } from '../../../utils/bfmpCalculator';

const Reports = ({ role, user }) => {
    const [selectedReport, setSelectedReport] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user) {
            fetchReports();
        }
    }, [user]);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            // Build query for 5-role system
            let query = supabase
                .from('reports')
                .select(`
                    id,
                    status,
                    created_at,
                    submitted_at,
                    submitted_by,
                    medical_officer_id,
                    pathologist_id,
                    mo_status,
                    mo_reviewed_at,
                    mo_notes,
                    pathologist_status,
                    pathologist_reviewed_at,
                    pathologist_notes,
                    analyses (
                        id,
                        ai_result,
                        confidence_score,
                        analyzed_at,
                        patient_type,
                        patient_id,
                        image_path,
                        image_paths,
                        gradcam_paths
                    )
                `);

            // Filter by role
            if (role === 'medical_officer' && user) {
                query = query.eq('medical_officer_id', user.id);
            } else if (role === 'pathologist' && user) {
                // Pathologist sees all reports assigned to them (submitted, approved, rejected)
                query = query.not('pathologist_id', 'is', null);
            } else if (role === 'health_officer') {
                // Health officers see only approved reports
                query = query.eq('status', 'approved');
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            // Now we need to fetch the patient details for each analysis.
            // Since patient_id points to different tables based on patient_type, we might need separate queries or client-side mapping.
            // For simplicity in this demo, let's fetch all patients from both tables and map them. 
            // (In a real large app, you'd do this more efficiently).

            const { data: malariaPatients } = await supabase.from('malaria_patients').select('*');
            const { data: leptoPatients } = await supabase.from('leptospirosis_patients').select('*');

            // Fetch account info to filter by staff role
            const { data: accounts } = await supabase
                .from('auth_accounts')
                .select('id, email, role');

            // Fetch lab technician profiles to get names
            const { data: labTechProfiles } = await supabase
                .from('lab_technician_profile')
                .select('account_id, full_name');

            // Fetch medical officer profiles to get names
            const { data: moProfiles } = await supabase
                .from('medical_officer_profile')
                .select('account_id, full_name');

            // Fetch pathologist profiles to get names
            const { data: pathologistProfiles } = await supabase
                .from('pathologist_profile')
                .select('account_id, full_name');

            const mappedReports = data.map(r => {
                const analysis = r.analyses;
                let patient = null;
                if (analysis) {
                    if (analysis.patient_type === 'malaria') {
                        patient = malariaPatients?.find(p => p.id === analysis.patient_id);
                    } else {
                        patient = leptoPatients?.find(p => p.id === analysis.patient_id);
                    }
                }

                // Find submitter info
                const submitter = accounts?.find(a => a.id === r.submitted_by);
                const labTechProfile = labTechProfiles?.find(p => p.account_id === r.submitted_by);

                // Find medical officer info
                const moAccount = accounts?.find(a => a.id === r.medical_officer_id);
                const moProfile = moProfiles?.find(p => p.account_id === r.medical_officer_id);

                // Find pathologist info
                const pathologistAccount = accounts?.find(a => a.id === r.pathologist_id);
                const pathologistProfile = pathologistProfiles?.find(p => p.account_id === r.pathologist_id);

                return {
                    id: r.id,
                    status: r.status,
                    created_at: r.created_at,
                    submitted_at: r.submitted_at,
                    type: analysis?.ai_result || 'Unknown',
                    severity: analysis?.ai_result?.toLowerCase().includes('positive') ? 'High' : 'Low',
                    confidence: analysis?.confidence_score,
                    confidence_score: analysis?.confidence_score,
                    ai_result: analysis?.ai_result,
                    analyzed_at: analysis?.analyzed_at,
                    analysis_id: analysis?.id,
                    patient_name: patient?.name || 'Unknown',
                    patient_age: patient?.age,
                    patient_gender: patient?.gender,
                    gender: patient?.gender,
                    age: patient?.age,
                    collection_datetime: patient?.collection_datetime,
                    registration_number: patient?.registration_number,
                    ic_passport: patient?.ic_passport,
                    health_facility: patient?.health_facility,
                    slide_number: patient?.slide_number,
                    patient_type: analysis?.patient_type,
                    submitter_role: submitter?.role,
                    submitted_by_name: labTechProfile?.full_name || submitter?.email || 'Unknown',
                    submitter_email: submitter?.email,
                    // MO info
                    mo_name: moProfile?.full_name || moAccount?.email || null,
                    mo_email: moAccount?.email || null,
                    mo_status: r.mo_status,
                    mo_reviewed_at: r.mo_reviewed_at,
                    mo_notes: r.mo_notes,
                    approved_by_mo_name: moProfile?.full_name || moAccount?.email || 'Unknown',
                    // Pathologist info
                    pathologist_name: pathologistProfile?.full_name || pathologistAccount?.email || null,
                    pathologist_email: pathologistAccount?.email || null,
                    pathologist_status: r.pathologist_status,
                    pathologist_reviewed_at: r.pathologist_reviewed_at,
                    pathologist_notes: r.pathologist_notes,
                    // Images
                    image_path: analysis?.image_path || patient?.image_url,
                    image_paths: analysis?.image_paths || [],
                    gradcam_paths: analysis?.gradcam_paths || []
                };
            });

            // Filter to show only reports from lab_technician
            const techReports = mappedReports.filter(r => r.submitter_role === 'lab_technician');
            setReports(techReports);
        } catch (error) {
            console.error('Error fetching reports:', error.message || error);
            if (error.code === '42P01' || error.message.includes('Could not find the table')) {
                setError(
                    <span>
                        <strong>Table 'reports' not found.</strong><br />
                        Please go to Supabase SQL Editor and run the script in <code>README_SUPABASE.md</code>.
                    </span>
                );
            } else {
                setError(error.message || 'Failed to fetch reports. Please check your connection and database schema.');
            }
        } finally {
            setLoading(false);
        }
    };

    const updateReportStatus = async (id, newStatus) => {
        try {
            let updateData = {};
            const currentReport = reports.find(r => r.id === id);
            const patientName = currentReport?.patient_name || 'Unknown';

            // Medical Officer approves → Assign to Pathologist
            if (role === 'medical_officer' && newStatus === 'approved') {
                // Get a pathologist to assign
                const { data: pathologists } = await supabase
                    .from('auth_accounts')
                    .select('id')
                    .eq('role', 'pathologist')
                    .eq('status', 'approved')
                    .limit(1);

                updateData = {
                    status: 'submitted', // Submitted to pathologist
                    mo_reviewed_at: new Date().toISOString(),
                    mo_status: 'approved',
                    pathologist_id: pathologists?.[0]?.id || null
                };

                // Log activity
                await activityLogger.logReportApprovedByMO(user, id, patientName);

                alert('✅ Report approved and forwarded to Pathologist!');
            }
            // Medical Officer rejects
            else if (role === 'medical_officer' && newStatus === 'rejected') {
                updateData = {
                    status: 'rejected',
                    mo_status: 'rejected',
                    mo_reviewed_at: new Date().toISOString()
                };

                // Log activity
                await activityLogger.logReportRejectedByMO(user, id, patientName);

                alert('✅ Report rejected!');
            }
            // Pathologist approves → Final approval
            else if (role === 'pathologist' && newStatus === 'approved') {
                updateData = {
                    status: 'approved',
                    pathologist_status: 'verified',
                    pathologist_reviewed_at: new Date().toISOString()
                };

                // Log activity with lab tech and MO emails for notifications
                const labTechEmail = currentReport?.submitter_email || '';
                const moEmail = currentReport?.mo_email || '';
                await activityLogger.logReportApprovedByPathologist(user, id, patientName, labTechEmail, moEmail);

                alert('✅ Report verified and approved!');
            }
            // Pathologist rejects
            else if (role === 'pathologist' && newStatus === 'rejected') {
                updateData = {
                    status: 'rejected',
                    pathologist_status: 'rejected',
                    pathologist_reviewed_at: new Date().toISOString()
                };

                // Log activity with lab tech and MO emails for notifications
                const labTechEmail = currentReport?.submitter_email || '';
                const moEmail = currentReport?.mo_email || '';
                await activityLogger.logReportRejectedByPathologist(user, id, patientName, labTechEmail, moEmail);

                alert('✅ Report rejected!');
            }
            // Default
            else {
                updateData = { status: newStatus };
                alert(`✅ Report ${newStatus}!`);
            }

            const { error } = await supabase
                .from('reports')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            // Refresh reports and update selected report
            await fetchReports();

            // Fetch updated report data
            const { data: updatedReport } = await supabase
                .from('reports')
                .select(`
                    *,
                    analyses (*)
                `)
                .eq('id', id)
                .single();

            if (updatedReport) {
                // Update selected report with new data
                const analysis = updatedReport.analyses;
                let patient = null;
                if (analysis) {
                    const { data: malariaPatients } = await supabase.from('malaria_patients').select('*');
                    const { data: leptoPatients } = await supabase.from('leptospirosis_patients').select('*');

                    if (analysis.patient_type === 'malaria') {
                        patient = malariaPatients?.find(p => p.id === analysis.patient_id);
                    } else {
                        patient = leptoPatients?.find(p => p.id === analysis.patient_id);
                    }
                }

                // Fetch names
                const { data: accounts } = await supabase.from('auth_accounts').select('id, email, role');
                const { data: labTechProfiles } = await supabase.from('lab_technician_profile').select('account_id, full_name');
                const { data: moProfiles } = await supabase.from('medical_officer_profile').select('account_id, full_name');
                const { data: pathologistProfiles } = await supabase.from('pathologist_profile').select('account_id, full_name');

                const submitter = accounts?.find(a => a.id === updatedReport.submitted_by);
                const labTechProfile = labTechProfiles?.find(p => p.account_id === updatedReport.submitted_by);
                const moAccount = accounts?.find(a => a.id === updatedReport.medical_officer_id);
                const moProfile = moProfiles?.find(p => p.account_id === updatedReport.medical_officer_id);
                const pathologistAccount = accounts?.find(a => a.id === updatedReport.pathologist_id);
                const pathologistProfile = pathologistProfiles?.find(p => p.account_id === updatedReport.pathologist_id);

                setSelectedReport({
                    ...updatedReport,
                    patient_name: patient?.name,
                    gender: patient?.gender,
                    age: patient?.age,
                    collection_datetime: patient?.collection_datetime,
                    registration_number: patient?.registration_number,
                    ic_passport: patient?.ic_passport,
                    health_facility: patient?.health_facility,
                    ai_result: analysis?.ai_result,
                    confidence_score: analysis?.confidence_score,
                    analyzed_at: analysis?.analyzed_at,
                    image_path: analysis?.image_path,
                    image_paths: analysis?.image_paths,
                    gradcam_paths: analysis?.gradcam_paths,
                    submitter_name: labTechProfile?.full_name || submitter?.email,
                    submitter_email: submitter?.email,
                    mo_name: moProfile?.full_name || moAccount?.email,
                    mo_email: moAccount?.email,
                    pathologist_name: pathologistProfile?.full_name || pathologistAccount?.email,
                    pathologist_email: pathologistAccount?.email
                });
            }
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Failed to update report status: ' + error.message);
        }
    };

    const downloadReportPDF = async () => {
        if (!selectedReport) return;

        try {
            // Prepare data for custom PDF layout
            const reportData = {
                patientName: selectedReport.patient_name,
                registrationNumber: selectedReport.registration_number,
                icPassport: selectedReport.ic_passport,
                gender: selectedReport.gender,
                age: selectedReport.age,
                // Format dates consistently - Malaysia timezone
                collectionDate: formatMalaysiaDate(selectedReport.collection_datetime),
                healthFacility: selectedReport.health_facility,
                aiResult: selectedReport.ai_result,
                // Fix confidence - check if already percentage or decimal
                confidence: selectedReport.confidence_score
                    ? (selectedReport.confidence_score > 1
                        ? `${selectedReport.confidence_score.toFixed(2)}%`
                        : `${(selectedReport.confidence_score * 100).toFixed(2)}%`)
                    : 'N/A',
                analyzedAt: formatMalaysiaDate(selectedReport.analyzed_at),
                analyzedBy: selectedReport.submitted_by_name || selectedReport.submitter_name || 'Lab Technician',
                // Support multiple images
                images: selectedReport.image_paths || (selectedReport.image_path ? [selectedReport.image_path] : []),
                gradcamImages: selectedReport.gradcam_paths || [],
                imageUrl: selectedReport.image_path || selectedReport.image_paths?.[0],
                // Signature data
                labTechName: selectedReport.submitter_name || selectedReport.submitter_email || null,
                labTechDate: formatMalaysiaDateOnly(selectedReport.submitted_at || selectedReport.analyzed_at),
                moName: selectedReport.mo_reviewed_at ? (selectedReport.mo_name || selectedReport.mo_email) : null,
                moDate: formatMalaysiaDateOnly(selectedReport.mo_reviewed_at),
                pathologistName: selectedReport.pathologist_reviewed_at ? (selectedReport.pathologist_name || selectedReport.pathologist_email) : null,
                pathologistDate: formatMalaysiaDateOnly(selectedReport.pathologist_reviewed_at),
                // Review data
                moStatus: selectedReport.mo_status,
                moReviewedAt: formatMalaysiaDate(selectedReport.mo_reviewed_at),
                moNotes: selectedReport.mo_notes,
                pathologistStatus: selectedReport.pathologist_status,
                pathologistReviewedAt: formatMalaysiaDate(selectedReport.pathologist_reviewed_at),
                pathologistNotes: selectedReport.pathologist_notes,

                // BFMP Protocol Data (Simulated)
                bfmpData: getBFMPData(selectedReport)
            };

            // Generate custom PDF layout
            const { generateReportPDF } = await import('../../../utils/pdfGenerator');
            await generateReportPDF(reportData);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const filteredReports = reports.filter(report => {
        // Status filter - treat "submitted" as "pending"
        let statusMatch = false;
        if (filter === 'all') {
            statusMatch = true;
        } else if (filter === 'pending') {
            statusMatch = report.status === 'pending' || report.status === 'submitted';
        } else {
            statusMatch = report.status === filter;
        }

        // Search filter
        const searchLower = searchQuery.toLowerCase();
        const searchMatch = !searchQuery ||
            report.id.toString().includes(searchLower) ||
            report.patient_name?.toLowerCase().includes(searchLower) ||
            report.registration_number?.toLowerCase().includes(searchLower) ||
            report.type?.toLowerCase().includes(searchLower) ||
            report.submitted_by_name?.toLowerCase().includes(searchLower);

        return statusMatch && searchMatch;
    });

    const exportToCSV = () => {
        if (filteredReports.length === 0) {
            alert('No reports to export!');
            return;
        }

        // CSV Headers
        const headers = [
            'Report ID',
            'Patient Name',
            'Registration Number',
            'Age',
            'Gender',
            'Health Facility',
            'Disease Type',
            'Diagnosis',
            'Confidence Score',
            'Status',
            'Submitted By',
            'Date Created'
        ];

        // CSV Rows
        const rows = filteredReports.map(report => [
            report.id,
            report.patient_name || 'N/A',
            report.registration_number || 'N/A',
            report.patient_age || 'N/A',
            report.patient_gender || 'N/A',
            report.health_facility || 'N/A',
            report.patient_type || 'N/A',
            report.type || 'N/A',
            report.confidence ? `${report.confidence.toFixed(1)}%` : 'N/A',
            report.status || 'N/A',
            report.submitted_by_name || 'N/A',
            new Date(report.created_at).toLocaleString()
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const filterText = filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1);
        const searchText = searchQuery ? `_Search-${searchQuery}` : '';
        const filename = `Reports_${filterText}${searchText}_${new Date().toISOString().split('T')[0]}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert(`✅ Exported ${filteredReports.length} report(s) successfully!`);
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Report <span className="text-gradient">Center</span></h1>
                <p style={{ color: 'var(--color-text-muted)' }}>Manage and review diagnostic reports.</p>
            </div>

            {/* Beautiful Statistics Cards */}
            {!loading && reports.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    {/* Total Reports Card */}
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
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '3.5rem', opacity: 0.08 }}>📋</div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Reports</div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}
                            >
                                {reports.length}
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Pending Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, boxShadow: '0px 0px 0px rgba(254, 188, 46, 0)' }}
                        animate={{ opacity: 1, y: 0, boxShadow: '0px 0px 0px rgba(254, 188, 46, 0)' }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                        whileHover={{ y: -5, boxShadow: '0 15px 30px rgba(254, 188, 46, 0.2)' }}
                        className="glass-panel"
                        style={{
                            padding: '1.25rem',
                            background: 'linear-gradient(135deg, rgba(254, 188, 46, 0.12), rgba(254, 188, 46, 0.03))',
                            border: '1px solid rgba(254, 188, 46, 0.25)',
                            borderRadius: '16px',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'default'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '3.5rem', opacity: 0.08 }}>⏳</div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Review</div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
                                style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#febc2e' }}
                            >
                                {reports.filter(r => r.status === 'pending' || r.status === 'submitted').length}
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Approved Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, boxShadow: '0px 0px 0px rgba(40, 200, 64, 0)' }}
                        animate={{ opacity: 1, y: 0, boxShadow: '0px 0px 0px rgba(40, 200, 64, 0)' }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                        whileHover={{ y: -5, boxShadow: '0 15px 30px rgba(40, 200, 64, 0.2)' }}
                        className="glass-panel"
                        style={{
                            padding: '1.25rem',
                            background: 'linear-gradient(135deg, rgba(40, 200, 64, 0.12), rgba(40, 200, 64, 0.03))',
                            border: '1px solid rgba(40, 200, 64, 0.25)',
                            borderRadius: '16px',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'default'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '3.5rem', opacity: 0.08 }}>✅</div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved</div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                                style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28c840' }}
                            >
                                {reports.filter(r => r.status === 'approved').length}
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Rejected Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, boxShadow: '0px 0px 0px rgba(255, 0, 85, 0)' }}
                        animate={{ opacity: 1, y: 0, boxShadow: '0px 0px 0px rgba(255, 0, 85, 0)' }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
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
                        <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '3.5rem', opacity: 0.08 }}>❌</div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rejected</div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
                                style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ff0055' }}
                            >
                                {reports.filter(r => r.status === 'rejected').length}
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Filters & Actions Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="glass-panel"
                style={{
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    borderRadius: '12px',
                    flexWrap: 'wrap'
                }}
            >
                {/* Search Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px', minWidth: '250px' }}>
                    <Search size={20} color="var(--color-text-muted)" />
                    <input
                        type="text"
                        placeholder="Search by ID, Patient Name, or RN Number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, outline: 'none', fontSize: '0.9rem' }}
                    />
                    {searchQuery && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSearchQuery('')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <X size={18} />
                        </motion.button>
                    )}
                </div>

                <div style={{ width: '1px', height: '32px', background: 'var(--color-glass-border)' }}></div>

                {/* Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} color="var(--color-text-muted)" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--color-glass-border)',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            outline: 'none',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <div style={{ width: '1px', height: '32px', background: 'var(--color-glass-border)' }}></div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(0, 240, 255, 0.2)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchReports}
                        style={{
                            padding: '0.6rem 1rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--color-glass-border)',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(0, 240, 255, 0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={exportToCSV}
                        style={{
                            padding: '0.6rem 1rem',
                            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 240, 255, 0.1))',
                            border: '1px solid rgba(0, 240, 255, 0.3)',
                            borderRadius: '8px',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        📊 Export ({filteredReports.length})
                    </motion.button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel"
                style={{ overflow: 'hidden', borderRadius: '16px' }}
            >
                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(255, 0, 85, 0.1)', borderBottom: '1px solid #ff0055', color: '#ff0055', textAlign: 'center' }}>
                        {error}
                    </div>
                )}
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading reports...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(255, 0, 85, 0.05))' }}>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>#</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Patient</th>
                                {role === 'medical_officer' && (
                                    <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Submitted By</th>
                                )}
                                {role === 'pathologist' && (
                                    <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Approved By</th>
                                )}
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Diagnosis</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Confidence</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                                <th style={{ padding: '1.25rem 1rem', textAlign: 'right', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={(role === 'medical_officer' || role === 'pathologist') ? "8" : "7"} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📋</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>No reports found</div>
                                        <div style={{ fontSize: '0.9rem' }}>Try adjusting your filters or check back later</div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map((report, index) => (
                                    <motion.tr
                                        key={report.id}
                                        initial={{ opacity: 0, x: -20, boxShadow: '0 0 0 0px rgba(0, 0, 0, 0) inset' }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
                                        whileHover={{
                                            backgroundColor: 'rgba(0, 240, 255, 0.03)',
                                            boxShadow: '0 0 0 1px rgba(0, 240, 255, 0.1) inset',
                                            transition: { duration: 0.2 }
                                        }}
                                        style={{
                                            borderBottom: '1px solid var(--color-glass-border)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setSelectedReport(report)}
                                    >
                                        <td style={{ padding: '1.5rem 1rem' }}>
                                            <span style={{
                                                fontWeight: '700',
                                                fontFamily: 'monospace',
                                                fontSize: '0.9rem',
                                                color: 'var(--color-primary)',
                                                background: 'rgba(0, 240, 255, 0.1)',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '6px'
                                            }}>
                                                #{index + 1}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.5rem 1rem' }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{report.patient_name || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                {report.registration_number || 'No RN'}
                                            </div>
                                        </td>
                                        {role === 'medical_officer' && (
                                            <td style={{ padding: '1.5rem 1rem' }}>
                                                <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{report.submitted_by_name}</span>
                                            </td>
                                        )}
                                        {role === 'pathologist' && (
                                            <td style={{ padding: '1.5rem 1rem' }}>
                                                <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{report.approved_by_mo_name}</span>
                                            </td>
                                        )}
                                        <td style={{ padding: '1.5rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                            {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '1.5rem 1rem' }}>
                                            <motion.span
                                                whileHover={{ scale: 1.05 }}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '99px',
                                                    background: report.severity === 'High'
                                                        ? 'linear-gradient(135deg, rgba(255, 0, 85, 0.15), rgba(255, 0, 85, 0.05))'
                                                        : 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))',
                                                    border: `1px solid ${report.severity === 'High' ? 'rgba(255, 0, 85, 0.3)' : 'rgba(0, 240, 255, 0.3)'}`,
                                                    color: report.severity === 'High' ? '#ff0055' : 'var(--color-primary)',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                <span>{report.severity === 'High' ? '🦠' : '✓'}</span>
                                                {report.type}
                                            </motion.span>
                                        </td>
                                        <td style={{ padding: '1.5rem 1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '120px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                                        {report.confidence ? `${report.confidence.toFixed(1)}%` : 'N/A'}
                                                    </span>
                                                </div>
                                                {report.confidence && (
                                                    <div style={{
                                                        width: '100%',
                                                        height: '6px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: '99px',
                                                        overflow: 'hidden',
                                                        position: 'relative'
                                                    }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${report.confidence}%` }}
                                                            transition={{ delay: index * 0.05 + 0.3, duration: 0.8, ease: 'easeOut' }}
                                                            style={{
                                                                height: '100%',
                                                                background: report.confidence >= 95
                                                                    ? 'linear-gradient(90deg, #28c840, #20e050)'
                                                                    : report.confidence >= 80
                                                                        ? 'linear-gradient(90deg, #febc2e, #ffd700)'
                                                                        : 'linear-gradient(90deg, #ff0055, #ff4081)',
                                                                borderRadius: '99px',
                                                                boxShadow: report.confidence >= 95
                                                                    ? '0 0 10px rgba(40, 200, 64, 0.5)'
                                                                    : report.confidence >= 80
                                                                        ? '0 0 10px rgba(254, 188, 46, 0.5)'
                                                                        : '0 0 10px rgba(255, 0, 85, 0.5)'
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem 1rem' }}>
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '99px',
                                                    background: report.status === 'approved'
                                                        ? 'linear-gradient(135deg, rgba(40, 200, 64, 0.15), rgba(40, 200, 64, 0.05))'
                                                        : report.status === 'rejected'
                                                            ? 'linear-gradient(135deg, rgba(255, 0, 85, 0.15), rgba(255, 0, 85, 0.05))'
                                                            : 'linear-gradient(135deg, rgba(254, 188, 46, 0.15), rgba(254, 188, 46, 0.05))',
                                                    border: `1px solid ${report.status === 'approved'
                                                        ? 'rgba(40, 200, 64, 0.3)'
                                                        : report.status === 'rejected'
                                                            ? 'rgba(255, 0, 85, 0.3)'
                                                            : 'rgba(254, 188, 46, 0.3)'
                                                        }`,
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {report.status === 'approved' && <span>✅</span>}
                                                {report.status === 'rejected' && <span>❌</span>}
                                                {(report.status === 'pending' || report.status === 'submitted') && <span>⏳</span>}
                                                <span style={{
                                                    textTransform: 'capitalize',
                                                    color: report.status === 'approved'
                                                        ? '#28c840'
                                                        : report.status === 'rejected'
                                                            ? '#ff0055'
                                                            : '#febc2e'
                                                }}>
                                                    {report.status === 'submitted' && role === 'pathologist' ? 'Pending' : report.status}
                                                </span>
                                            </motion.div>
                                        </td>
                                        <td style={{ padding: '1.5rem 1rem', textAlign: 'right' }}>
                                            <motion.button
                                                initial={{ boxShadow: '0 0px 0px rgba(0, 240, 255, 0)' }}
                                                whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(0, 240, 255, 0.3)' }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedReport(report);
                                                }}
                                                style={{
                                                    padding: '0.6rem 1.25rem',
                                                    border: '1px solid rgba(0, 240, 255, 0.3)',
                                                    borderRadius: '8px',
                                                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(0, 240, 255, 0.05))',
                                                    color: 'var(--color-primary)',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                View Details
                                            </motion.button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </motion.div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setSelectedReport(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{ width: '100%', maxWidth: '700px', padding: '2rem', margin: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* PDF-Style Report Header */}
                            <div
                                data-report-content
                                style={{
                                    background: 'white',
                                    color: '#000',
                                    padding: '2rem',
                                    borderRadius: '12px',
                                    marginBottom: '1.5rem',
                                    position: 'relative'
                                }}
                            >
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: 'rgba(0,0,0,0.1)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: '#000',
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={20} />
                                </button>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <img
                                            src="/icon_MedAI.png"
                                            alt="MedAi Logo"
                                            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                                        />
                                        <div>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, marginBottom: '0.25rem' }}>MedAi Labs</h2>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Advanced Diagnostic Center</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, marginBottom: '0.25rem' }}>DIAGNOSTIC REPORT</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                                            {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            }) : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Patient Information Section */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '1rem',
                                        paddingBottom: '0.5rem',
                                        borderBottom: '2px solid #000'
                                    }}>PATIENT INFORMATION</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                                        <div>
                                            <span style={{ fontWeight: '600' }}>Name:</span>
                                            <div style={{ marginTop: '0.25rem' }}>{selectedReport.patient_name || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: '600' }}>Age / Gender:</span>
                                            <div style={{ marginTop: '0.25rem' }}>{selectedReport.patient_age || '-'} / {selectedReport.patient_gender || '-'}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: '600' }}>RN Number:</span>
                                            <div style={{ marginTop: '0.25rem', fontFamily: 'monospace' }}>{selectedReport.registration_number || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: '600' }}>IC / Passport:</span>
                                            <div style={{ marginTop: '0.25rem', fontFamily: 'monospace' }}>{selectedReport.ic_passport || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: '600' }}>Health Facility:</span>
                                            <div style={{ marginTop: '0.25rem' }}>{selectedReport.health_facility || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: '600' }}>Slide Number:</span>
                                            <div style={{ marginTop: '0.25rem' }}>{selectedReport.slide_number || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Microscopic Analysis Results */}
                                <div>
                                    <h4 style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '1rem',
                                        paddingBottom: '0.5rem',
                                        borderBottom: '2px solid #000'
                                    }}>MICROSCOPIC ANALYSIS RESULTS</h4>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ background: '#000', color: 'white' }}>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Parameter</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Result</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Reference Range</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                <td style={{ padding: '0.75rem' }}>Fields Examined</td>
                                                <td style={{ padding: '0.75rem' }}>1</td>
                                                <td style={{ padding: '0.75rem' }}>20-30 (Recommended)</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                <td style={{ padding: '0.75rem' }}>Disease Type</td>
                                                <td style={{ padding: '0.75rem', textTransform: 'capitalize', fontWeight: '600' }}>{selectedReport.patient_type || 'Unknown'}</td>
                                                <td style={{ padding: '0.75rem' }}>-</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                <td style={{ padding: '0.75rem' }}>Smear Type</td>
                                                <td style={{ padding: '0.75rem' }}>Thin</td>
                                                <td style={{ padding: '0.75rem' }}>Thin / Thick</td>
                                            </tr>
                                            {selectedReport.patient_type?.toLowerCase() === 'malaria' && (
                                                <>
                                                    {(() => {
                                                        const bfmp = getBFMPData(selectedReport);
                                                        return (
                                                            <>
                                                                <tr style={{ borderBottom: '1px solid #ddd', background: '#fff3cd' }}>
                                                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Parasites Counted</td>
                                                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                                                                        {bfmp ? bfmp.parasitesCounted : 0}
                                                                    </td>
                                                                    <td style={{ padding: '0.75rem', color: '#666' }}>Asexual forms</td>
                                                                </tr>
                                                                <tr style={{ borderBottom: '1px solid #ddd', background: '#fff3cd' }}>
                                                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>WBCs Counted</td>
                                                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                                                                        {bfmp ? bfmp.wbcCounted : 'N/A'}
                                                                    </td>
                                                                    <td style={{ padding: '0.75rem', color: '#666' }}>-</td>
                                                                </tr>
                                                                <tr style={{ borderBottom: '1px solid #ddd', background: '#d1ecf1' }}>
                                                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Parasite Density</td>
                                                                    <td style={{ padding: '0.75rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                                        {bfmp ? `${bfmp.density} parasites/µL` : '0 parasites/µL'}
                                                                    </td>
                                                                    <td style={{ padding: '0.75rem', color: '#666' }}>
                                                                        {(() => {
                                                                            if (!bfmp) return 'Negative';
                                                                            const d = bfmp.density;
                                                                            return d === 0 ? 'Negative' :
                                                                                d < 1000 ? 'Low' :
                                                                                    d < 10000 ? 'Moderate' : 'High';
                                                                        })()}
                                                                    </td>
                                                                </tr>
                                                                <tr style={{ borderBottom: '1px solid #ddd', background: '#d1ecf1' }}>
                                                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>AI Confidence Score</td>
                                                                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                                                                        {selectedReport.confidence ? `${selectedReport.confidence.toFixed(1)}%` : 'N/A'}
                                                                    </td>
                                                                    <td style={{ padding: '0.75rem', color: '#666' }}>For staff validation</td>
                                                                </tr>
                                                            </>
                                                        );
                                                    })()}
                                                </>
                                            )}
                                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                                                <td style={{ padding: '0.75rem' }}>AI Detection Result</td>
                                                <td style={{
                                                    padding: '0.75rem',
                                                    fontWeight: 'bold',
                                                    color: selectedReport.severity === 'High' ? '#ff0055' : '#28c840'
                                                }}>
                                                    {selectedReport.type || 'Pending'}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>-</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {selectedReport.patient_type?.toLowerCase() === 'malaria' && selectedReport.severity === 'High' && (
                                        <div style={{ padding: '1rem', background: '#e7f3ff', border: '1px solid #2196f3', borderRadius: '8px', marginTop: '1rem', fontSize: '0.85rem' }}>
                                            <strong>📐 Calculation Formula:</strong> Parasite Density = (Parasites Counted ÷ WBCs Counted) × 8000
                                            <br />
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '0.5rem', display: 'block' }}>
                                                {(() => {
                                                    const bfmp = getBFMPData(selectedReport);
                                                    if (!bfmp) return 'Calculation data unavailable';
                                                    return `= (${bfmp.parasitesCounted} ÷ ${bfmp.wbcCounted}) × 8000 = ${bfmp.density} parasites/µL`;
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* AI Recommendation */}
                                <div style={{
                                    marginTop: '1.5rem',
                                    padding: '1rem',
                                    background: selectedReport.severity === 'High' ? '#fff3cd' : '#d1ecf1',
                                    border: `1px solid ${selectedReport.severity === 'High' ? '#ffc107' : '#0dcaf0'}`,
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                        <AlertTriangle size={20} color={selectedReport.severity === 'High' ? '#856404' : '#055160'} style={{ marginTop: '0.25rem', flexShrink: 0 }} />
                                        <div>
                                            <h5 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>AI Recommendation</h5>
                                            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
                                                {selectedReport.severity === 'High'
                                                    ? 'Consider uploading more fields (10-30 recommended) for better accuracy. Immediate medical consultation recommended for positive cases.'
                                                    : 'Result appears normal. Continue routine monitoring as per standard protocols.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Microscope Images Section */}
                                {(selectedReport.image_paths || selectedReport.image_path) && (() => {
                                    // Get all images - either from image_paths array or fallback to single image_path
                                    const images = selectedReport.image_paths && Array.isArray(selectedReport.image_paths) && selectedReport.image_paths.length > 0
                                        ? selectedReport.image_paths
                                        : [selectedReport.image_path].filter(Boolean);

                                    // Get GradCAM images
                                    const gradcamImages = selectedReport.gradcam_paths && Array.isArray(selectedReport.gradcam_paths)
                                        ? selectedReport.gradcam_paths
                                        : [];

                                    const hasGradCAM = gradcamImages.length > 0 && gradcamImages.some(Boolean);

                                    if (images.length === 0) return null;

                                    return (
                                        <div style={{ marginTop: '1rem' }}>
                                            <h4 style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                marginBottom: '1rem',
                                                paddingBottom: '0.5rem',
                                                borderBottom: '2px solid #000'
                                            }}>MICROSCOPE IMAGES {hasGradCAM ? 'WITH AI VISUALIZATION' : ''} ({images.length} Field{images.length > 1 ? 's' : ''} Examined)</h4>

                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: hasGradCAM ? 'repeat(auto-fit, minmax(220px, 1fr))' : 'repeat(auto-fit, minmax(180px, 1fr))',
                                                gap: '1rem'
                                            }}>
                                                {images.map((imgUrl, idx) => (
                                                    <div key={idx} style={{
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        background: '#f8f9fa'
                                                    }}>
                                                        {/* Side-by-side Original and GradCAM images */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: hasGradCAM ? '1fr 1fr' : '1fr', gap: '1px' }}>
                                                            {/* Original Image */}
                                                            <div style={{ position: 'relative', paddingTop: '100%', background: '#000' }}>
                                                                <img
                                                                    src={imgUrl}
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
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    bottom: 0,
                                                                    left: 0,
                                                                    right: 0,
                                                                    background: 'rgba(0,0,0,0.6)',
                                                                    color: 'white',
                                                                    padding: '0.15rem',
                                                                    fontSize: '0.6rem',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    Original
                                                                </div>
                                                            </div>
                                                            {/* GradCAM Image */}
                                                            {hasGradCAM && (
                                                                <div style={{ position: 'relative', paddingTop: '100%', background: '#111' }}>
                                                                    {gradcamImages[idx] ? (
                                                                        <>
                                                                            <img
                                                                                src={gradcamImages[idx]}
                                                                                alt={`Field ${idx + 1} - AI Focus`}
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    top: 0,
                                                                                    left: 0,
                                                                                    width: '100%',
                                                                                    height: '100%',
                                                                                    objectFit: 'cover'
                                                                                }}
                                                                            />
                                                                            <div style={{
                                                                                position: 'absolute',
                                                                                bottom: 0,
                                                                                left: 0,
                                                                                right: 0,
                                                                                background: 'rgba(33, 150, 243, 0.8)',
                                                                                color: 'white',
                                                                                padding: '0.15rem',
                                                                                fontSize: '0.6rem',
                                                                                textAlign: 'center'
                                                                            }}>
                                                                                AI Focus
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: 0,
                                                                            left: 0,
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            color: '#555',
                                                                            fontSize: '0.6rem'
                                                                        }}>
                                                                            No AI
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ padding: '0.4rem', textAlign: 'center', background: '#fff', borderTop: '1px solid #eee' }}>
                                                            <div style={{ fontWeight: '600', fontSize: '0.75rem' }}>
                                                                Field {idx + 1}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {hasGradCAM && (
                                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.8rem', color: '#666', border: '1px solid #eee' }}>
                                                    <strong>Note:</strong> Warmer colors in "AI Focus" indicate regions that the AI model prioritized during analysis.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <button
                                    onClick={downloadReportPDF}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem 1.5rem',
                                        background: 'rgba(0, 240, 255, 0.1)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '8px',
                                        color: 'var(--color-primary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(0, 240, 255, 0.2)';
                                        e.target.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'rgba(0, 240, 255, 0.1)';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <Download size={18} />
                                    Download PDF
                                </button>
                            </div>

                            {/* Medical Officer Actions - Only for pending reports */}
                            {(role === 'medical_officer' && selectedReport.status === 'pending') && (
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => updateReportStatus(selectedReport.id, 'approved')}
                                        className="btn-primary"
                                        style={{ flex: 1, background: '#28c840', borderColor: '#28c840', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
                                        Approve & Forward to Pathologist
                                    </button>
                                    <button
                                        onClick={() => updateReportStatus(selectedReport.id, 'rejected')}
                                        style={{ flex: 1, padding: '1rem', borderRadius: '99px', border: '1px solid #ff0055', background: 'rgba(255, 0, 85, 0.1)', color: '#ff0055', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600' }}
                                    >
                                        <XCircle size={18} />
                                        Reject
                                    </button>
                                </div>
                            )}

                            {/* Pathologist Actions - Only for submitted status */}
                            {(role === 'pathologist' && selectedReport.status === 'submitted') && (
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => updateReportStatus(selectedReport.id, 'approved')}
                                        className="btn-primary"
                                        style={{ flex: 1, background: '#28c840', borderColor: '#28c840', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
                                        Verify & Approve Report
                                    </button>
                                    <button
                                        onClick={() => updateReportStatus(selectedReport.id, 'rejected')}
                                        style={{ flex: 1, padding: '1rem', borderRadius: '99px', border: '1px solid #ff0055', background: 'rgba(255, 0, 85, 0.1)', color: '#ff0055', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600' }}
                                    >
                                        <XCircle size={18} />
                                        Reject
                                    </button>
                                </div>
                            )}

                            {/* Status Display for non-pathologist roles */}
                            {(selectedReport.status === 'submitted') && (role === 'medical_officer' || role === 'lab_technician' || role === 'admin') && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '1.5rem',
                                    background: 'rgba(0, 240, 255, 0.1)',
                                    border: '1px solid rgba(0, 240, 255, 0.3)',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                        📤 Submitted to Pathologist
                                    </div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        Waiting for pathologist verification
                                    </div>
                                </div>
                            )}

                            {(selectedReport.status === 'approved' || selectedReport.status === 'rejected') && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '1.5rem',
                                    background: selectedReport.status === 'approved' ? 'rgba(40, 200, 64, 0.1)' : 'rgba(255, 0, 85, 0.1)',
                                    border: `1px solid ${selectedReport.status === 'approved' ? 'rgba(40, 200, 64, 0.3)' : 'rgba(255, 0, 85, 0.3)'}`,
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                                        {selectedReport.status === 'approved' ? '✅ Final Approval' : '❌ Rejected'}
                                    </div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                        {selectedReport.status === 'approved' && 'This report has been verified and approved by pathologist'}
                                        {selectedReport.status === 'rejected' && 'This report has been rejected'}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reports;
