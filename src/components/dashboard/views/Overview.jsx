import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Users, FileText, AlertTriangle, TrendingUp, Clock, Eye, X, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const StatCard = ({ title, value, change, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid var(--color-glass-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)'
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
                <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{title}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value}</div>
            </div>
            <div style={{ padding: '0.75rem', background: `rgba(${color}, 0.1)`, borderRadius: '12px', color: `rgb(${color})` }}>
                <Icon size={24} />
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#00ff88', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingUp size={14} /> {change}
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>vs last week</span>
        </div>

        {/* Decorative background glow */}
        <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '150px', height: '150px', background: `radial-gradient(circle, rgba(${color}, 0.2) 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
    </motion.div>
);

const Overview = ({ role, user }) => {
    const [recentReports, setRecentReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSamples: 0,
        malariaDetected: 0,
        pendingReviews: 0,
        reportsGenerated: 0
    });
    const [chartData, setChartData] = useState([40, 65, 45, 80, 55, 90, 70]);
    const [actualCounts, setActualCounts] = useState([0, 0, 0, 0, 0, 0, 0]);
    const [personalAnalyses, setPersonalAnalyses] = useState([]);

    useEffect(() => {
        if (user) {
            fetchRecentReports();
            fetchStats();
            fetchChartData();
            fetchPersonalAnalyses();
        }
    }, [user]);

    const fetchPersonalAnalyses = async () => {
        try {
            // Fetch personal analyses for sidebar widget
            const { data, error } = await supabase
                .from('analyses')
                .select('*')
                .eq('account_id', user.id)
                .order('analyzed_at', { ascending: false })
                .limit(4);

            if (error) throw error;

            const { data: malariaPatients } = await supabase.from('malaria_patients').select('*');
            const { data: leptoPatients } = await supabase.from('leptospirosis_patients').select('*');

            const mapped = data?.map(analysis => {
                let patient = null;
                if (analysis.patient_type === 'malaria') {
                    patient = malariaPatients?.find(p => p.id === analysis.patient_id);
                } else {
                    patient = leptoPatients?.find(p => p.id === analysis.patient_id);
                }

                return {
                    id: analysis.id,
                    result: analysis.ai_result,
                    confidence: analysis.confidence_score,
                    patientName: patient?.name || 'Unknown',
                    diseaseType: analysis.patient_type,
                    analyzedAt: analysis.analyzed_at,
                    isPositive: analysis.ai_result?.toLowerCase().includes('positive')
                };
            }) || [];

            setPersonalAnalyses(mapped);
        } catch (error) {
            console.error('Error fetching personal analyses:', error);
        }
    };

    const fetchStats = async () => {
        try {
            let totalCount = 0;
            let positiveCount = 0;
            let pendingCount = 0;
            let reportsCount = 0;

            if (role === 'admin') {
                // Admin sees ALL data
                const { count: total } = await supabase.from('analyses').select('*', { count: 'exact', head: true });
                const { count: positive } = await supabase.from('analyses').select('*', { count: 'exact', head: true }).ilike('ai_result', '%positive%');
                const { count: pending } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                const { count: reports } = await supabase.from('reports').select('*', { count: 'exact', head: true });
                
                totalCount = total || 0;
                positiveCount = positive || 0;
                pendingCount = pending || 0;
                reportsCount = reports || 0;
            } else {
                // Health Officer, Lab Tech, MO, Pathologist: Personal usage only in Overview
                // For Lab Tech, MO, Pathologist: Count PERSONAL usage + assigned work
                
                // 1. Personal analyses (they used AI Detector/Analyze themselves)
                const { count: personalAnalyses } = await supabase
                    .from('analyses')
                    .select('*', { count: 'exact', head: true })
                    .eq('account_id', user.id);

                const { count: personalPositive } = await supabase
                    .from('analyses')
                    .select('*', { count: 'exact', head: true })
                    .eq('account_id', user.id)
                    .ilike('ai_result', '%positive%');

                // 2. Assigned work (reports assigned to them)
                let assignedAnalysisIds = [];
                let assignedReportsCount = 0;
                let assignedPendingCount = 0;

                if (role === 'lab_technician') {
                    // Lab Tech: reports they submitted
                    const { data: submittedReports } = await supabase
                        .from('reports')
                        .select('analysis_id, status')
                        .eq('submitted_by', user.id);
                    
                    assignedAnalysisIds = submittedReports?.map(r => r.analysis_id) || [];
                    assignedReportsCount = submittedReports?.length || 0;
                    assignedPendingCount = submittedReports?.filter(r => r.status === 'pending').length || 0;
                } else if (role === 'medical_officer') {
                    // MO: reports assigned to them
                    const { data: assignedReports } = await supabase
                        .from('reports')
                        .select('analysis_id, status')
                        .eq('medical_officer_id', user.id);
                    
                    assignedAnalysisIds = assignedReports?.map(r => r.analysis_id) || [];
                    assignedReportsCount = assignedReports?.length || 0;
                    assignedPendingCount = assignedReports?.filter(r => r.status === 'pending').length || 0;
                } else if (role === 'pathologist') {
                    // Pathologist: reports assigned to them
                    const { data: assignedReports } = await supabase
                        .from('reports')
                        .select('analysis_id, status')
                        .eq('pathologist_id', user.id);
                    
                    assignedAnalysisIds = assignedReports?.map(r => r.analysis_id) || [];
                    assignedReportsCount = assignedReports?.length || 0;
                    assignedPendingCount = assignedReports?.filter(r => r.status === 'pending').length || 0;
                }

                // 3. Count analyses from assigned reports (excluding personal ones to avoid double counting)
                let assignedAnalysesCount = 0;
                let assignedPositiveCount = 0;

                if (assignedAnalysisIds.length > 0) {
                    const { count: assigned } = await supabase
                        .from('analyses')
                        .select('*', { count: 'exact', head: true })
                        .in('id', assignedAnalysisIds)
                        .neq('account_id', user.id); // Exclude personal analyses

                    const { count: assignedPos } = await supabase
                        .from('analyses')
                        .select('*', { count: 'exact', head: true })
                        .in('id', assignedAnalysisIds)
                        .neq('account_id', user.id)
                        .ilike('ai_result', '%positive%');

                    assignedAnalysesCount = assigned || 0;
                    assignedPositiveCount = assignedPos || 0;
                }

                // 4. Combine personal + assigned
                totalCount = (personalAnalyses || 0) + assignedAnalysesCount;
                positiveCount = (personalPositive || 0) + assignedPositiveCount;
                pendingCount = assignedPendingCount;
                reportsCount = assignedReportsCount;
            }

            console.log(`Stats fetched for ${role}:`, {
                userId: user.id,
                totalSamples: totalCount,
                positiveDetected: positiveCount,
                pendingReviews: pendingCount,
                reportsGenerated: reportsCount
            });

            setStats({
                totalSamples: totalCount,
                malariaDetected: positiveCount,
                pendingReviews: pendingCount,
                reportsGenerated: reportsCount
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            setStats({
                totalSamples: 0,
                malariaDetected: 0,
                pendingReviews: 0,
                reportsGenerated: 0
            });
        }
    };

    const fetchChartData = async () => {
        try {
            // Get analyses for last 7 days with role-based filtering
            const counts = [];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);

                let dayCount = 0;

                if (role === 'admin') {
                    // Admin sees all data
                    const { count } = await supabase
                        .from('analyses')
                        .select('*', { count: 'exact', head: true })
                        .gte('analyzed_at', date.toISOString())
                        .lt('analyzed_at', nextDate.toISOString());
                    dayCount = count || 0;
                } else {
                    // Health Officer, Lab Tech, MO, Pathologist: Personal + assigned
                    // For other roles: personal + assigned
                    
                    // 1. Personal analyses
                    const { count: personalCount } = await supabase
                        .from('analyses')
                        .select('*', { count: 'exact', head: true })
                        .eq('account_id', user.id)
                        .gte('analyzed_at', date.toISOString())
                        .lt('analyzed_at', nextDate.toISOString());

                    // 2. Assigned analyses
                    let assignedCount = 0;
                    if (role === 'lab_technician') {
                        // Lab tech: analyses from reports they submitted
                        const { data: reports } = await supabase
                            .from('reports')
                            .select('analysis_id')
                            .eq('submitted_by', user.id);
                        const analysisIds = reports?.map(r => r.analysis_id) || [];
                        
                        if (analysisIds.length > 0) {
                            const { count } = await supabase
                                .from('analyses')
                                .select('*', { count: 'exact', head: true })
                                .in('id', analysisIds)
                                .neq('account_id', user.id)
                                .gte('analyzed_at', date.toISOString())
                                .lt('analyzed_at', nextDate.toISOString());
                            assignedCount = count || 0;
                        }
                    } else if (role === 'medical_officer') {
                        // MO: analyses from reports assigned to them
                        const { data: reports } = await supabase
                            .from('reports')
                            .select('analysis_id')
                            .eq('medical_officer_id', user.id);
                        const analysisIds = reports?.map(r => r.analysis_id) || [];
                        
                        if (analysisIds.length > 0) {
                            const { count } = await supabase
                                .from('analyses')
                                .select('*', { count: 'exact', head: true })
                                .in('id', analysisIds)
                                .neq('account_id', user.id)
                                .gte('analyzed_at', date.toISOString())
                                .lt('analyzed_at', nextDate.toISOString());
                            assignedCount = count || 0;
                        }
                    } else if (role === 'pathologist') {
                        // Pathologist: analyses from reports assigned to them
                        const { data: reports } = await supabase
                            .from('reports')
                            .select('analysis_id')
                            .eq('pathologist_id', user.id);
                        const analysisIds = reports?.map(r => r.analysis_id) || [];
                        
                        if (analysisIds.length > 0) {
                            const { count } = await supabase
                                .from('analyses')
                                .select('*', { count: 'exact', head: true })
                                .in('id', analysisIds)
                                .neq('account_id', user.id)
                                .gte('analyzed_at', date.toISOString())
                                .lt('analyzed_at', nextDate.toISOString());
                            assignedCount = count || 0;
                        }
                    }

                    dayCount = (personalCount || 0) + assignedCount;
                }

                counts.push(dayCount);
            }

            console.log(`7-day chart data for ${role} (actual counts):`, counts);

            // Store actual counts
            setActualCounts(counts);

            // Normalize to percentages (0-100) for bar height visualization
            const maxCount = Math.max(...counts, 1);
            const normalized = counts.map(count => {
                // If maxCount is 0, show 5% minimum height for visibility
                if (maxCount === 0) return 5;
                // Otherwise normalize to percentage with minimum 5% for non-zero values
                const percentage = Math.round((count / maxCount) * 100);
                return count > 0 ? Math.max(percentage, 5) : 0;
            });
            
            setChartData(normalized);
        } catch (error) {
            console.error('Error fetching chart data:', error);
            // Set default data on error
            setActualCounts([0, 0, 0, 0, 0, 0, 0]);
            setChartData([0, 0, 0, 0, 0, 0, 0]);
        }
    };

    const fetchRecentReports = async () => {
        setLoading(true);
        try {
            let data, error;

            // For Health Officer, Admin, Lab Tech: Fetch directly from analyses table
            if (role === 'health_officer' || role === 'admin' || role === 'lab_technician') {
                const { data: analysesData, error: analysesError } = await supabase
                    .from('analyses')
                    .select('*')
                    .eq('account_id', user.id)
                    .order('analyzed_at', { ascending: false })
                    .limit(5);

                if (analysesError) throw analysesError;

                // Convert analyses to report-like format
                data = analysesData?.map(analysis => ({
                    id: analysis.id,
                    status: 'personal', // Mark as personal analysis
                    created_at: analysis.analyzed_at,
                    analyses: analysis
                })) || [];
                
            } else {
                // For MO and Pathologist: Fetch from reports table
                let query = supabase
                    .from('reports')
                    .select(`
                        id,
                        status,
                        created_at,
                        submitted_by,
                        medical_officer_id,
                        pathologist_id,
                        pathologist_reviewed_at,
                        analyses (
                            id,
                            ai_result,
                            confidence_score,
                            patient_type,
                            patient_id,
                            image_path,
                            account_id
                        )
                    `)
                    .limit(5);

                if (role === 'medical_officer') {
                    query = query.eq('medical_officer_id', user.id);
                } else if (role === 'pathologist') {
                    query = query.eq('pathologist_id', user.id);
                }

                query = query.order('created_at', { ascending: false });

                const result = await query;
                data = result.data;
                error = result.error;

                if (error) throw error;
            }

            const { data: malariaPatients } = await supabase.from('malaria_patients').select('*');
            const { data: leptoPatients } = await supabase.from('leptospirosis_patients').select('*');

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

                return {
                    id: r.id,
                    status: r.status,
                    created_at: r.created_at,
                    type: analysis?.ai_result || 'Unknown',
                    confidence: analysis?.confidence_score,
                    patient_name: patient?.name || 'Unknown',
                    patient_age: patient?.age,
                    patient_gender: patient?.gender,
                    registration_number: patient?.registration_number,
                    health_facility: patient?.health_facility,
                    patient_type: analysis?.patient_type,
                    image_path: analysis?.image_path || patient?.image_url
                };
            });

            setRecentReports(mappedReports);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    // Role-specific configuration
    const roleConfig = {
        lab_technician: {
            title: 'Lab Technician Dashboard',
            subtitle: 'Analyze samples and submit reports for review',
            emoji: '🔬',
            color: '0, 240, 255',
            stats: ['My Analyses', 'Positive Detections', 'Pending Submissions', 'Submitted Reports']
        },
        medical_officer: {
            title: 'Medical Officer Dashboard',
            subtitle: 'Review and approve laboratory reports',
            emoji: '👨‍⚕️',
            color: '0, 255, 136',
            stats: ['Pending Reviews', 'Reviewed Cases', 'Approved Today', 'Reports Processed']
        },
        pathologist: {
            title: 'Pathologist Dashboard',
            subtitle: 'Final verification and quality assurance',
            emoji: '🔬',
            color: '168, 85, 247',
            stats: ['Pending Verifications', 'Verified Cases', 'Complex Cases', 'Quality Score']
        },
        health_officer: {
            title: 'Health Officer Dashboard',
            subtitle: 'Monitor disease surveillance across your jurisdiction',
            emoji: '🏥',
            color: '59, 130, 246',
            stats: ['Total Approved', 'Active Cases', 'Positivity Rate', 'Facilities Monitored']
        },
        admin: {
            title: 'Admin Dashboard',
            subtitle: 'System management and oversight',
            emoji: '👨‍💼',
            color: '249, 115, 22',
            stats: ['Total Analyses', 'System Users', 'Pending Approvals', 'Reports Generated']
        }
    };

    const currentRole = roleConfig[role] || roleConfig.admin;

    return (
        <div>
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                    marginBottom: '2rem',
                    padding: '2rem',
                    background: `linear-gradient(135deg, rgba(${currentRole.color}, 0.1) 0%, rgba(${currentRole.color}, 0.05) 50%, transparent 100%)`,
                    borderRadius: '16px',
                    border: `1px solid rgba(${currentRole.color}, 0.2)`,
                    borderLeft: `4px solid rgb(${currentRole.color})`
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>{currentRole.emoji}</span>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                            {currentRole.title}
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>{currentRole.subtitle}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    <span>👤 {user?.lab_technician_profile?.full_name || user?.medical_officer_profile?.full_name || user?.pathologist_profile?.full_name || user?.health_officer_profile?.full_name || user?.admin_profile?.full_name || 'User'}</span>
                    <span>•</span>
                    <span>📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard title={currentRole.stats[0]} value={stats.totalSamples} change="+12.5%" icon={Activity} color={currentRole.color} delay={0.1} />
                <StatCard title={currentRole.stats[1]} value={stats.malariaDetected} change="+5.2%" icon={AlertTriangle} color="255, 0, 85" delay={0.2} />
                <StatCard title={currentRole.stats[2]} value={stats.pendingReviews} change="-2.4%" icon={Clock} color="255, 188, 46" delay={0.3} />
                <StatCard title={currentRole.stats[3]} value={stats.reportsGenerated} change="+8.1%" icon={FileText} color="40, 200, 64" delay={0.4} />
            </div>

            {/* Recent Activity & Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

                {/* Main Chart Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-panel"
                    style={{ padding: '2rem', minHeight: '400px' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem' }}>Detection Analytics</h3>
                        <select style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', color: 'white', padding: '0.5rem', borderRadius: '8px', outline: 'none' }}>
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                            <option>This Year</option>
                        </select>
                    </div>

                    {/* Real-time Chart Visualization */}
                    <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-glass-border)' }}>
                        {chartData.map((h, i) => (
                            <div key={i} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                    style={{ width: '100%', background: 'linear-gradient(to top, rgba(0, 240, 255, 0.2), var(--color-primary))', borderRadius: '4px 4px 0 0', position: 'relative' }}
                                >
                                    <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                                        {actualCounts[i]}
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </motion.div>

                {/* Recent Personal Analyses */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-panel"
                    style={{ padding: '2rem' }}
                >
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} color="var(--color-primary)" />
                        My Personal Analyses
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {personalAnalyses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                <Activity size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                <div>No personal analyses yet</div>
                                <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Use AI Detector to analyze samples</div>
                            </div>
                        ) : (
                            personalAnalyses.map((item, i) => (
                                <div key={i} style={{ 
                                    display: 'flex', 
                                    gap: '1rem', 
                                    padding: '1rem', 
                                    background: 'rgba(255,255,255,0.03)', 
                                    borderRadius: '12px', 
                                    borderLeft: `4px solid ${item.isPositive ? '#ff0055' : '#00ff88'}` 
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>{item.patientName}</span>
                                            <span style={{ 
                                                fontSize: '0.75rem', 
                                                padding: '0.25rem 0.5rem', 
                                                borderRadius: '4px', 
                                                background: item.isPositive ? 'rgba(255,0,85,0.1)' : 'rgba(0,255,136,0.1)',
                                                color: item.isPositive ? '#ff0055' : '#00ff88'
                                            }}>
                                                {item.isPositive ? 'Positive' : 'Negative'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            {item.diseaseType === 'malaria' ? '🦟 Malaria' : '🦠 Leptospirosis'} • Confidence: {item.confidence?.toFixed(1)}%
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(item.analyzedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

            </div>

            {/* Recent Reports Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="glass-panel"
                style={{ padding: '2rem', marginTop: '1.5rem' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>
                        {role === 'health_officer' ? 'My Personal Analyses' : 
                         role === 'admin' ? 'My Personal Analyses' :
                         role === 'medical_officer' ? 'My Assigned Reviews' :
                         role === 'pathologist' ? 'My Assigned Verifications' :
                         'My Recent Analyses'}
                    </h3>
                    <button style={{ padding: '0.5rem 1rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--color-primary)', borderRadius: '8px', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.875rem' }}>
                        View All
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading reports...</div>
                ) : recentReports.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        {role === 'health_officer' || role === 'admin' 
                            ? 'No personal analyses yet. Use AI Detector or Analyze to create your first analysis.' 
                            : role === 'medical_officer' || role === 'pathologist'
                            ? 'No assigned reports yet.'
                            : 'No analyses yet. Start by using the AI Detector.'}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>ID</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Patient</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Date</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Result</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Confidence</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: '600', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentReports.map((report, i) => (
                                <tr key={report.id} style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>#{i + 1}</td>
                                    <td style={{ padding: '1rem', fontWeight: '600' }}>{report.patient_name}</td>
                                    <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '99px',
                                            background: report.type?.toLowerCase().includes('positive') ? 'rgba(255, 0, 85, 0.1)' : 'rgba(0, 255, 136, 0.1)',
                                            color: report.type?.toLowerCase().includes('positive') ? '#ff0055' : '#00ff88',
                                            fontSize: '0.875rem'
                                        }}>
                                            {report.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{report.confidence ? `${report.confidence.toFixed(1)}%` : '-'}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {report.status === 'approved' && <CheckCircle size={16} color="#28c840" />}
                                            {report.status === 'rejected' && <XCircle size={16} color="#ff0055" />}
                                            {report.status === 'pending' && <Clock size={16} color="#febc2e" />}
                                            <span style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{report.status}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: 'rgba(0, 240, 255, 0.1)',
                                                border: '1px solid var(--color-primary)',
                                                borderRadius: '8px',
                                                color: 'var(--color-primary)',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <Eye size={16} />
                                            View Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </motion.div>

            {/* Report Detail Modal */}
            <AnimatePresence>
                {selectedReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(10px)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2rem'
                        }}
                        onClick={() => setSelectedReport(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{
                                width: '100%',
                                maxWidth: '700px',
                                padding: '2.5rem',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-glass-border)' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Medical Report</h2>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                        Generated on {new Date(selectedReport.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--color-glass-border)',
                                        borderRadius: '8px',
                                        color: 'var(--color-text-muted)',
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Patient Information */}
                            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--color-glass-border)' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={20} />
                                    Patient Information
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Full Name</div>
                                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>{selectedReport.patient_name || 'Unknown'}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Age / Gender</div>
                                        <div style={{ fontWeight: '600' }}>{selectedReport.patient_age || '-'} / {selectedReport.patient_gender || '-'}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Registration Number</div>
                                        <div style={{ fontFamily: 'monospace', fontWeight: '600' }}>{selectedReport.registration_number || '-'}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Health Facility</div>
                                        <div style={{ fontWeight: '600' }}>{selectedReport.health_facility || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Results */}
                            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--color-glass-border)' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={20} />
                                    AI Analysis Results
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Diagnosis</div>
                                        <div style={{
                                            color: selectedReport.type?.toLowerCase().includes('positive') ? '#ff0055' : '#00ff88',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem'
                                        }}>
                                            {selectedReport.type}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Confidence Score</div>
                                        <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                                            {selectedReport.confidence ? `${selectedReport.confidence.toFixed(1)}%` : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Disease Type</div>
                                        <div style={{ textTransform: 'capitalize', fontWeight: '600' }}>{selectedReport.patient_type || 'Unknown'}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Report Status</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {selectedReport.status === 'approved' && <CheckCircle size={18} color="#28c840" />}
                                            {selectedReport.status === 'rejected' && <XCircle size={18} color="#ff0055" />}
                                            {selectedReport.status === 'pending' && <Clock size={18} color="#febc2e" />}
                                            <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{selectedReport.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Close Report
                                </button>
                                <button
                                    onClick={() => alert('Print functionality coming soon!')}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        borderRadius: '99px',
                                        border: '1px solid var(--color-glass-border)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Print / Export
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Overview;
