import * as THREE from 'three';
import { useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { TrailGPUError } from '../types';

export interface UseRibbonUniformsOptions {
  material: CustomShaderMaterial;
  nodes: number;
  trails: number;
}

/**
 * Custom hook for updating ribbon uniforms each frame
 */
export function useRibbonUniforms({ material, nodes, trails }: UseRibbonUniformsOptions) {
  const { camera } = useThree();

  // Validate inputs
  if (!material) {
    throw new TrailGPUError('useRibbonUniforms: material is required');
  }
  if (nodes <= 0 || trails <= 0) {
    throw new TrailGPUError('useRibbonUniforms: nodes and trails must be greater than 0');
  }

  const updateUniforms = useCallback(() => {
    if (material.uniforms) {
      material.uniforms.uCameraPos.value.copy(camera.position);
      material.uniforms.uNodes.value = nodes;
      material.uniforms.uTrails.value = trails;
      material.uniforms.uTime.value = performance.now() * 0.001; // Convert to seconds
    }
  }, [material, camera, nodes, trails]);

  useFrame(updateUniforms);
}
