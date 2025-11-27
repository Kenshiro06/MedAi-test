import React from 'react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
    return (
        <footer style={{ background: 'rgba(0,0,0,0.8)', padding: '4rem 0', marginTop: '4rem', borderTop: '1px solid var(--color-glass-border)' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Med<span className="text-gradient">AI</span></h3>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                            Next-generation diagnostic intelligence for rapid, accurate detection of Malaria and Leptospirosis using advanced computer vision.
                        </p>
                    </div>

                    <div>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Platform</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li><a href="#" style={{ color: 'var(--color-text-muted)' }}>Technology</a></li>
                            <li><a href="#" style={{ color: 'var(--color-text-muted)' }}>Research</a></li>
                            <li><a href="#" style={{ color: 'var(--color-text-muted)' }}>Clinical Trials</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Connect</h4>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <a href="#" style={{ color: 'var(--color-text)', transition: 'color 0.2s' }}><Github size={20} /></a>
                            <a href="#" style={{ color: 'var(--color-text)', transition: 'color 0.2s' }}><Twitter size={20} /></a>
                            <a href="#" style={{ color: 'var(--color-text)', transition: 'color 0.2s' }}><Linkedin size={20} /></a>
                            <a href="#" style={{ color: 'var(--color-text)', transition: 'color 0.2s' }}><Mail size={20} /></a>
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--color-glass-border)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    © 2025 MedAI Diagnostics. Powered by Advanced Medical AI Technologies.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
