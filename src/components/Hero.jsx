import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Activity } from 'lucide-react';
import Scene3D from './Scene3D';

const Hero = ({ onLoginClick }) => {
    const scrollToDemo = () => {
        const demoSection = document.getElementById('live-demo');
        if (demoSection) {
            demoSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <Scene3D />

            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ maxWidth: '800px' }}
                >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '99px', marginBottom: '1.5rem' }}>
                        <Activity size={16} color="var(--color-primary)" />
                        <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: '600' }}>AI-Powered Diagnostics v2.0</span>
                    </div>

                    <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem' }}>
                        Malaria & Leptospirosis <br />
                        <span className="text-gradient">Detection Intelligence</span>
                    </h1>

                    <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', marginBottom: '2.5rem', maxWidth: '600px', lineHeight: '1.6' }}>
                        Next-generation diagnostic precision using advanced computer vision.
                        Detect pathogens in seconds with 99.8% accuracy.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={onLoginClick}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', padding: '1rem 2rem' }}
                        >
                            Start Detection <ArrowRight size={20} />
                        </button>

                        <button
                            onClick={scrollToDemo}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '1rem 2rem',
                                borderRadius: '99px',
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                backdropFilter: 'blur(10px)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            View Demo
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Decorative elements */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '150px', background: 'linear-gradient(to top, var(--color-bg), transparent)', zIndex: 5 }} />
        </section>
    );
};

export default Hero;
