import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const RedBloodCell = ({ position, rotation, scale }) => {
    return (
        <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
            <mesh position={position} rotation={rotation} scale={scale}>
                {/* Torus geometry to simulate biconcave shape roughly */}
                <torusGeometry args={[1, 0.4, 16, 32]} />
                <meshPhysicalMaterial
                    color="#ff0044"
                    roughness={0.4}
                    metalness={0.1}
                    clearcoat={0.8}
                    clearcoatRoughness={0.2}
                    transmission={0.2} // slight translucency
                    thickness={2}
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

                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#0055ff" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff0055" />

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
