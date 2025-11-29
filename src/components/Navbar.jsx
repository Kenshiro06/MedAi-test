import React, { useState } from 'react';
import { Activity, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ onLoginClick, isLoggedIn }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="glass-panel" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            margin: '1rem',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src="/icon_MedAI.png" alt="MedAI Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
                        Med<span className="text-gradient">AI</span>
                    </span>
                </div>

                {/* Desktop Menu */}
                <div className="desktop-menu" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {!isLoggedIn && ['How it Works', 'AI Models', 'Live Demo', 'Use Cases'].map((item) => (
                        <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} style={{ color: 'var(--color-text-muted)', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}>
                            {item}
                        </a>
                    ))}
                    <button onClick={onLoginClick} className="btn-primary" style={{ boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)' }}>
                        {isLoggedIn ? 'Dashboard' : 'Login Portal'}
                    </button>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="mobile-toggle" style={{ display: 'none' }}>
                    <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'transparent', color: 'var(--color-text)' }}>
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-panel"
                        style={{ position: 'absolute', top: '100%', left: 0, right: 0, margin: '0 1rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                    >
                        {!isLoggedIn && ['How it Works', 'AI Models', 'Live Demo', 'Use Cases'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setIsOpen(false)} style={{ padding: '0.5rem 0' }}>
                                {item}
                            </a>
                        ))}
                        <button onClick={() => { onLoginClick(); setIsOpen(false); }} className="btn-primary" style={{ width: '100%' }}>
                            {isLoggedIn ? 'Dashboard' : 'Login Portal'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
        </nav>
    );
};

export default Navbar;
