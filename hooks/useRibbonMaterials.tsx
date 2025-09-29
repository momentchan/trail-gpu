import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { materialProviders, MaterialType, MaterialConfig } from '../materials';

export interface UseRibbonMaterialsConfig {
  materialType: MaterialType;
  materialConfig: MaterialConfig;
}

export function useRibbonMaterials({
  materialType,
  materialConfig,
}: UseRibbonMaterialsConfig): {
  material: THREE.Material | null;
  depthMaterial: THREE.Material | null;
} {
  const provider = materialProviders[materialType];
  
  const { material, depthMaterial } = useMemo(() => {
    // Return null if textures aren't ready yet
    if (!materialConfig.nodeTex || !materialConfig.trailTex) {
      return {
        material: null,
        depthMaterial: null,
      };
    }
    
    return {
      material: provider.createMaterial(materialConfig),
      depthMaterial: provider.createDepthMaterial(materialConfig),
    };
  }, [
    provider,
    materialConfig,
  ]);

  // Update uniforms each frame
  const { camera } = useThree();
  useFrame(() => {
    if (material) {
      const uniforms = {
        uCameraPos: { value: camera.position },
        uTime: { value: performance.now() * 0.001 },
      };
      provider.updateUniforms(material, uniforms);
    }
  });

  return { material, depthMaterial };
}