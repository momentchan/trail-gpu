import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useParticles, useTrails, Ribbon, useRibbonGeometry, useRibbonMaterials } from '../index';
import { DistanceShaderPack } from '../shaders/packs/distance';

export function RibbonTubeExample() {
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

    // Create geometry
    const geometry = useRibbonGeometry({
        geometryType: 'tube',
        geometryConfig: {
            nodes: nodeNum,
            trails: trailNum,
            segments: 16,
        },
        nodes: nodeNum,
        trails: trailNum,
    });

    // Create materials
    const materials = useRibbonMaterials({
        materialType: 'tube',
        materialConfig: { 
            nodeTex: trails.nodeTexture!, 
            trailTex: trails.trailTexture!, 
            baseWidth: 0.06, 
            nodes: nodeNum, 
            trails: trailNum, 
            color: '#ff6b6b' 
        },
        nodeTex: trails.nodeTexture!,
        trailTex: trails.trailTexture!,
        baseWidth: 0.06,
        nodes: nodeNum,
        trails: trailNum,
        color: '#ff6b6b',
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
