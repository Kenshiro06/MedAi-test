import React from 'react';
import { FileText, Users, Activity, Settings } from 'lucide-react';

const Dashboard = () => {
    return (
        <div style={{ padding: '8rem 2rem 4rem', minHeight: '100vh' }}>
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem' }}>Doctor's <span className="text-gradient">Dashboard</span></h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Settings size={18} /> Settings
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {/* Stats Cards */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Total Scans</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>1,284</div>
                        <div style={{ color: '#00ff88', fontSize: '0.875rem' }}>+12% this week</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Positive Cases</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>86</div>
                        <div style={{ color: '#ff0055', fontSize: '0.875rem' }}>Malaria: 64, Lepto: 22</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Avg. Accuracy</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>99.8%</div>
                        <div style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>Model v2.1</div>
                    </div>
                </div>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Recent Analysis</h2>
                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <tr>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>ID</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Patient</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Date</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Result</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Confidence</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                                    <td style={{ padding: '1rem' }}>#SCAN-2025-{100 + i}</td>
                                    <td style={{ padding: '1rem' }}>Patient {1024 + i}</td>
                                    <td style={{ padding: '1rem' }}>Nov {20 - i}, 2025</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '99px',
                                            background: i % 2 === 0 ? 'rgba(255, 0, 85, 0.1)' : 'rgba(0, 255, 136, 0.1)',
                                            color: i % 2 === 0 ? '#ff0055' : '#00ff88',
                                            fontSize: '0.875rem'
                                        }}>
                                            {i % 2 === 0 ? 'Positive' : 'Negative'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>99.{8 - i}%</td>
                                    <td style={{ padding: '1rem' }}>
                                        <button style={{ color: 'var(--color-primary)', background: 'transparent', fontSize: '0.875rem' }}>View Report</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
