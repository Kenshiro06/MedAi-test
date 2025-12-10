import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Mail, Phone, MapPin, Linkedin, Twitter, Github, ExternalLink, MessageSquare } from 'lucide-react';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }
        if (!formData.message.trim()) errors.message = 'Message is required';
        return errors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length === 0) {
            setIsSubmitted(true);
            setTimeout(() => {
                setFormData({ name: '', email: '', message: '' });
                setIsSubmitted(false);
            }, 3000);
        } else {
            setFormErrors(errors);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const contactInfo = [
        { icon: Mail, label: 'Email', value: 'contact@medai.com', href: 'mailto:contact@medai.com' },
        { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567', href: 'tel:+15551234567' },
        { icon: MapPin, label: 'Location', value: 'Medical Innovation Hub, San Francisco', href: '#' }
    ];

    const socialLinks = [
        { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
        { icon: Twitter, label: 'Twitter', href: 'https://twitter.com' },
        { icon: Github, label: 'GitHub', href: 'https://github.com' }
    ];

    return (
        <section id="contact" style={{
            position: 'relative',
            padding: '8rem 0',
            background: 'var(--color-bg)',
            overflow: 'hidden'
        }}>
            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center', marginBottom: '4rem' }}
                >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '99px', marginBottom: '1.5rem' }}>
                        <MessageSquare size={16} color="var(--color-primary)" />
                        <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: '600' }}>Contact Us</span>
                    </div>
                    <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: '700', marginBottom: '1rem' }}>
                        Get in <span className="text-gradient">Touch</span>
                    </h2>
                    <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </motion.div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '3rem',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {/* Contact Info & Links */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '2rem' }}>
                            Contact Information
                        </h3>

                        {/* Contact Details */}
                        <div style={{ marginBottom: '3rem' }}>
                            {contactInfo.map((info, index) => (
                                <motion.a
                                    key={index}
                                    href={info.href}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ x: 5 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        marginBottom: '1rem',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease',
                                        cursor: info.href !== '#' ? 'pointer' : 'default'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (info.href !== '#') {
                                            e.currentTarget.style.background = 'rgba(0, 240, 255, 0.05)';
                                            e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: 'rgba(0, 240, 255, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <info.icon size={20} color="var(--color-primary)" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                            {info.label}
                                        </p>
                                        <p style={{ fontSize: '1rem', color: 'white', fontWeight: '500' }}>
                                            {info.value}
                                        </p>
                                    </div>
                                    {info.href !== '#' && (
                                        <ExternalLink size={16} color="var(--color-primary)" style={{ marginLeft: 'auto' }} />
                                    )}
                                </motion.a>
                            ))}
                        </div>

                        {/* Social Links */}
                        <div>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>
                                Follow Us
                            </h4>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {socialLinks.map((social, index) => (
                                    <motion.a
                                        key={index}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.1, y: -3 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '12px',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.3s ease',
                                            textDecoration: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        }}
                                    >
                                        <social.icon size={20} color="var(--color-primary)" />
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <AnimatePresence mode="wait">
                            {isSubmitted ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    style={{
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        border: '1px solid rgba(34, 197, 94, 0.3)',
                                        borderRadius: '24px',
                                        padding: '3rem',
                                        textAlign: 'center'
                                    }}
                                >
                                    <CheckCircle size={64} color="#22c55e" style={{ margin: '0 auto 1.5rem' }} />
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
                                        Message Sent!
                                    </h3>
                                    <p style={{ color: 'var(--color-text-muted)' }}>
                                        Thank you for reaching out. We'll get back to you soon.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSubmit}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(0, 240, 255, 0.2)',
                                        borderRadius: '24px',
                                        padding: '3rem',
                                        backdropFilter: 'blur(20px)'
                                    }}
                                >
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <motion.input
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 }}
                                            type="text"
                                            name="name"
                                            placeholder="Your Name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '1rem 1.5rem',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: `1px solid ${formErrors.name ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontSize: '1rem',
                                                outline: 'none',
                                                transition: 'all 0.3s ease',
                                                boxSizing: 'border-box'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                            onBlur={(e) => e.target.style.borderColor = formErrors.name ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}
                                        />
                                        {formErrors.name && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}
                                            >
                                                {formErrors.name}
                                            </motion.p>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <motion.input
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                            type="email"
                                            name="email"
                                            placeholder="Your Email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '1rem 1.5rem',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: `1px solid ${formErrors.email ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontSize: '1rem',
                                                outline: 'none',
                                                transition: 'all 0.3s ease',
                                                boxSizing: 'border-box'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                            onBlur={(e) => e.target.style.borderColor = formErrors.email ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}
                                        />
                                        {formErrors.email && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}
                                            >
                                                {formErrors.email}
                                            </motion.p>
                                        )}
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <motion.textarea
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 }}
                                            name="message"
                                            placeholder="Your Message"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            rows="5"
                                            style={{
                                                width: '100%',
                                                padding: '1rem 1.5rem',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: `1px solid ${formErrors.message ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontSize: '1rem',
                                                outline: 'none',
                                                transition: 'all 0.3s ease',
                                                resize: 'vertical',
                                                fontFamily: 'inherit',
                                                boxSizing: 'border-box'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                            onBlur={(e) => e.target.style.borderColor = formErrors.message ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}
                                        />
                                        {formErrors.message && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}
                                            >
                                                {formErrors.message}
                                            </motion.p>
                                        )}
                                    </div>

                                    <motion.button
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="btn-primary"
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            fontSize: '1.125rem',
                                            padding: '1rem 2rem'
                                        }}
                                    >
                                        Send Message <Send size={20} />
                                    </motion.button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            {/* Background decoration */}
            <div style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 1
            }} />
        </section>
    );
};

export default Contact;
