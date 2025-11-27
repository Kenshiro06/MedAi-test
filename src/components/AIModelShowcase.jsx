import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

const NeuralNetwork = () => {
    const points = useMemo(() => {
        const p = new Float32Array(300 * 3);
        for (let i = 0; i < 300; i++) {
            const theta = THREE.MathUtils.randFloatSpread(360);
            const phi = THREE.MathUtils.randFloatSpread(360);
            const r = 4 + Math.random() * 2;

            p[i * 3] = r * Math.sin(theta) * Math.cos(phi);
            p[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            p[i * 3 + 2] = r * Math.cos(theta);
        }
        return p;
    }, []);

    const ref = useRef();
    useFrame((state, delta) => {
        ref.current.rotation.x -= delta / 10;
        ref.current.rotation.y -= delta / 15;
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={points} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#00f0ff"
                    size={0.1}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
};

const AIModelShowcase = () => {
    return (
        <section id="ai-models" style={{ padding: '8rem 0', background: 'linear-gradient(to bottom, var(--color-bg), #050a14)' }}>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
                        Powered by <br />
                        <span className="text-gradient">Advanced Neural Networks</span>
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>VGG16 Transfer Learning</h4>
                            <p style={{ color: 'var(--color-text-muted)' }}>
                                Pre-trained on millions of images, fine-tuned for microscopic hematology with 99.8% validation accuracy.
                            </p>
                        </div>

                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Real-time Augmentation</h4>
                            <p style={{ color: 'var(--color-text-muted)' }}>
                                Dynamic rotation, scaling, and lighting adjustments to ensure robust detection across varying lab conditions.
                            </p>
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem', display: 'flex', gap: '3rem' }}>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>99.8%</div>
                            <div style={{ color: 'var(--color-text-muted)' }}>Accuracy</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>&lt;2s</div>
                            <div style={{ color: 'var(--color-text-muted)' }}>Processing Time</div>
                        </div>
                    </div>
                </motion.div>

                {/* 3D Visualization */}
                <div style={{ height: '500px', position: 'relative' }}>
                    <div className="glass-panel" style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
                            <ambientLight intensity={0.5} />
                            <NeuralNetwork />
                            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                                <mesh>
                                    <sphereGeometry args={[2, 32, 32]} />
                                    <meshStandardMaterial color="#0055ff" wireframe transparent opacity={0.1} />
                                </mesh>
                            </Float>
                        </Canvas>
                        {/* Overlay UI */}
                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                            <span>STATUS: ACTIVE</span>
                            <span>NODES: 4,096</span>
                            <span>LAYERS: 16</span>
                        </div>
                    </div>
                </div>

            </div>
            <style>{`
        @media (max-width: 968px) {
          .container { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </section>
    );
};

export default AIModelShowcase;
