import { useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { GPUTrailParticles } from '../GPUTrailParticles';
import { ParticleConfig } from '../types';
import { updateParticlesFrag } from '../shaders';

export interface UseParticlesOptions {
  count: number;
  fragmentShader?: string;
  particleConfig?: Partial<ParticleConfig>;
  initialPositions?: Float32Array;
}

export interface UseParticlesReturn {
  particles: GPUTrailParticles;
  updateParticles: (timeSec: number, deltaTime: number) => void;
  dispose: () => void;
}

export function useParticles({
  count,
  fragmentShader = updateParticlesFrag,
  particleConfig = {},
  initialPositions,
}: UseParticlesOptions): UseParticlesReturn {
  const { gl } = useThree();
  
  // Create particle system
  const particles = useMemo(() => {
    const system = new GPUTrailParticles(
      count,
      fragmentShader,
      particleConfig,
      initialPositions
    );
    system.attachRenderer(gl);
    return system;
  }, [gl, count, fragmentShader, particleConfig, initialPositions]);

  // Update function
  const updateParticles = useCallback((timeSec: number, deltaTime: number) => {
    particles.stepUpdate(timeSec, deltaTime);
  }, [particles]);

  // Dispose function
  const dispose = useCallback(() => {
    particles.dispose();
  }, [particles]);

  return {
    particles,
    updateParticles,
    dispose,
  };
}
