import { useMemo, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { GPUTrailParticles } from '../GPUTrailParticles';
import { GPUTrailsPass } from '../GPUTrailsPass';
import { TrailConfig, ParticleConfig } from '../types';
import { updateParticlesFrag, calcInputHeadFrag, calcInputWriteNodeFrag } from '../shaders';

export interface UseTrailSystemOptions {
  trailConfig?: Partial<TrailConfig>;
  particleConfig?: Partial<ParticleConfig>;
  initialParticlePositions?: Float32Array;
}

export interface UseTrailSystemReturn {
  particles: GPUTrailParticles;
  trails: GPUTrailsPass;
  updateSystem: (timeSec: number, deltaTime: number) => void;
  dispose: () => void;
}

export function useTrailSystem({
  trailConfig = {},
  particleConfig = {},
  initialParticlePositions,
}: UseTrailSystemOptions = {}): UseTrailSystemReturn {
  const { gl } = useThree();
  
  // Create particle system
  const particles = useMemo(() => {
    const system = new GPUTrailParticles(
      trailConfig.trailsNum || 100,
      updateParticlesFrag,
      particleConfig,
      initialParticlePositions
    );
    system.attachRenderer(gl);
    return system;
  }, [gl, trailConfig.trailsNum, particleConfig, initialParticlePositions]);

  // Create trail system
  const trails = useMemo(() => {
    const system = new GPUTrailsPass(
      trailConfig.nodesPerTrail || 60,
      trailConfig.trailsNum || 100,
      calcInputHeadFrag,
      calcInputWriteNodeFrag,
      trailConfig
    );
    system.attachRenderer(gl);
    return system;
  }, [gl, trailConfig.nodesPerTrail, trailConfig.trailsNum, trailConfig.updateDistanceMin]);

  // Update function
  const updateSystem = useCallback((timeSec: number, deltaTime: number) => {
    // Update particles
    particles.stepUpdate(timeSec, deltaTime);
    
    // Write particle positions to trail input
    trails.writeInputFromTexture(particles.particlesTexture);
    
    // Update trails
    trails.stepCalcInput(timeSec);
  }, [particles, trails]);

  // Dispose function
  const dispose = useCallback(() => {
    particles.dispose();
    trails.dispose();
  }, [particles, trails]);

  return {
    particles,
    trails,
    updateSystem,
    dispose,
  };
}

// Hook for automatic frame updates
export function useTrailSystemWithFrame(options: UseTrailSystemOptions = {}) {
  const trailSystem = useTrailSystem(options);
  const { updateSystem } = trailSystem;

  useFrame((state, delta) => {
    const timeSec = state.clock.getElapsedTime();
    updateSystem(timeSec, delta);
  }, -1); // Run before rendering

  return trailSystem;
}
