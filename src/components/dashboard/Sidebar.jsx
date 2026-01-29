import React from 'react';
import { LayoutDashboard, Microscope, FileText, Send, Users, Activity, Settings, LogOut, BarChart3, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ role, currentView, setView, onLogout, isOpen }) => {
    const menuItems = {
        lab_technician: [
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'detector', label: 'AI Detector', icon: Microscope },
            { id: 'analyze', label: 'Analyze Result', icon: BarChart3 },
            { id: 'submit', label: 'Submit Report', icon: Send },
        ],
        medical_officer: [
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'detector', label: 'AI Detector', icon: Microscope },
            { id: 'analyze', label: 'Analyze Result', icon: BarChart3 },
            { id: 'reports', label: 'Review Reports', icon: FileText },
            { id: 'manage_lab_tech', label: 'Manage Lab Tech', icon: Users },
        ],
        pathologist: [
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'detector', label: 'AI Detector', icon: Microscope },
            { id: 'analyze', label: 'Analyze Result', icon: BarChart3 },
            { id: 'verify', label: 'Verify Reports', icon: FileText },
        ],
        health_officer: [
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'detector', label: 'AI Detector', icon: Microscope },
            { id: 'analyze', label: 'Analyze Result', icon: BarChart3 },
            { id: 'surveillance', label: 'Surveillance', icon: Activity },
        ],
        admin: [
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'detector', label: 'AI Detector', icon: Microscope },
            { id: 'analyze', label: 'Analyze Result', icon: BarChart3 },
            { id: 'users', label: 'Manage Users', icon: Users },
            { id: 'logs', label: 'Activity Logs', icon: Activity }
        ]
    };

    const items = menuItems[role] || menuItems.lab_technician;

    return (
        <>
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{
                    width: '280px',
                    height: '100vh',
                    background: 'rgba(5, 10, 20, 0.95)',
                    borderRight: '1px solid var(--color-glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2rem',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    zIndex: 100,
                    overflowY: 'auto'
                }}
                className="sidebar"
            >
                <motion.button
                    onClick={() => setView('overview')}
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        marginBottom: '3rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.75rem',
                        borderRadius: '16px',
                        transition: 'all 0.3s ease',
                        width: '100%'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <motion.div
                        whileHover={{ rotate: -8, scale: 1.1 }}
                        style={{
                            width: '56px',
                            height: '56px',
                            background: 'transparent',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(0, 240, 255, 0.3)',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                        }}
                    >
                        <img
                            src="/icon_MedAI.png"
                            alt="MedAI Logo"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.4))'
                            }}
                        />
                    </motion.div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <h1 style={{
                            fontSize: '1.85rem',
                            fontWeight: '800',
                            letterSpacing: '-1px',
                            margin: 0,
                            color: 'white',
                            lineHeight: 1
                        }}>
                            Med<span style={{
                                background: 'linear-gradient(135deg, #00f0ff, #ff0055)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                fontWeight: '900'
                            }}>AI</span>
                        </h1>
                        <p style={{
                            fontSize: '0.7rem',
                            color: 'var(--color-text-muted)',
                            margin: 0,
                            marginTop: '0.25rem',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}>
                            Disease Detection
                        </p>
                    </div>
                </motion.button>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {items.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: isActive ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0,0,0,0)',
                                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    textAlign: 'left'
                                }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-glow"
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: '4px',
                                            height: '100%',
                                            background: '#00f0ff',
                                            boxShadow: '0 0 10px #00f0ff'
                                        }}
                                    />
                                )}
                                <item.icon size={20} style={{ filter: isActive ? 'drop-shadow(0 0 5px var(--color-primary))' : 'none' }} />
                                <span style={{ fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </motion.aside>

            <style>{`
                @media (max-width: 768px) {
                    .sidebar {
                        transform: translateX(${isOpen ? '0' : '-100%'}) !important;
                        transition: transform 0.3s ease !important;
                        z-index: 100 !important;
                    }
                }
            `}</style>
        </>
    );
};

export default Sidebar;
