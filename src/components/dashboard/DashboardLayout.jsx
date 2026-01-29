import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUserLanguage } from '../../hooks/useUserLanguage';
import { Menu, X } from 'lucide-react';

const DashboardLayout = ({ role, user, currentView, setView, onLogout, children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Load user's language preference from database
    useUserLanguage(user);
    
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#050a14' }}>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                    position: 'fixed',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 200,
                    background: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid var(--color-glass-border)',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    display: 'none',
                    color: 'var(--color-primary)',
                    backdropFilter: 'blur(10px)'
                }}
                className="mobile-menu-btn"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        zIndex: 99,
                        display: 'none'
                    }}
                    className="mobile-overlay"
                />
            )}

            <Sidebar 
                role={role} 
                currentView={currentView} 
                setView={(view) => {
                    setView(view);
                    setSidebarOpen(false);
                }} 
                isOpen={sidebarOpen}
            />
            
            <div style={{ 
                flex: 1, 
                marginLeft: '280px', 
                display: 'flex', 
                flexDirection: 'column',
                width: '100%'
            }} className="main-content">
                <Topbar role={role} user={user} onNavigate={setView} onLogout={onLogout} />
                <main style={{ 
                    flex: 1, 
                    padding: '2rem', 
                    overflowY: 'auto',
                    width: '100%',
                    maxWidth: '100%'
                }} className="dashboard-main">
                    {children}
                </main>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .mobile-menu-btn {
                        display: flex !important;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .mobile-overlay {
                        display: block !important;
                    }
                    
                    .main-content {
                        margin-left: 0 !important;
                    }
                    
                    .dashboard-main {
                        padding: 1rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default DashboardLayout;
