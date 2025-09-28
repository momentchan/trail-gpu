import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { materialProviders, MaterialType, MaterialConfig } from '../materials';

export interface UseRibbonMaterialsConfig {
  materialType: MaterialType;
  materialConfig: MaterialConfig;
  nodeTex: THREE.Texture;
  trailTex: THREE.Texture;
  baseWidth: number;
  nodes: number;
  trails: number;
  color: string;
  materialProps?: Partial<THREE.MeshStandardMaterialParameters>;
}

export function useRibbonMaterials({
  materialType,
  materialConfig,
  nodeTex,
  trailTex,
  baseWidth,
  nodes,
  trails,
  color,
  materialProps = {},
}: UseRibbonMaterialsConfig): {
  material: THREE.Material | null;
  depthMaterial: THREE.Material | null;
} {
  const provider = materialProviders[materialType];
  
  const { material, depthMaterial } = useMemo(() => {
    // Return null if textures aren't ready yet
    if (!nodeTex || !trailTex) {
      return {
        material: null,
        depthMaterial: null,
      };
    }
    
    const config = {
      ...materialConfig,
      nodeTex,
      trailTex,
      baseWidth,
      nodes,
      trails,
      color,
      materialProps,
    };
    
    return {
      material: provider.createMaterial(config),
      depthMaterial: provider.createDepthMaterial(config),
    };
  }, [
    provider,
    nodeTex,
    trailTex,
    baseWidth,
    nodes,
    trails,
    color,
    materialProps,
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