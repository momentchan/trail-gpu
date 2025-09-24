import * as THREE from 'three';
import { useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { GPUTrailsPass } from '../GPUTrailsPass';
import { TrailConfig } from '../types';
import { calcInputHeadFrag, calcInputWriteNodeFrag } from '../shaders';

export interface UseTrailsOptions {
  trailConfig?: Partial<TrailConfig>;
}

export interface UseTrailsReturn {
  trails: GPUTrailsPass;
  updateTrails: (timeSec: number, inputTexture: THREE.Texture) => void;
  dispose: () => void;
}

export function useTrails({
  trailConfig = {},
}: UseTrailsOptions = {}): UseTrailsReturn {
  const { gl } = useThree();
  
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

  // Update function that accepts any input texture
  const updateTrails = useCallback((timeSec: number, inputTexture: THREE.Texture) => {
    // Write input positions to trail input
    trails.writeInputFromTexture(inputTexture);
    
    // Update trails
    trails.stepCalcInput(timeSec);
  }, [trails]);

  // Dispose function
  const dispose = useCallback(() => {
    trails.dispose();
  }, [trails]);

  return {
    trails,
    updateTrails,
    dispose,
  };
}
