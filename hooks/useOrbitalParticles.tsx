import { useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitalParticles } from '../particles/OrbitalParticles';
import { ParticleConfig } from '../types';

export interface UseOrbitalParticlesOptions {
  count: number;
  particleConfig?: Partial<ParticleConfig & { radius?: number; orbitSpeed?: number }>;
  initialPositions?: Float32Array;
}

export interface UseOrbitalParticlesReturn {
  particles: OrbitalParticles;
  updateParticles: (timeSec: number, deltaTime: number) => void;
  setOrbitParams: (radius: number, orbitSpeed: number) => void;
  dispose: () => void;
}

export function useOrbitalParticles({
  count,
  particleConfig = {},
  initialPositions,
}: UseOrbitalParticlesOptions): UseOrbitalParticlesReturn {
  const { gl } = useThree();
  
  // Create orbital particle system
  const particles = useMemo(() => {
    const system = new OrbitalParticles(
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

  // Set orbit parameters
  const setOrbitParams = useCallback((radius: number, orbitSpeed: number) => {
    particles.setOrbitParams(radius, orbitSpeed);
  }, [particles]);

  // Dispose function
  const dispose = useCallback(() => {
    particles.dispose();
  }, [particles]);

  return {
    particles,
    updateParticles,
    setOrbitParams,
    dispose,
  };
}
