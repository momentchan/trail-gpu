import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useParticles, useTrails, Ribbon, ParticleDebugPoints, useRibbonGeometry, useRibbonMaterials } from '../index';
import { DistanceShaderPack } from '../shaders/packs/distance';

export function ParticleBasic() {
    // Create particle system with default velocity/position shaders

    const config = useMemo(() => ({
        gravity: new THREE.Vector3(0, -2, 0),
        damping: 0.02,
        maxSpeed: 8.0,
    }), []);

    // Create particle system
    const particles = useParticles({
        count: 500,
        config: config,
    });

    // Create trail system
    const trails = useTrails({
        nodesPerTrail: 60,
        trailsNum: 500,
        updateDistanceMin: 0.05,
        shaderPack: DistanceShaderPack,
    });

    // Update particles and trails each frame
    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;
        particles.update(time, delta);
        trails.update(time, delta, particles.positionsTexture!);
    });

    // Create geometry
    const geometry = useRibbonGeometry({
        geometryType: 'quad',
        geometryConfig: { nodes: 60, trails: 500, width: 1.0 },
    });

    // Create materials
    const materials = useRibbonMaterials({
        materialType: 'standard',
        materialConfig: { 
            nodeTex: trails.nodeTexture!, 
            trailTex: trails.trailTexture!, 
            baseWidth: 0.08, 
            nodes: 60, 
            trails: 500, 
            color: '#8ec5ff' 
        },
    });

    return (
        <>
            {trails.nodeTexture && trails.trailTexture && materials.material && (
                <Ribbon
                    geometry={geometry}
                    material={materials.material}
                    depthMaterial={materials.depthMaterial}
                    trails={500}
                />
            )}
            
            {/* Debug particles */}
            <ParticleDebugPoints
                particleTexture={particles.positionsTexture!}
                count={500}
                size={0.05}
                color="#ff0000"
            />
        </>
    );
}
