import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, MapPin, Download, RefreshCw, AlertTriangle, Users, BarChart3, CheckCircle, Clock, Eye, FileText, UserCheck, XCircle, Calendar } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { formatMalaysiaDate, formatMalaysiaDateOnly, getMalaysiaTimeNow } from '../../../utils/dateUtils';

const Surveillance = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [surveillanceData, setSurveillanceData] = useState({
        totalApproved: 0,
        totalPending: 0,
        totalRejected: 0,
        positiveCases: 0,
        negativeCases: 0,
        positivityRate: 0,
        avgApprovalTime: 0,
        weeklyTrend: [],
        diseaseBreakdown: { malaria: 0, leptospirosis: 0 },
        facilityStats: [],
        staffPerformance: { labTechs: [], medicalOfficers: [], pathologists: [] },
        recentApproved: [],
        trends: null,
        clusters: []
    });
    const [timeRange, setTimeRange] = useState('30d');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => {
        fetchSurveillanceData();
    }, [timeRange]);

    const fetchSurveillanceData = async () => {
        setLoading(true);
        try {
            const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);

            // 1. Get ONLY APPROVED reports (pathologist verified)
            const { data: approvedReports, error: reportsError } = await supabase
                .from('reports')
                .select(`
                    id,
                    status,
                    created_at,
                    submitted_at,
                    mo_reviewed_at,
                    pathologist_reviewed_at,
                    submitted_by,
                    medical_officer_id,
                    pathologist_id,
                    mo_notes,
                    pathologist_notes,
                    analyses (
                        id,
                        ai_result,
                        confidence_score,
                        patient_type,
                        patient_id,
                        analyzed_at,
                        account_id
                    )
                `)
                .eq('status', 'approved')
                .gte('pathologist_reviewed_at', startDate.toISOString())
                .order('pathologist_reviewed_at', { ascending: false });

            if (reportsError) throw reportsError;

            console.log('🔍 Surveillance Data Fetch:', {
                timeRange,
                startDate: startDate.toISOString(),
                approvedReportsCount: approvedReports?.length || 0,
                sampleReport: approvedReports?.[0]
            });

            // Get user profiles for names
            const { data: labTechs } = await supabase.from('lab_technician_profile').select('account_id, full_name');
            const { data: medicalOfficers } = await supabase.from('medical_officer_profile').select('account_id, full_name');
            const { data: pathologists } = await supabase.from('pathologist_profile').select('account_id, full_name');
            const { data: malariaPatients } = await supabase.from('malaria_patients').select('*');
            const { data: leptoPatients } = await supabase.from('leptospirosis_patients').select('*');

            // Helper functions
            const getUserName = (accountId, role) => {
                if (role === 'lab') return labTechs?.find(u => u.account_id === accountId)?.full_name || 'Unknown';
                if (role === 'mo') return medicalOfficers?.find(u => u.account_id === accountId)?.full_name || 'Unknown';
                if (role === 'patho') return pathologists?.find(u => u.account_id === accountId)?.full_name || 'Unknown';
                return 'Unknown';
            };

            // 2. Calculate statistics (all from approved reports only)
            const totalApproved = approvedReports?.length || 0;
            const positiveCases = approvedReports?.filter(r => r.analyses?.ai_result?.toLowerCase().includes('positive')).length || 0;
            const negativeCases = approvedReports?.filter(r => r.analyses?.ai_result?.toLowerCase().includes('negative')).length || 0;
            const positivityRate = totalApproved > 0 ? (positiveCases / totalApproved * 100) : 0;

            // Get pending and rejected counts separately (for reference only, not main display)
            const { count: pendingCount } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
                .gte('created_at', startDate.toISOString());

            const { count: rejectedCount } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'rejected')
                .gte('created_at', startDate.toISOString());

            // 3. Calculate average approval time (only for approved reports)
            const approvalTimes = approvedReports
                ?.filter(r => r.submitted_at && r.pathologist_reviewed_at)
                .map(r => {
                    const submitted = new Date(r.submitted_at);
                    const approved = new Date(r.pathologist_reviewed_at);
                    return (approved - submitted) / (1000 * 60 * 60); // hours
                }) || [];
            const avgApprovalTime = approvalTimes.length > 0
                ? approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length
                : 0;

            // 4. Weekly trend (last 7 days) - only approved cases
            const weeklyTrend = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);

                const dayApproved = approvedReports?.filter(r => {
                    if (!r.pathologist_reviewed_at) return false;
                    const approvedDate = new Date(r.pathologist_reviewed_at);
                    return approvedDate >= date && approvedDate < nextDate;
                }).length || 0;

                weeklyTrend.push({
                    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    cases: dayApproved
                });
            }

            // 5. Disease breakdown (only approved cases)
            const malariaCount = approvedReports?.filter(r => r.analyses?.patient_type === 'malaria').length || 0;
            const leptoCount = approvedReports?.filter(r => r.analyses?.patient_type === 'leptospirosis').length || 0;

            // 6. Staff performance (only from approved reports)
            const labTechPerformance = {};
            const moPerformance = {};
            const pathoPerformance = {};

            approvedReports?.forEach(r => {
                if (r.submitted_by) {
                    labTechPerformance[r.submitted_by] = (labTechPerformance[r.submitted_by] || 0) + 1;
                }
                if (r.medical_officer_id) {
                    moPerformance[r.medical_officer_id] = (moPerformance[r.medical_officer_id] || 0) + 1;
                }
                if (r.pathologist_id) {
                    pathoPerformance[r.pathologist_id] = (pathoPerformance[r.pathologist_id] || 0) + 1;
                }
            });

            const topLabTechs = Object.entries(labTechPerformance)
                .map(([id, count]) => ({ name: getUserName(parseInt(id), 'lab'), count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            const topMOs = Object.entries(moPerformance)
                .map(([id, count]) => ({ name: getUserName(parseInt(id), 'mo'), count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            const topPathos = Object.entries(pathoPerformance)
                .map(([id, count]) => ({ name: getUserName(parseInt(id), 'patho'), count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // 7. Recent approved cases with full details (already filtered to approved only)
            const recentApproved = (approvedReports || []).slice(0, 10).map(r => {
                const analysis = r.analyses;
                let patient = null;
                if (analysis) {
                    if (analysis.patient_type === 'malaria') {
                        patient = malariaPatients?.find(p => p.id === analysis.patient_id);
                    } else {
                        patient = leptoPatients?.find(p => p.id === analysis.patient_id);
                    }
                }

                return {
                    id: r.id,
                    patientName: patient?.name || 'Unknown',
                    patientAge: patient?.age,
                    patientGender: patient?.gender,
                    facility: patient?.health_facility || 'Unknown',
                    diseaseType: analysis?.patient_type || 'Unknown',
                    result: analysis?.ai_result || 'Unknown',
                    confidence: analysis?.confidence_score,
                    submittedBy: getUserName(r.submitted_by, 'lab'),
                    submittedAt: r.submitted_at,
                    reviewedByMO: getUserName(r.medical_officer_id, 'mo'),
                    moReviewedAt: r.mo_reviewed_at,
                    verifiedByPatho: getUserName(r.pathologist_id, 'patho'),
                    pathoReviewedAt: r.pathologist_reviewed_at,
                    approvalTime: r.submitted_at && r.pathologist_reviewed_at
                        ? ((new Date(r.pathologist_reviewed_at) - new Date(r.submitted_at)) / (1000 * 60 * 60)).toFixed(1)
                        : 'N/A',
                    moNotes: r.mo_notes,
                    pathoNotes: r.pathologist_notes
                };
            });

            setSurveillanceData({
                totalApproved,
                totalPending: pendingCount || 0,
                totalRejected: rejectedCount || 0,
                positiveCases,
                negativeCases,
                positivityRate,
                avgApprovalTime,
                weeklyTrend,
                diseaseBreakdown: { malaria: malariaCount, leptospirosis: leptoCount },
                staffPerformance: {
                    labTechs: topLabTechs,
                    medicalOfficers: topMOs,
                    pathologists: topPathos
                },
                recentApproved
            });
        } catch (error) {
            console.error('Error fetching surveillance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        await fetchSurveillanceData();
        setRefreshing(false);
    };

    const exportToCSV = () => {
        // Helper function to escape CSV values
        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvRows = [];

        // Header Section
        csvRows.push('DISEASE SURVEILLANCE REPORT');
        csvRows.push('');
        csvRows.push(`Generated,${getMalaysiaTimeNow()}`);
        csvRows.push(`Time Period,${timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'}`);
        csvRows.push(`District,${user?.health_officer_profile?.district || 'Unknown'}`);
        csvRows.push(`State,${user?.health_officer_profile?.state || 'Unknown'}`);
        csvRows.push('');
        csvRows.push('');

        // Summary Statistics Section
        csvRows.push('SUMMARY STATISTICS');
        csvRows.push('Metric,Current Value,Previous Period,Change (%)');
        csvRows.push(`Total Approved Cases,${surveillanceData.totalApproved},${surveillanceData.trends?.prevTotal || 'N/A'},${surveillanceData.trends ? (surveillanceData.trends.totalTrend > 0 ? '+' : '') + surveillanceData.trends.totalTrend.toFixed(1) + '%' : 'N/A'}`);
        csvRows.push(`Positive Cases,${surveillanceData.positiveCases},${surveillanceData.trends?.prevPositive || 'N/A'},${surveillanceData.trends ? (surveillanceData.trends.positiveTrend > 0 ? '+' : '') + surveillanceData.trends.positiveTrend.toFixed(1) + '%' : 'N/A'}`);
        csvRows.push(`Negative Cases,${surveillanceData.negativeCases},-,-`);
        csvRows.push(`Positivity Rate,${surveillanceData.positivityRate.toFixed(1)}%,${surveillanceData.trends?.prevPositivityRate?.toFixed(1) || 'N/A'}%,${surveillanceData.trends ? (surveillanceData.trends.rateTrend > 0 ? '+' : '') + surveillanceData.trends.rateTrend.toFixed(1) + '%' : 'N/A'}`);
        csvRows.push(`Average Approval Time,${surveillanceData.avgApprovalTime.toFixed(1)} hours,-,-`);
        csvRows.push('');
        csvRows.push('');

        // Disease Breakdown Section
        csvRows.push('DISEASE BREAKDOWN');
        csvRows.push('Disease Type,Total Cases,Percentage');
        const totalCases = surveillanceData.diseaseBreakdown.malaria + surveillanceData.diseaseBreakdown.leptospirosis;
        csvRows.push(`Malaria,${surveillanceData.diseaseBreakdown.malaria},${totalCases > 0 ? ((surveillanceData.diseaseBreakdown.malaria / totalCases) * 100).toFixed(1) : 0}%`);
        csvRows.push(`Leptospirosis,${surveillanceData.diseaseBreakdown.leptospirosis},${totalCases > 0 ? ((surveillanceData.diseaseBreakdown.leptospirosis / totalCases) * 100).toFixed(1) : 0}%`);
        csvRows.push('');
        csvRows.push('');

        // Cluster Alerts Section (if available)
        if (surveillanceData.clusters && surveillanceData.clusters.length > 0) {
            csvRows.push('CLUSTER ALERTS');
            csvRows.push('Facility Name,Positive Cases,Alert Level,Time Period,Status');
            surveillanceData.clusters.forEach(c => {
                csvRows.push(`${escapeCSV(c.facility)},${c.cases},${c.severity},${c.timeframe},ACTIVE`);
            });
            csvRows.push('');
            csvRows.push('');
        }

        // Recent Approved Cases Section
        csvRows.push('RECENT APPROVED CASES');
        csvRows.push('No.,Patient Name,Age,Gender,Disease Type,Result,Health Facility,Submitted By,Approval Time (hours),Date Approved');
        if (surveillanceData.recentApproved && surveillanceData.recentApproved.length > 0) {
            surveillanceData.recentApproved.forEach((r, index) => {
                csvRows.push([
                    index + 1,
                    escapeCSV(r.patientName || 'N/A'),
                    r.patientAge || 'N/A',
                    r.patientGender || 'N/A',
                    escapeCSV(r.diseaseType || 'N/A'),
                    escapeCSV(r.result || 'N/A'),
                    escapeCSV(r.facility || 'N/A'),
                    escapeCSV(r.submittedBy || 'N/A'),
                    r.approvalTime || 'N/A',
                    r.pathoReviewedAt ? formatMalaysiaDate(r.pathoReviewedAt) : 'N/A'
                ].join(','));
            });
        } else {
            csvRows.push('No data available');
        }

        csvRows.push('');
        csvRows.push('');
        csvRows.push('--- END OF REPORT ---');
        csvRows.push(`Report generated by MedAI Surveillance System`);

        const csv = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Use ISO string slice for filename date to keep it safe, but could use local if needed. 
        // Keeping simple for filename:
        a.download = `Surveillance_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportToPDF = () => {
        const printWindow = window.open('', '', 'width=800,height=600');

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Surveillance Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            background: white;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #0066cc;
            padding-bottom: 20px;
        }
        .header h1 { 
            color: #0066cc; 
            font-size: 24px; 
            margin-bottom: 10px;
        }
        .header .meta {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section-title {
            background: #0066cc;
            color: white;
            padding: 10px 15px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background: #f0f0f0;
            padding: 10px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid #ddd;
        }
        td {
            padding: 8px 10px;
            font-size: 10px;
            border: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-box {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
        }
        .stat-label {
            font-size: 11px;
            color: #666;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #0066cc;
        }
        .stat-trend {
            font-size: 10px;
            margin-top: 5px;
        }
        .trend-up { color: #dc3545; }
        .trend-down { color: #28a745; }
        .alert-box {
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 5px;
        }
        .alert-title {
            color: #856404;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        @media print {
            body { padding: 20px; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 DISEASE SURVEILLANCE REPORT</h1>
        <div class="meta">
            <strong>Generated:</strong> ${getMalaysiaTimeNow()} | 
            <strong>Period:</strong> ${timeRange === '7d' ? 'Last 7 Days' : timeRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'} | 
            <strong>District:</strong> ${user?.health_officer_profile?.district || 'Unknown'} | 
            <strong>State:</strong> ${user?.health_officer_profile?.state || 'Unknown'}
        </div>
    </div>

    <div class="section">
        <div class="section-title">📊 Summary Statistics</div>
        <div class="stat-grid">
            <div class="stat-box">
                <div class="stat-label">Total Approved Cases</div>
                <div class="stat-value">${surveillanceData.totalApproved}</div>
                ${surveillanceData.trends ? `<div class="stat-trend ${surveillanceData.trends.totalTrend > 0 ? 'trend-up' : 'trend-down'}">${surveillanceData.trends.totalTrend > 0 ? '↑' : '↓'} ${Math.abs(surveillanceData.trends.totalTrend).toFixed(1)}% vs previous period</div>` : ''}
            </div>
            <div class="stat-box">
                <div class="stat-label">Positive Cases</div>
                <div class="stat-value" style="color: #dc3545;">${surveillanceData.positiveCases}</div>
                ${surveillanceData.trends ? `<div class="stat-trend ${surveillanceData.trends.positiveTrend > 0 ? 'trend-up' : 'trend-down'}">${surveillanceData.trends.positiveTrend > 0 ? '↑' : '↓'} ${Math.abs(surveillanceData.trends.positiveTrend).toFixed(1)}% vs previous period</div>` : ''}
            </div>
            <div class="stat-box">
                <div class="stat-label">Positivity Rate</div>
                <div class="stat-value">${surveillanceData.positivityRate.toFixed(1)}%</div>
                ${surveillanceData.trends ? `<div class="stat-trend ${surveillanceData.trends.rateTrend > 0 ? 'trend-up' : 'trend-down'}">${surveillanceData.trends.rateTrend > 0 ? '↑' : '↓'} ${Math.abs(surveillanceData.trends.rateTrend).toFixed(1)}% vs previous period</div>` : ''}
            </div>
            <div class="stat-box">
                <div class="stat-label">Avg Approval Time</div>
                <div class="stat-value">${surveillanceData.avgApprovalTime.toFixed(1)}h</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">🦠 Disease Breakdown</div>
        <table>
            <thead>
                <tr>
                    <th>Disease Type</th>
                    <th style="text-align: center;">Total Cases</th>
                    <th style="text-align: center;">Percentage</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Malaria</strong></td>
                    <td style="text-align: center;">${surveillanceData.diseaseBreakdown.malaria}</td>
                    <td style="text-align: center;">${((surveillanceData.diseaseBreakdown.malaria / (surveillanceData.diseaseBreakdown.malaria + surveillanceData.diseaseBreakdown.leptospirosis || 1)) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td><strong>Leptospirosis</strong></td>
                    <td style="text-align: center;">${surveillanceData.diseaseBreakdown.leptospirosis}</td>
                    <td style="text-align: center;">${((surveillanceData.diseaseBreakdown.leptospirosis / (surveillanceData.diseaseBreakdown.malaria + surveillanceData.diseaseBreakdown.leptospirosis || 1)) * 100).toFixed(1)}%</td>
                </tr>
            </tbody>
        </table>
    </div>

    ${surveillanceData.clusters && surveillanceData.clusters.length > 0 ? `
    <div class="section">
        <div class="section-title">⚠️ Cluster Alerts</div>
        ${surveillanceData.clusters.map(c => `
            <div class="alert-box">
                <div class="alert-title">🔴 ${c.severity} ALERT - ${c.facility}</div>
                <div><strong>${c.cases}</strong> positive cases detected in <strong>${c.timeframe}</strong></div>
                <div style="font-size: 10px; margin-top: 5px;">Normal baseline: ${c.baseline} case(s)</div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">📋 Recent Approved Cases</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 30px;">No.</th>
                    <th>Patient</th>
                    <th>Age/Gender</th>
                    <th>Disease</th>
                    <th>Result</th>
                    <th>Facility</th>
                    <th>Submitted By</th>
                    <th style="text-align: center;">Time</th>
                </tr>
            </thead>
            <tbody>
                ${surveillanceData.recentApproved && surveillanceData.recentApproved.length > 0 ?
                surveillanceData.recentApproved.slice(0, 15).map((r, i) => `
                        <tr>
                            <td style="text-align: center;">${i + 1}</td>
                            <td><strong>${r.patientName || 'N/A'}</strong></td>
                            <td>${r.patientAge || 'N/A'}y, ${r.patientGender || 'N/A'}</td>
                            <td style="text-transform: capitalize;">${r.diseaseType || 'N/A'}</td>
                            <td style="color: ${r.result?.toLowerCase().includes('positive') ? '#dc3545' : '#28a745'}; font-weight: bold;">${r.result || 'N/A'}</td>
                            <td>${r.facility || 'N/A'}</td>
                            <td>${r.submittedBy || 'N/A'}</td>
                            <td style="text-align: center;">${r.approvalTime || 'N/A'}h</td>
                        </tr>
                    `).join('')
                : '<tr><td colspan="8" style="text-align: center; color: #999;">No data available</td></tr>'
            }
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p><strong>MedAI Surveillance System</strong> | Disease Surveillance Dashboard</p>
        <p>This report is confidential and intended for authorized personnel only.</p>
        <p>Report ID: SR-${Date.now()}</p>
    </div>
</body>
</html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>Loading surveillance data...</div>
            </div>
        );
    }

    return (
        <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Disease Surveillance Dashboard
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            {user?.health_officer_profile?.district || 'District'} - {user?.health_officer_profile?.state || 'State'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                        </select>
                        <button onClick={refreshData} disabled={refreshing} style={{ padding: '0.75rem 1rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--color-primary)', borderRadius: '8px', color: 'var(--color-primary)', cursor: refreshing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: refreshing ? 0.5 : 1 }}>
                            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                            Refresh
                        </button>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                style={{ padding: '0.75rem 1rem', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid #00ff88', borderRadius: '8px', color: '#00ff88', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Download size={16} />
                                Export
                            </button>
                            {showExportMenu && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    background: 'rgba(20, 20, 30, 0.98)',
                                    border: '1px solid var(--color-glass-border)',
                                    borderRadius: '8px',
                                    padding: '0.5rem',
                                    minWidth: '180px',
                                    zIndex: 100,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                }}>
                                    <button
                                        onClick={() => { exportToCSV(); setShowExportMenu(false); }}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                    >
                                        📊 Export CSV
                                    </button>
                                    <button
                                        onClick={() => { exportToPDF(); setShowExportMenu(false); }}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                    >
                                        📄 Export PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <CheckCircle size={32} color="#00ff88" />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00ff88' }}>{surveillanceData.totalApproved}</div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Approved Cases</div>
                    {surveillanceData.trends ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            color: surveillanceData.trends.totalTrend > 0 ? '#ff0055' : '#00ff88',
                            fontWeight: '600'
                        }}>
                            {surveillanceData.trends.totalTrend > 0 ? '↑' : '↓'}
                            {Math.abs(surveillanceData.trends.totalTrend).toFixed(1)}% vs prev period
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Pathologist verified</div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <Clock size={32} color="#febc2e" />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#febc2e' }}>{surveillanceData.totalPending}</div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Pending Review</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Awaiting approval</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <AlertTriangle size={32} color="#ff0055" />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff0055' }}>{surveillanceData.positiveCases}</div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Positive Cases</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Confirmed infections</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <TrendingUp size={32} color={surveillanceData.positivityRate > 10 ? '#ff0055' : '#00ff88'} />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: surveillanceData.positivityRate > 10 ? '#ff0055' : '#00ff88' }}>
                            {surveillanceData.positivityRate.toFixed(1)}%
                        </div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Positivity Rate</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Of approved cases</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <Calendar size={32} color="var(--color-primary)" />
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{surveillanceData.avgApprovalTime.toFixed(1)}h</div>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Avg Approval Time</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Submit to final approval</div>
                </motion.div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Weekly Trend */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={20} color="var(--color-primary)" />
                        Approved Cases Trend (Last 7 Days)
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'end', gap: '0.5rem', height: '200px' }}>
                        {surveillanceData.weeklyTrend.map((day, index) => {
                            const maxCases = Math.max(...surveillanceData.weeklyTrend.map(d => d.cases), 1);
                            const height = Math.max((day.cases / maxCases) * 100, 5);
                            return (
                                <motion.div key={index} initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }} style={{ flex: 1, background: day.cases > 0 ? 'linear-gradient(to top, #00ff88, #00f0ff)' : 'rgba(255,255,255,0.1)', borderRadius: '4px 4px 0 0', minHeight: '10px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', color: day.cases > 0 ? '#00ff88' : 'var(--color-text-muted)', fontWeight: '600' }}>{day.cases}</div>
                                    <div style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{day.date}</div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Disease Breakdown */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} color="var(--color-primary)" />
                        Disease Distribution
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,0,85,0.1)', borderRadius: '8px', border: '1px solid rgba(255,0,85,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: '600', color: '#ff0055' }}>Malaria</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff0055' }}>{surveillanceData.diseaseBreakdown.malaria}</span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Plasmodium detection</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(254,188,46,0.1)', borderRadius: '8px', border: '1px solid rgba(254,188,46,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: '600', color: '#febc2e' }}>Leptospirosis</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#febc2e' }}>{surveillanceData.diseaseBreakdown.leptospirosis}</span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Bacterial infection</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Staff Performance */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={18} color="var(--color-primary)" />
                        Top Lab Technicians
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {surveillanceData.staffPerformance.labTechs.map((tech, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.875rem' }}>{tech.name}</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{tech.count}</span>
                            </div>
                        ))}
                        {surveillanceData.staffPerformance.labTechs.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1rem' }}>No data</div>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserCheck size={18} color="var(--color-primary)" />
                        Top Medical Officers
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {surveillanceData.staffPerformance.medicalOfficers.map((mo, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.875rem' }}>{mo.name}</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{mo.count}</span>
                            </div>
                        ))}
                        {surveillanceData.staffPerformance.medicalOfficers.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1rem' }}>No data</div>
                        )}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} color="var(--color-primary)" />
                        Top Pathologists
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {surveillanceData.staffPerformance.pathologists.map((patho, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <span style={{ fontSize: '0.875rem' }}>{patho.name}</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{patho.count}</span>
                            </div>
                        ))}
                        {surveillanceData.staffPerformance.pathologists.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1rem' }}>No data</div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Recent Approved Cases Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={20} color="#00ff88" />
                    Recent Approved Cases (Full Approval Chain)
                </h3>
                {surveillanceData.recentApproved.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>No approved cases in this time range</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Patient</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Disease</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem', minWidth: '180px' }}>Result</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Submitted By</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Reviewed By (MO)</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Verified By (Patho)</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem' }}>Approval Time</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600', fontSize: '0.875rem', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {surveillanceData.recentApproved.map((report, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600' }}>{report.patientName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {report.patientAge}y, {report.patientGender}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{report.diseaseType}</td>
                                        <td style={{ padding: '1rem', minWidth: '180px' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '99px',
                                                background: report.result?.toLowerCase().includes('positive') ? 'rgba(255, 0, 85, 0.1)' : 'rgba(0, 255, 136, 0.1)',
                                                color: report.result?.toLowerCase().includes('positive') ? '#ff0055' : '#00ff88',
                                                fontSize: '0.875rem',
                                                display: 'inline-block',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {report.result}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem' }}>{report.submittedBy}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {new Date(report.submittedAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem' }}>{report.reviewedByMO}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {report.moReviewedAt ? new Date(report.moReviewedAt).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.875rem' }}>{report.verifiedByPatho}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {report.pathoReviewedAt ? new Date(report.pathoReviewedAt).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                                            {report.approvalTime}h
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button onClick={() => setSelectedReport(report)} style={{ padding: '0.5rem 1rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--color-primary)', borderRadius: '8px', color: 'var(--color-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                                <Eye size={16} />
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Report Detail Modal */}
            <AnimatePresence>
                {selectedReport && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setSelectedReport(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>Approval Chain Details</h2>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Patient Information</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Name:</span> <strong>{selectedReport.patientName}</strong></div>
                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Age/Gender:</span> <strong>{selectedReport.patientAge}y, {selectedReport.patientGender}</strong></div>
                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Facility:</span> <strong>{selectedReport.facility}</strong></div>
                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Disease:</span> <strong style={{ textTransform: 'capitalize' }}>{selectedReport.diseaseType}</strong></div>
                                    </div>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Analysis Result</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Result:</span> <strong style={{ color: selectedReport.result?.toLowerCase().includes('positive') ? '#ff0055' : '#00ff88' }}>{selectedReport.result}</strong></div>
                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Confidence:</span> <strong>{selectedReport.confidence ? `${selectedReport.confidence.toFixed(1)}%` : 'N/A'}</strong></div>
                                        <div><span style={{ color: 'var(--color-text-muted)' }}>Approval Time:</span> <strong>{selectedReport.approvalTime} hours</strong></div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>Approval Timeline</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ padding: '1rem', background: 'rgba(0,240,255,0.1)', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)' }}>
                                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>1. Submitted by Lab Technician</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selectedReport.submittedBy}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{new Date(selectedReport.submittedAt).toLocaleString()}</div>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'rgba(0,255,136,0.1)', borderRadius: '8px', borderLeft: '4px solid #00ff88' }}>
                                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>2. Reviewed by Medical Officer</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selectedReport.reviewedByMO}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selectedReport.moReviewedAt ? new Date(selectedReport.moReviewedAt).toLocaleString() : 'N/A'}</div>
                                        {selectedReport.moNotes && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontStyle: 'italic' }}>Notes: {selectedReport.moNotes}</div>
                                        )}
                                    </div>
                                    <div style={{ padding: '1rem', background: 'rgba(0,255,136,0.1)', borderRadius: '8px', borderLeft: '4px solid #00ff88' }}>
                                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>3. Verified by Pathologist</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selectedReport.verifiedByPatho}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selectedReport.pathoReviewedAt ? new Date(selectedReport.pathoReviewedAt).toLocaleString() : 'N/A'}</div>
                                        {selectedReport.pathoNotes && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontStyle: 'italic' }}>Notes: {selectedReport.pathoNotes}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setSelectedReport(null)} className="btn-primary" style={{ width: '100%' }}>
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Surveillance;
