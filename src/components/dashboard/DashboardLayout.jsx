import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const DashboardLayout = ({ role, user, currentView, setView, onLogout, children }) => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#050a14' }}>
            <Sidebar role={role} currentView={currentView} setView={setView} />
            <div style={{ flex: 1, marginLeft: '280px', display: 'flex', flexDirection: 'column' }}>
                <Topbar role={role} user={user} onNavigate={setView} onLogout={onLogout} />
                <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
