import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Scan, Search, FileText } from 'lucide-react';

const steps = [
    {
        id: 1,
        title: "Upload Sample",
        description: "Upload high-resolution blood smear images directly to our secure cloud platform.",
        icon: <Upload size={32} color="#00f0ff" />
    },
    {
        id: 2,
        title: "AI Analysis",
        description: "Our CNN-based model scans the sample pixel-by-pixel using transfer learning.",
        icon: <Scan size={32} color="#00f0ff" />
    },
    {
        id: 3,
        title: "Pathogen Detection",
        description: "Identifies Malaria parasites and Leptospira bacteria with bounding box precision.",
        icon: <Search size={32} color="#00f0ff" />
    },
    {
        id: 4,
        title: "Instant Report",
        description: "Receive a detailed diagnostic report with confidence scores and severity grading.",
        icon: <FileText size={32} color="#00f0ff" />
    }
];

const HowItWorks = () => {
    return (
        <section id="how-it-works" style={{ padding: '8rem 0', position: 'relative' }}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '5rem' }}
                >
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>How It <span className="text-gradient">Works</span></h2>
                    <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                        Seamless integration of advanced AI into your diagnostic workflow.
                    </p>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', position: 'relative' }}>
                    {/* Connecting Line (Desktop) */}
                    <div className="connection-line" style={{
                        position: 'absolute',
                        top: '50px',
                        left: '0',
                        width: '100%',
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, var(--color-secondary), transparent)',
                        zIndex: 0,
                        opacity: 0.3
                    }} />

                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="glass-panel"
                            style={{ padding: '2rem', position: 'relative', zIndex: 1, textAlign: 'center', height: '100%' }}
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'rgba(0, 240, 255, 0.05)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                border: '1px solid var(--color-glass-border)',
                                boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)'
                            }}>
                                {step.icon}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{step.title}</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style>{`
        @media (max-width: 768px) {
          .connection-line { display: none; }
        }
      `}</style>
        </section>
    );
};

export default HowItWorks;
