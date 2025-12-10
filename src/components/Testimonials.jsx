import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Building2, Microscope, Users } from 'lucide-react';

const Testimonials = () => {
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    const testimonials = [
        {
            quote: "This AI system has revolutionized our diagnostic workflow. We've seen a 40% reduction in diagnostic time.",
            author: "Dr. Sarah Chen",
            role: "Chief Pathologist",
            organization: "Singapore General Hospital",
            useCase: "Clinical Diagnostics"
        },
        {
            quote: "The accuracy is remarkable. It's become an indispensable tool in our malaria screening program.",
            author: "Prof. Michael Okonkwo",
            role: "Research Director",
            organization: "African Disease Center",
            useCase: "Research & Screening"
        },
        {
            quote: "Implementing this technology in rural clinics has improved early detection rates by over 60%.",
            author: "Dr. Ananya Patel",
            role: "Public Health Officer",
            organization: "WHO Regional Office",
            useCase: "Field Operations"
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section id="testimonials" style={{
            position: 'relative',
            padding: '8rem 0',
            background: 'linear-gradient(180deg, var(--color-bg) 0%, rgba(10, 25, 47, 0.95) 100%)',
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
                        <Users size={16} color="var(--color-primary)" />
                        <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: '600' }}>Client Testimonials</span>
                    </div>
                    <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: '700', marginBottom: '1rem' }}>
                        Trusted by <span className="text-gradient">Healthcare Leaders</span>
                    </h2>
                    <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                        See how institutions worldwide are transforming diagnostics with our AI
                    </p>
                </motion.div>

                {/* Carousel */}
                <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTestimonial}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(0, 240, 255, 0.2)',
                                borderRadius: '24px',
                                padding: '3rem',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 8px 32px rgba(0, 240, 255, 0.1)'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={20} fill="var(--color-primary)" color="var(--color-primary)" />
                                ))}
                            </div>

                            <p style={{
                                fontSize: '1.5rem',
                                lineHeight: '1.8',
                                color: 'white',
                                marginBottom: '2rem',
                                fontStyle: 'italic',
                                textAlign: 'center'
                            }}>
                                "{testimonials[currentTestimonial].quote}"
                            </p>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                                            {testimonials[currentTestimonial].author}
                                        </p>
                                        <p style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                                            {testimonials[currentTestimonial].role}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                            <Building2 size={16} color="var(--color-text-muted)" />
                                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                {testimonials[currentTestimonial].organization}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(0, 240, 255, 0.1)',
                                    border: '1px solid rgba(0, 240, 255, 0.3)',
                                    borderRadius: '99px',
                                    margin: '0 auto',
                                    justifyContent: 'center',
                                    width: 'fit-content',
                                    marginTop: '1rem'
                                }}>
                                    <Microscope size={16} color="var(--color-primary)" />
                                    <span style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: '600' }}>
                                        Use Case: {testimonials[currentTestimonial].useCase}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                background: 'rgba(0, 240, 255, 0.1)',
                                border: '1px solid rgba(0, 240, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <ChevronLeft color="var(--color-primary)" size={24} />
                        </motion.button>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {testimonials.map((_, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => setCurrentTestimonial(index)}
                                    animate={{
                                        width: currentTestimonial === index ? '40px' : '12px',
                                        background: currentTestimonial === index
                                            ? 'var(--color-primary)'
                                            : 'rgba(255,255,255,0.2)'
                                    }}
                                    style={{
                                        height: '12px',
                                        borderRadius: '99px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                background: 'rgba(0, 240, 255, 0.1)',
                                border: '1px solid rgba(0, 240, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <ChevronRight color="var(--color-primary)" size={24} />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Background decoration */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(0, 240, 255, 0.05) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 1
            }} />
        </section>
    );
};

export default Testimonials;
