import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const RedBloodCell = ({ position, rotation, scale }) => {
    const points = useMemo(() => {
        const _points = [];
        // Create a biconcave profile
        // x is distance from center (radius), y is height

        const radius = 1.2;
        const resolution = 50; // Increased resolution for smoother curve

        // Top surface
        for (let i = 0; i <= resolution; i++) {
            const t = i / resolution; // 0 to 1
            const x = t * radius;

            const normalizedX = x / radius;

            let y = 0;
            if (normalizedX < 1.0) {
                // Refined formula for more "detail" and accuracy
                // Using a mix of cosine for the rim and polynomial for the dimple
                // y = 0.5 * sqrt(1-x^2) * (c0 + c1*x^2 + c2*x^4)

                // Let's try to match the image:
                // The rim is quite thick and rounded. The center is a smooth depression.
                // We can use a cosine wave modulated by the circle shape
                // y = height_factor * (cos(x * PI) * 0.5 + 0.5) ? No, that's a bell.

                // Let's stick to the RBC formula but tune coefficients
                // c0 = 0.2, c1 = 2.0, c2 = -1.12
                // Let's make the rim steeper.

                const baseHeight = 0.5 * Math.sqrt(1 - normalizedX * normalizedX) * (0.25 + 1.8 * normalizedX * normalizedX - 1.0 * normalizedX * normalizedX * normalizedX * normalizedX);
                y = baseHeight * 1.5;
            }
            _points.push(new THREE.Vector2(x, y));
        }

        // Bottom surface (mirror of top)
        for (let i = resolution; i >= 0; i--) {
            const t = i / resolution;
            const x = t * radius;
            const normalizedX = x / radius;

            const baseHeight = 0.5 * Math.sqrt(1 - normalizedX * normalizedX) * (0.25 + 1.8 * normalizedX * normalizedX - 1.0 * normalizedX * normalizedX * normalizedX * normalizedX);
            let y = baseHeight * 1.5;

            _points.push(new THREE.Vector2(x, -y));
        }

        return _points;
    }, []);

    return (
        <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
            <mesh position={position} rotation={rotation} scale={scale}>
                <latheGeometry args={[points, 64]} />
                <meshPhysicalMaterial
                    color="#aa0022" // Deeper red like the image
                    roughness={0.3} // Reduced roughness for more shine
                    metalness={0.2} // Increased metalness slightly
                    clearcoat={0.8} // High clearcoat for "wet" look
                    clearcoatRoughness={0.2}
                    transmission={0.0} // Opaque like the image
                    thickness={1.5}
                />
            </mesh>
        </Float>
    );
};

const Scene3D = () => {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
            <Canvas gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
                <PerspectiveCamera makeDefault position={[0, 0, 10]} />
                <color attach="background" args={['#050a14']} />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={2} color="#0055ff" />
                <pointLight position={[-10, -10, -10]} intensity={1.5} color="#ff0055" />

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                {/* Randomly placed Red Blood Cells */}
                {Array.from({ length: 20 }).map((_, i) => (
                    <RedBloodCell
                        key={i}
                        position={[
                            (Math.random() - 0.5) * 18,
                            (Math.random() - 0.5) * 18,
                            (Math.random() - 0.5) * 10 - 2
                        ]}
                        rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
                        scale={Math.random() * 0.5 + 0.5}
                    />
                ))}

                <Environment preset="city" />
            </Canvas>
        </div>
    );
};

export default Scene3D;
