import * as THREE from 'three';
import { useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTrails, UseTrailsOptions } from './useTrails';

export interface ParticleSystem {
  stepUpdate(timeSec: number, deltaTime: number): void;
  particlesTexture: THREE.Texture;
  dispose(): void;
}

export interface UseTrailsWithParticlesOptions extends UseTrailsOptions {
  particleSystem: ParticleSystem;
  autoUpdate?: boolean;
}

export interface UseTrailsWithParticlesReturn {
  trails: ReturnType<typeof useTrails>['trails'];
  updateSystem: (timeSec: number, deltaTime: number) => void;
  dispose: () => void;
}

export function useTrailsWithParticles({
  particleSystem,
  autoUpdate = true,
  ...trailOptions
}: UseTrailsWithParticlesOptions): UseTrailsWithParticlesReturn {
  const { trails, updateTrails, dispose: disposeTrails } = useTrails(trailOptions);

  // Update function that coordinates particles and trails
  const updateSystem = useCallback((timeSec: number, deltaTime: number) => {
    // Update particles
    particleSystem.stepUpdate(timeSec, deltaTime);
    
    // Update trails with particle positions
    updateTrails(timeSec, particleSystem.particlesTexture);
  }, [particleSystem, updateTrails]);

  // Auto-update with frame loop
  useFrame((state, delta) => {
    if (autoUpdate) {
      const timeSec = state.clock.getElapsedTime();
      updateSystem(timeSec, delta);
    }
  }, -1); // Run before rendering

  // Dispose function
  const dispose = useCallback(() => {
    particleSystem.dispose();
    disposeTrails();
  }, [particleSystem, disposeTrails]);

  return {
    trails,
    updateSystem,
    dispose,
  };
}
