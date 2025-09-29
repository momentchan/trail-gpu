import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useParticles, useTrails, Ribbon, useRibbonGeometry, useRibbonMaterials } from '../index';
import { DistanceShaderPack } from '../shaders/packs/distance';

export function RibbonTubeDemo() {
    const trailNum = 20;
    const nodeNum = 50;

    const particleConfig = useMemo(() => ({
        gravity: new THREE.Vector3(0, -1, 0),
        damping: 0.02,
        maxSpeed: 5.0,
    }), []);

    // Create particle system
    const particles = useParticles({
        count: trailNum,
        config: particleConfig,
    });

    // Create trail system
    const trails = useTrails({
        nodesPerTrail: nodeNum,
        trailsNum: trailNum,
        updateDistanceMin: 0.05,
        shaderPack: DistanceShaderPack,
    });

    // Create geometry - back to tube
    const geometry = useRibbonGeometry({
        geometryType: 'tube',
        geometryConfig: {
            nodes: nodeNum,
            trails: trailNum,
            segments: 16,
            capStart: false,
            capEnd: false,
        },
    });

    // Create materials - back to tube
    const materials = useRibbonMaterials({
        materialType: 'tube',
        materialConfig: { 
            nodeTex: trails.nodeTexture!, 
            trailTex: trails.trailTexture!, 
            baseWidth: 0.2, // Increased base width for visibility
            nodes: nodeNum, 
            trails: trailNum, 
            color: '#ff6b6b',
            segments: 16, // Pass the segment count to the material
            materialProps: {
                side: THREE.DoubleSide,
            },
        },
    });

    // Update particles each frame
    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;
        particles.update(time, delta);
        trails.update(time, delta, particles.positionsTexture!);
    });

    return (
        <>
            {trails.nodeTexture && trails.trailTexture && materials.material && (
                <group position={[0, 0, 0]}>
                    <Ribbon
                        geometry={geometry}
                        material={materials.material}
                        depthMaterial={materials.depthMaterial}
                        trails={trailNum}
                    />
                </group>
            )}
        </>
    );
}
