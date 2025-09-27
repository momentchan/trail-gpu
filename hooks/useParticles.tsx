import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { ParticleCompute } from '../core/compute/ParticleCompute';
import { RenderTargetPool } from '../core/compute/RenderTargetPool';
import { ParticleConfig, ParticleShaderConfig, CustomUniforms } from '../types';

export type UseParticlesConfig = {
    count: number;
    shaderConfig?: ParticleShaderConfig;
    config?: Partial<ParticleConfig>;
    initialPositions?: Float32Array;
    initialVelocities?: Float32Array;
};

export function useParticles(cfg: UseParticlesConfig) {
    const { gl } = useThree();
    const computeRef = useRef<ParticleCompute | null>(null);
    const poolRef = useRef<RenderTargetPool | null>(null);

    const { count, shaderConfig, config = {}, initialPositions, initialVelocities } = cfg;

    useEffect(() => {
        poolRef.current = new RenderTargetPool();
        
        const finalConfig: ParticleConfig = {
            count,
            gravity: new THREE.Vector3(0, -9.81, 0),
            damping: 0.01,
            maxSpeed: 10.0,
            integrationMethod: 'euler',
            ...config,
            initialPositions,
            initialVelocities,
        };

        // Use default shader config if none provided
        const defaultShaderConfig: ParticleShaderConfig = {};
        
        computeRef.current = new ParticleCompute(
            gl,
            finalConfig,
            shaderConfig || defaultShaderConfig,
            poolRef.current
        );

        return () => {
            computeRef.current?.dispose();
            poolRef.current?.dispose();
            computeRef.current = null;
            poolRef.current = null;
        };
    }, [gl, count, shaderConfig, config, initialPositions, initialVelocities]);

    function update(timeSec: number, deltaTime: number, customUniforms?: CustomUniforms) {
        const sys = computeRef.current;
        if (!sys) return;
        sys.step(timeSec, deltaTime, customUniforms);
    }

    function setUniform(name: string, value: any) {
        const sys = computeRef.current;
        if (!sys) return;
        sys.setUniform(name, value);
    }

    function getUniform(name: string) {
        const sys = computeRef.current;
        if (!sys) return;
        return sys.getUniform(name);
    }

    function updateShader(shaderConfig: ParticleShaderConfig) {
        const sys = computeRef.current;
        if (!sys) return;
        sys.updateShader(shaderConfig);
    }
 
    const api = useMemo(() => ({
        update,   
        setUniform,
        getUniform,
        updateShader,
        get positionsTexture(): THREE.Texture | null {
            return computeRef.current ? computeRef.current.positionsTexture : null;
        },
        get velocitiesTexture(): THREE.Texture | null {
            return computeRef.current ? computeRef.current.velocitiesTexture : null;
        },
        get count(): number {
            return computeRef.current ? computeRef.current.count : 0;
        },
    }), []);

    return api;
}
