import React, { useState } from 'react';
import { X, User, Lock, Shield, Stethoscope, Users, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/authService';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await authService.login(email, password);
        
        if (result.success) {
            onLogin(result.user.role, result.user);
            onClose();
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(5, 10, 20, 0.8)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{
                        background: 'rgba(20, 30, 50, 0.9)',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                        borderRadius: '24px',
                        padding: '2.5rem',
                        width: '100%',
                        maxWidth: '450px',
                        position: 'relative',
                        boxShadow: '0 0 50px rgba(0, 0, 0, 0.5)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1.5rem',
                            right: '1.5rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={24} />
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome <span className="text-gradient">Back</span></h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Secure Access Portal</p>
                    </div>

                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '1rem',
                            background: 'rgba(255, 0, 85, 0.1)',
                            border: '1px solid rgba(255, 0, 85, 0.3)',
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            color: '#ff0055'
                        }}>
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="input-group">
                            <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                placeholder="IC/MyKad or Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 3rem',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid var(--color-glass-border)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div className="input-group" style={{ position: 'relative' }}>
                            <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 3rem',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid var(--color-glass-border)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    outline: 'none',
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginTop: '1rem'
                            }}
                        >
                            {loading ? 'Authenticating...' : 'Access Dashboard'}
                        </button>
                    </form>

                    {/* Demo Accounts - 5 Roles */}
                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        background: 'rgba(0, 240, 255, 0.05)',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                        borderRadius: '12px'
                    }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>🔑 Demo Accounts</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: 'var(--color-text)', fontWeight: '600' }}>Lab Technician</div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>technician@medai.com</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEmail('technician@medai.com');
                                        setPassword('password123');
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(0, 240, 255, 0.1)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '8px',
                                        color: 'var(--color-primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    Use
                                </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: 'var(--color-text)', fontWeight: '600' }}>Medical Officer</div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>mo@medai.com</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEmail('mo@medai.com');
                                        setPassword('password123');
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(0, 240, 255, 0.1)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '8px',
                                        color: 'var(--color-primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    Use
                                </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: 'var(--color-text)', fontWeight: '600' }}>Pathologist</div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>pathologist@medai.com</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEmail('pathologist@medai.com');
                                        setPassword('password123');
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(0, 240, 255, 0.1)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '8px',
                                        color: 'var(--color-primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    Use
                                </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: 'var(--color-text)', fontWeight: '600' }}>Health Officer</div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>health@medai.com</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEmail('health@medai.com');
                                        setPassword('password123');
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(0, 240, 255, 0.1)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '8px',
                                        color: 'var(--color-primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    Use
                                </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: 'var(--color-text)', fontWeight: '600' }}>Admin</div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>admin@medai.com</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEmail('admin@medai.com');
                                        setPassword('password123');
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(0, 240, 255, 0.1)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '8px',
                                        color: 'var(--color-primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    Use
                                </button>
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255, 188, 46, 0.1)', borderRadius: '8px', fontSize: '0.75rem', color: '#ffbc2e' }}>
                            💡 All passwords: <strong>password123</strong>
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LoginModal;
