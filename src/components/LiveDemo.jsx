import React, { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle, Loader, Scan, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveDemo = () => {
    const [status, setStatus] = useState('idle'); // idle, uploaded, scanning, result
    const [file, setFile] = useState(null);

    const handleUpload = () => {
        // Simulate file selection
        setFile({ name: 'blood_sample_001.jpg', size: '2.4 MB' });
        setStatus('uploaded');
    };

    const startAnalysis = () => {
        setStatus('scanning');
        setTimeout(() => {
            setStatus('result');
        }, 3000);
    };

    const reset = () => {
        setStatus('idle');
        setFile(null);
    };

    return (
        <section id="live-demo" style={{ padding: '8rem 0' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Live <span className="text-gradient">Detection Demo</span></h2>
                    <p style={{ color: 'var(--color-text-muted)' }}>Experience the speed and accuracy of our AI model.</p>
                </div>

                <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto', minHeight: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

                    {/* Header */}
                    <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--color-glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>DEMO_MODE_V2.1</span>
                            {status !== 'idle' && <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--color-primary)' }}>{status.toUpperCase()}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }}></div>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }}></div>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }}></div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ flex: 1, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'radial-gradient(circle at center, rgba(0, 85, 255, 0.05) 0%, transparent 70%)' }}>

                        <AnimatePresence mode="wait">
                            {status === 'idle' && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    style={{ textAlign: 'center', border: '2px dashed var(--color-glass-border)', padding: '5rem', borderRadius: '24px', width: '100%', maxWidth: '600px', cursor: 'pointer', transition: 'all 0.3s' }}
                                    onClick={handleUpload}
                                    whileHover={{ borderColor: 'var(--color-primary)', backgroundColor: 'rgba(0, 240, 255, 0.02)', scale: 1.02 }}
                                >
                                    <div style={{ width: '80px', height: '80px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                                        <Upload size={40} color="var(--color-primary)" />
                                    </div>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Upload Blood Smear</h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: '2rem' }}>Drag & drop or click to browse files</p>
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>JPG</span>
                                        <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>PNG</span>
                                        <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>TIFF</span>
                                    </div>
                                </motion.div>
                            )}

                            {status === 'uploaded' && (
                                <motion.div
                                    key="uploaded"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}
                                >
                                    <div style={{ position: 'relative', width: '100%', height: '300px', background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '2rem', border: '1px solid var(--color-glass-border)' }}>
                                        <div style={{ width: '100%', height: '100%', background: '#330011', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {/* Placeholder for uploaded image */}
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <div style={{ position: 'absolute', top: '20%', left: '30%', width: '40px', height: '40px', borderRadius: '50%', background: '#880022', opacity: 0.6 }}></div>
                                                <div style={{ position: 'absolute', top: '60%', left: '70%', width: '50px', height: '50px', borderRadius: '50%', background: '#880022', opacity: 0.6 }}></div>
                                                <div style={{ position: 'absolute', top: '40%', left: '50%', width: '30px', height: '30px', borderRadius: '50%', background: '#880022', opacity: 0.6 }}></div>
                                            </div>
                                        </div>
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{file?.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{file?.size}</div>
                                            </div>
                                            <button onClick={reset} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={startAnalysis}
                                        className="btn-primary"
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            fontSize: '1.125rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
                                            animation: 'pulse-glow 2s infinite'
                                        }}
                                    >
                                        <Scan size={20} /> Analyze Sample
                                    </button>
                                    <style>{`
                                        @keyframes pulse-glow {
                                            0% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.4); }
                                            50% { box-shadow: 0 0 40px rgba(0, 240, 255, 0.6); }
                                            100% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.4); }
                                        }
                                    `}</style>
                                </motion.div>
                            )}

                            {status === 'scanning' && (
                                <motion.div
                                    key="scanning"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    {/* Simulated Image being scanned */}
                                    <div style={{ width: '400px', height: '400px', background: '#330011', borderRadius: '16px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 50px rgba(0, 240, 255, 0.2)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                                        {/* Cells */}
                                        <div style={{ position: 'absolute', top: '20%', left: '30%', width: '40px', height: '40px', borderRadius: '50%', background: '#880022', opacity: 0.6 }}></div>
                                        <div style={{ position: 'absolute', top: '60%', left: '70%', width: '50px', height: '50px', borderRadius: '50%', background: '#880022', opacity: 0.6 }}></div>
                                        <div style={{ position: 'absolute', top: '40%', left: '50%', width: '30px', height: '30px', borderRadius: '50%', background: '#880022', opacity: 0.6 }}></div>

                                        {/* Scanning Grid Effect */}
                                        <div className="scan-grid" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}></div>

                                        {/* Scanning Line */}
                                        <motion.div
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--color-primary)', boxShadow: '0 0 20px var(--color-primary)', zIndex: 3 }}
                                            animate={{ top: ['0%', '100%', '0%'] }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                        />

                                        {/* Data Overlay */}
                                        <div style={{ position: 'absolute', top: '1rem', left: '1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-primary)', zIndex: 4 }}>
                                            <div>SCANNING_SECTOR_7G</div>
                                            <div>CONFIDENCE_THRESHOLD: 0.95</div>
                                        </div>
                                    </div>

                                    <div style={{ position: 'absolute', bottom: '-4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Loader className="spin" size={20} />
                                            <span style={{ letterSpacing: '2px', fontWeight: '600' }}>PROCESSING</span>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Identifying pathogens via CNN...</div>
                                    </div>
                                </motion.div>
                            )}

                            {status === 'result' && (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ width: '100%', display: 'flex', gap: '3rem', alignItems: 'center', padding: '0 2rem' }}
                                >
                                    {/* Result Image */}
                                    <div style={{ width: '350px', height: '350px', background: '#330011', borderRadius: '16px', position: 'relative', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255, 0, 85, 0.5)', boxShadow: '0 0 30px rgba(255, 0, 85, 0.2)' }}>
                                        <div style={{ position: 'absolute', top: '20%', left: '30%', width: '40px', height: '40px', borderRadius: '50%', background: '#880022', opacity: 0.6 }}></div>
                                        <div style={{ position: 'absolute', top: '60%', left: '70%', width: '50px', height: '50px', borderRadius: '50%', background: '#880022', opacity: 0.6, border: '2px solid #ff0055', boxShadow: '0 0 15px #ff0055' }}></div>
                                        <div style={{ position: 'absolute', top: '40%', left: '50%', width: '30px', height: '30px', borderRadius: '50%', background: '#880022', opacity: 0.6 }}></div>

                                        {/* Target Reticle */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 1.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                            style={{ position: 'absolute', top: '60%', left: '70%', width: '60px', height: '60px', transform: 'translate(-50%, -50%)', border: '1px dashed #ff0055', borderRadius: '4px' }}
                                        />

                                        {/* Label */}
                                        <div style={{ position: 'absolute', top: '55%', left: '70%', transform: 'translateX(35px)', background: '#ff0055', color: 'white', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', fontWeight: '600', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                            Malaria (P. falciparum)
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                            <div style={{ padding: '1rem', background: 'rgba(255, 0, 85, 0.1)', borderRadius: '12px', color: '#ff0055' }}>
                                                <AlertTriangle size={32} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '2rem', lineHeight: '1' }}>Pathogen Detected</h3>
                                                <span style={{ color: '#ff0055', fontSize: '0.875rem', fontWeight: '600' }}>HIGH SEVERITY</span>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '2rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Confidence Score</span>
                                                <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>99.8%</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '99.8%' }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--color-secondary), var(--color-primary))', borderRadius: '4px' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ background: 'linear-gradient(135deg, rgba(255, 0, 85, 0.1), transparent)', border: '1px solid rgba(255, 0, 85, 0.2)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                                            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#ff0055' }}>Diagnosis Report</h4>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                                                Sample analyzes indicates presence of <strong>Plasmodium falciparum</strong>. Parasite density is estimated at high levels. Immediate medical intervention is recommended.
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button onClick={reset} className="btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                                                Analyze Another Sample
                                            </button>
                                            <button style={{ padding: '0 1.5rem', border: '1px solid var(--color-glass-border)', borderRadius: '99px', background: 'transparent', color: 'white', fontWeight: '600' }}>
                                                Download Report
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>
            </div>
            <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .scan-grid {
          background-image: linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
        </section>
    );
};

export default LiveDemo;
