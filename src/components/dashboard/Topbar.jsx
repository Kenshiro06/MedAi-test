import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Settings, LogOut, ChevronDown, Activity, Clock, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Topbar = ({ role, user, onNavigate, onLogout }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Refresh notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50); // Fetch more to filter

            if (error) throw error;

            // For Medical Officers, also fetch reports assigned to them
            let assignedReportIds = [];
            if (role === 'medical_officer' && user?.id) {
                const { data: reports } = await supabase
                    .from('reports')
                    .select('id')
                    .eq('medical_officer_id', user.id)
                    .eq('status', 'pending');
                
                assignedReportIds = reports?.map(r => r.id) || [];
            }

            // Filter notifications based on user role
            let filtered = [];

            if (role === 'lab_technician') {
                // Lab techs see their own analysis activities, report submissions, and FINAL feedback from Pathologist
                filtered = data?.filter(n => {
                    // Show only activities created by this specific user
                    const isOwnAnalysis = n.user_id === user?.id && (
                        n.action.includes('Analysis Created') ||
                        n.action.includes('Analysis Deleted') ||
                        n.action.includes('Analysis Edited')
                    );
                    
                    // Show their own report submissions
                    const isOwnReportSubmission = n.user_id === user?.id && 
                        n.action.includes('Report Submitted');
                    
                    // Show FINAL feedback from Pathologist (not MO feedback)
                    const isFinalFeedback = n.details?.includes(user?.email) && (
                        n.action.includes('Report Verified (Pathologist)') ||
                        n.action.includes('Report Rejected (Pathologist)')
                    );
                    
                    return isOwnAnalysis || isOwnReportSubmission || isFinalFeedback;
                }) || [];
            } else if (role === 'medical_officer') {
                // Medical officers see their own analyses, reports submitted to them, their actions, and Pathologist feedback
                filtered = data?.filter(n => {
                    // Show their own analysis activities (when MO does analysis)
                    const isOwnAnalysis = n.user_id === user?.id && (
                        n.action.includes('Analysis Created') ||
                        n.action.includes('Analysis Deleted') ||
                        n.action.includes('Analysis Edited')
                    );
                    
                    // Show ALL report submissions (MOs need to see new reports)
                    const isReportSubmitted = n.action.includes('Report Submitted');
                    
                    // Show their own approval/rejection actions
                    const isOwnReviewAction = n.user_id === user?.id && (
                        n.action.includes('Report Approved (MO)') ||
                        n.action.includes('Report Rejected (MO)')
                    );
                    
                    // Show feedback from Pathologist on reports they approved
                    const isPathologistFeedback = n.details?.includes(user?.email) && (
                        n.action.includes('Report Verified (Pathologist)') ||
                        n.action.includes('Report Rejected (Pathologist)')
                    );
                    
                    return isOwnAnalysis || isReportSubmitted || isOwnReviewAction || isPathologistFeedback;
                }) || [];
            } else if (role === 'pathologist') {
                // Pathologists see their own analyses, reports approved by MO, and their own actions
                filtered = data?.filter(n => {
                    // Show their own analysis activities
                    const isOwnAnalysis = n.user_id === user?.id && (
                        n.action.includes('Analysis Created') ||
                        n.action.includes('Analysis Deleted') ||
                        n.action.includes('Analysis Edited')
                    );
                    
                    // Show reports approved by MO (assigned to them for verification)
                    const isAssignedReport = n.action.includes('Report Approved (MO)');
                    
                    // Show their own review actions
                    const isOwnReviewAction = n.user_id === user?.id && (
                        n.action.includes('Report Verified (Pathologist)') ||
                        n.action.includes('Report Rejected (Pathologist)')
                    );
                    
                    return isOwnAnalysis || isAssignedReport || isOwnReviewAction;
                }) || [];
            } else if (role === 'health_officer') {
                // Health officers see their own analyses and final approved reports
                filtered = data?.filter(n => {
                    // Show their own analysis activities
                    const isOwnAnalysis = n.user_id === user?.id && (
                        n.action.includes('Analysis Created') ||
                        n.action.includes('Analysis Deleted') ||
                        n.action.includes('Analysis Edited')
                    );
                    
                    // Show final approved reports for surveillance
                    const isFinalApproval = n.action.includes('Report Verified (Pathologist)');
                    
                    return isOwnAnalysis || isFinalApproval;
                }) || [];
            } else if (role === 'admin') {
                // Admins see their own analyses and everything important
                filtered = data?.filter(n => {
                    // Show their own analysis activities
                    const isOwnAnalysis = n.user_id === user?.id && (
                        n.action.includes('Analysis Created') ||
                        n.action.includes('Analysis Deleted') ||
                        n.action.includes('Analysis Edited')
                    );
                    
                    // Show all important system activities
                    const importantActions = [
                        'Analysis Created',
                        'Report Submitted',
                        'Report Approved (MO)',
                        'Report Rejected (MO)',
                        'Report Verified (Pathologist)',
                        'Report Rejected (Pathologist)',
                        'User Added',
                        'User Deleted',
                        'Analysis Deleted'
                    ];
                    const isImportantActivity = importantActions.some(action => n.action.includes(action));
                    
                    return isOwnAnalysis || isImportantActivity;
                }) || [];
            }

            // Limit to last 15 notifications
            filtered = filtered.slice(0, 15);

            setNotifications(filtered);
            
            // Count unread (activities from last 24 hours)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const unread = filtered.filter(n => new Date(n.created_at) > oneDayAgo).length || 0;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000); // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const getActionIcon = (action) => {
        if (action.includes('Analysis Created')) return '🔬';
        if (action.includes('Analysis Deleted')) return '🗑️';
        if (action.includes('Report Submitted')) return '📤';
        if (action.includes('Approved')) return '✅';
        if (action.includes('Rejected')) return '❌';
        if (action.includes('User Added')) return '👤';
        if (action.includes('User Deleted')) return '🚫';
        return '📌';
    };

    const deleteNotification = async (notificationId) => {
        try {
            const { error } = await supabase
                .from('activity_logs')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;

            // Remove from local state
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Delete all current notifications from database
            const notificationIds = notifications.map(n => n.id);
            
            if (notificationIds.length > 0) {
                const { error } = await supabase
                    .from('activity_logs')
                    .delete()
                    .in('id', notificationIds);

                if (error) throw error;
            }

            // Clear local state
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const getNotificationMessage = (notification) => {
        const userName = notification.user_email?.split('@')[0] || 'Someone';
        const action = notification.action;
        
        if (action.includes('Analysis Created')) {
            return `${userName} created a new analysis`;
        }
        if (action.includes('Report Submitted')) {
            return `${userName} submitted a report for review`;
        }
        if (action.includes('Approved (Medical Officer)')) {
            return `Medical Officer approved a report`;
        }
        if (action.includes('Rejected (Medical Officer)')) {
            return `Medical Officer rejected a report`;
        }
        if (action.includes('Approved (Pathologist)')) {
            return `Pathologist approved a report`;
        }
        if (action.includes('Rejected (Pathologist)')) {
            return `Pathologist rejected a report`;
        }
        if (action.includes('User Added')) {
            return `${userName} added a new user`;
        }
        if (action.includes('Analysis Deleted')) {
            return `${userName} deleted an analysis`;
        }
        return action;
    };
    return (
        <header
            style={{
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2rem',
                borderBottom: '1px solid var(--color-glass-border)',
                background: 'rgba(5, 10, 20, 0.8)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 90
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', textTransform: 'capitalize' }}>
                    {role} <span style={{ color: 'var(--color-text-muted)', fontWeight: '400' }}>Portal</span>
                </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div ref={notificationRef} style={{ position: 'relative' }}>
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            style={{ 
                                position: 'relative', 
                                background: 'transparent', 
                                border: 'none', 
                                color: showNotifications ? 'var(--color-primary)' : 'var(--color-text-muted)', 
                                cursor: 'pointer',
                                transition: 'color 0.2s'
                            }}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span style={{ 
                                    position: 'absolute', 
                                    top: '-4px', 
                                    right: '-4px', 
                                    minWidth: '18px',
                                    height: '18px',
                                    background: '#ff0055', 
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    padding: '0 4px'
                                }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 0.5rem)',
                                    right: 0,
                                    width: '320px',
                                    maxHeight: '420px',
                                    background: 'rgba(5, 10, 20, 0.98)',
                                    border: '1px solid var(--color-glass-border)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                                    zIndex: 1000,
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ 
                                    padding: '1rem 1.5rem', 
                                    borderBottom: '1px solid var(--color-glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Activity size={18} color="var(--color-primary)" />
                                        Recent Activity
                                    </h3>
                                    {unreadCount > 0 && (
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            color: 'var(--color-primary)',
                                            background: 'rgba(0, 240, 255, 0.1)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px'
                                        }}>
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>

                                <div style={{ maxHeight: '280px', overflowY: 'auto', overflowX: 'hidden' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ 
                                            padding: '3rem 1.5rem', 
                                            textAlign: 'center', 
                                            color: 'var(--color-text-muted)' 
                                        }}>
                                            <Bell size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                            <p>No recent activity</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification, index) => (
                                            <div
                                                key={notification.id}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    borderBottom: index < notifications.length - 1 ? '1px solid var(--color-glass-border)' : 'none',
                                                    transition: 'background 0.2s',
                                                    background: new Date(notification.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) 
                                                        ? 'rgba(0, 240, 255, 0.03)' 
                                                        : 'rgba(0,0,0,0)',
                                                    position: 'relative'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = new Date(notification.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) 
                                                    ? 'rgba(0, 240, 255, 0.03)' 
                                                    : 'rgba(0,0,0,0)'}
                                            >
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
                                                    <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                                                        {getActionIcon(notification.action)}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ 
                                                            fontSize: '0.8rem', 
                                                            fontWeight: '600',
                                                            marginBottom: '0.15rem',
                                                            color: 'white',
                                                            lineHeight: '1.3'
                                                        }}>
                                                            {getNotificationMessage(notification)}
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: '0.7rem', 
                                                            color: 'var(--color-text-muted)',
                                                            marginBottom: '0.15rem',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {notification.details}
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: '0.65rem', 
                                                            color: 'var(--color-primary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem'
                                                        }}>
                                                            <Clock size={10} />
                                                            {getTimeAgo(notification.created_at)}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification(notification.id);
                                                        }}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--color-text-muted)',
                                                            cursor: 'pointer',
                                                            padding: '0.25rem',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(255, 0, 85, 0.1)';
                                                            e.currentTarget.style.color = '#ff0055';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'rgba(0,0,0,0)';
                                                            e.currentTarget.style.color = 'var(--color-text-muted)';
                                                        }}
                                                        title="Delete notification"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div style={{ 
                                    padding: '0.75rem 1.5rem', 
                                    borderTop: '1px solid var(--color-glass-border)',
                                    textAlign: 'center',
                                    background: 'rgba(5, 10, 20, 0.98)',
                                    position: 'sticky',
                                    bottom: 0
                                }}>
                                    <button
                                        onClick={() => {
                                            markAllAsRead();
                                            setShowNotifications(false);
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--color-primary)',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.color = '#ff0055'}
                                        onMouseLeave={(e) => e.target.style.color = 'var(--color-primary)'}
                                    >
                                        Clear all notifications
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                paddingLeft: '1rem',
                                borderLeft: '1px solid var(--color-glass-border)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'white'
                            }}
                        >
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                    {user?.full_name || user?.email?.split('@')[0] || 'User'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    {role.toUpperCase()}
                                </div>
                            </div>
                            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <User size={20} color="white" />
                            </div>
                            <ChevronDown size={16} style={{ color: 'var(--color-text-muted)', transition: 'transform 0.3s', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </button>

                        {showDropdown && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 0.5rem)',
                                    right: 0,
                                    width: '220px',
                                    background: 'rgba(5, 10, 20, 0.98)',
                                    border: '1px solid var(--color-glass-border)',
                                    borderRadius: '12px',
                                    padding: '0.5rem',
                                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                                    zIndex: 1000
                                }}
                            >
                                <button
                                    onClick={() => {
                                        onNavigate('profile');
                                        setShowDropdown(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = 'rgba(0, 240, 255, 0.1)'}
                                    onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0)'}
                                >
                                    <User size={18} color="var(--color-primary)" />
                                    <span>My Profile</span>
                                </button>

                                <button
                                    onClick={() => {
                                        onNavigate('settings');
                                        setShowDropdown(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = 'rgba(0, 240, 255, 0.1)'}
                                    onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0)'}
                                >
                                    <Settings size={18} color="var(--color-primary)" />
                                    <span>Settings</span>
                                </button>

                                <div style={{ height: '1px', background: 'var(--color-glass-border)', margin: '0.5rem 0' }} />

                                <button
                                    onClick={() => {
                                        onLogout();
                                        setShowDropdown(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#ff0055',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 0, 85, 0.1)'}
                                    onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0)'}
                                >
                                    <LogOut size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
