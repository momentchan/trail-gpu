import { useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { FlowFieldParticles } from '../particles/FlowFieldParticles';
import { ParticleConfig } from '../types';

export interface UseFlowFieldParticlesOptions {
  count: number;
  particleConfig?: Partial<ParticleConfig>;
  initialPositions?: Float32Array;
}

export interface UseFlowFieldParticlesReturn {
  particles: FlowFieldParticles;
  updateParticles: (timeSec: number, deltaTime: number) => void;
  setFlowFieldParams: (speed: number, noiseScale: number, timeScale: number) => void;
  dispose: () => void;
}

export function useFlowFieldParticles({
  count,
  particleConfig = {},
  initialPositions,
}: UseFlowFieldParticlesOptions): UseFlowFieldParticlesReturn {
  const { gl } = useThree();
  
  // Create flow field particle system
  const particles = useMemo(() => {
    const system = new FlowFieldParticles(
      count,
      particleConfig,
      initialPositions
    );
    system.attachRenderer(gl);
    return system;
  }, [gl, count, particleConfig, initialPositions]);

  // Update function
  const updateParticles = useCallback((timeSec: number, deltaTime: number) => {
    particles.stepUpdate(timeSec, deltaTime);
  }, [particles]);

  // Set flow field parameters
  const setFlowFieldParams = useCallback((speed: number, noiseScale: number, timeScale: number) => {
    particles.setFlowFieldParams(speed, noiseScale, timeScale);
  }, [particles]);

  // Dispose function
  const dispose = useCallback(() => {
    particles.dispose();
  }, [particles]);

  return {
    particles,
    updateParticles,
    setFlowFieldParams,
    dispose,
  };
}
