import React from 'react';
import { Building2, Microscope, GraduationCap, Globe } from 'lucide-react';

const UseCases = () => {
    const cases = [
        {
            title: "Hospitals & Clinics",
            description: "Rapid triage and diagnostic support for busy emergency departments.",
            icon: <Building2 size={40} color="var(--color-primary)" />
        },
        {
            title: "Pathology Labs",
            description: "High-throughput screening to assist pathologists in sample analysis.",
            icon: <Microscope size={40} color="var(--color-secondary)" />
        },
        {
            title: "Medical Universities",
            description: "Educational tool for training students in parasite identification.",
            icon: <GraduationCap size={40} color="var(--color-accent)" />
        },
        {
            title: "Remote Healthcare",
            description: "Accessible diagnostics for rural areas with limited specialist access.",
            icon: <Globe size={40} color="#00ff88" />
        }
    ];

    return (
        <section id="use-cases" style={{ padding: '8rem 0', background: 'linear-gradient(to top, var(--color-bg), #050a14)' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Trusted <span className="text-gradient">Applications</span></h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Transforming healthcare across multiple sectors.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    {cases.map((item, index) => (
                        <div key={index} className="glass-panel" style={{ padding: '2.5rem', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ marginBottom: '1.5rem' }}>{item.icon}</div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{item.title}</h3>
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default UseCases;
