import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, User, FileText, Shield, LogIn, RefreshCw, Filter, Calendar } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [limit, setLimit] = useState(50);

    useEffect(() => {
        fetchLogs();
    }, [limit]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('login')) return LogIn;
        if (actionLower.includes('report') || actionLower.includes('submit')) return FileText;
        if (actionLower.includes('analysis') || actionLower.includes('detect')) return Activity;
        if (actionLower.includes('admin') || actionLower.includes('system')) return Shield;
        return User;
    };

    const getActionColor = (action) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('approved') || actionLower.includes('success')) return '#28c840';
        if (actionLower.includes('rejected') || actionLower.includes('delete')) return '#ff0055';
        if (actionLower.includes('pending') || actionLower.includes('review')) return '#febc2e';
        return '#00f0ff';
    };

    const getRoleColor = (role) => {
        const colors = { admin: '#f97316', lab_technician: '#00f0ff', medical_officer: '#00ff88', pathologist: '#a855f7', health_officer: '#3b82f6' };
        return colors[role] || '#ffffff';
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        return log.user_role === filter;
    });

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now - then) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Activity <span className="text-gradient">Logs</span></h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>System-wide audit trail ({filteredLogs.length} activities)</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', cursor: 'pointer', outline: 'none' }}>
                        <option value="all">All Users</option>
                        <option value="admin">Admin</option>
                        <option value="lab_technician">Lab Technician</option>
                        <option value="medical_officer">Medical Officer</option>
                        <option value="pathologist">Pathologist</option>
                        <option value="health_officer">Health Officer</option>
                    </select>
                    <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', cursor: 'pointer', outline: 'none' }}>
                        <option value="50">Last 50</option>
                        <option value="100">Last 100</option>
                        <option value="200">Last 200</option>
                    </select>
                    <button onClick={fetchLogs} disabled={loading} style={{ padding: '0.75rem 1rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--color-primary)', borderRadius: '8px', color: 'var(--color-primary)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>Loading activity logs...</div>
            ) : filteredLogs.length === 0 ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                    <Activity size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No Activity Logs</h3>
                    <p style={{ color: 'var(--color-text-muted)' }}>Activity will appear here as users interact with the system</p>
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                        <div style={{ position: 'absolute', left: '0', top: '0', bottom: '0', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>

                        {filteredLogs.map((log, index) => {
                            const ActionIcon = getActionIcon(log.action);
                            const actionColor = getActionColor(log.action);
                            
                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    style={{ marginBottom: '2rem', position: 'relative' }}
                                >
                                    <div style={{ position: 'absolute', left: '-2.6rem', top: '0', width: '20px', height: '20px', borderRadius: '50%', background: '#050a14', border: `2px solid ${actionColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: actionColor }}></div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-glass-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${getRoleColor(log.user_role)}20`, border: `2px solid ${getRoleColor(log.user_role)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold', color: getRoleColor(log.user_role) }}>
                                                    {log.user_email?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{log.user_email || 'Unknown User'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                        {log.user_role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Role'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>{getTimeAgo(log.created_at)}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', opacity: 0.7 }}>{formatTimestamp(log.created_at)}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ padding: '0.5rem', borderRadius: '8px', background: `${actionColor}20`, color: actionColor }}>
                                                <ActionIcon size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{log.action}</div>
                                                {log.details && (
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{log.details}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityLogs;
