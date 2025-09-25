import * as THREE from 'three';
import { useMemo } from 'react';
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { SHADER_CONSTANTS } from '../shaders';
import { TrailGPUError } from '../types';

export interface UseRibbonMaterialsOptions {
  nodeTex: THREE.Texture;
  trailTex: THREE.Texture;
  baseWidth: number;
  nodes: number;
  trails: number;
  color: string;
  materialProps?: Partial<THREE.MeshStandardMaterialParameters>;
  customVertexShader?: string;
  customFragmentShader?: string;
  customUniforms?: { [key: string]: { value: any } };
}

export interface UseRibbonMaterialsReturn {
  material: CustomShaderMaterial;
  depthMaterial: CustomShaderMaterial;
  baseUniforms: { [key: string]: { value: any } };
}

/**
 * Custom hook for creating ribbon materials with proper uniforms
 */
export function useRibbonMaterials({
  nodeTex,
  trailTex,
  baseWidth,
  nodes,
  trails,
  color,
  materialProps = {},
  customVertexShader,
  customFragmentShader,
  customUniforms = {},
}: UseRibbonMaterialsOptions): UseRibbonMaterialsReturn {
  
  // Validate inputs
  if (!nodeTex || !trailTex) {
    throw new TrailGPUError('useRibbonMaterials: nodeTex and trailTex are required');
  }
  if (baseWidth <= 0) {
    throw new TrailGPUError('useRibbonMaterials: baseWidth must be greater than 0');
  }
  if (nodes <= 0 || trails <= 0) {
    throw new TrailGPUError('useRibbonMaterials: nodes and trails must be greater than 0');
  }
  
  // Create base uniforms that are always needed
  const baseUniforms = useMemo(() => {
    const colorObj = new THREE.Color(color);
    
    return {
      uNodeTex: { value: nodeTex },
      uTrailTex: { value: trailTex },
      uBaseWidth: { value: baseWidth },
      uNodes: { value: nodes },
      uTrails: { value: trails },
      uCameraPos: { value: new THREE.Vector3() },
      uColor: { value: colorObj },
      uTime: { value: 0 },
      uDebug: { value: 0 },
    };
  }, [nodeTex, trailTex, baseWidth, nodes, trails, color]);

  // Create main material with optimized dependencies
  const material = useMemo(() => {
    // Merge base uniforms with custom uniforms
    const uniforms = {
      ...baseUniforms,
      ...customUniforms,
    };

    // Use custom shaders or fallback to defaults
    const vertexShader = customVertexShader || SHADER_CONSTANTS.RIBBON_VERTEX;
    const fragmentShader = customFragmentShader || SHADER_CONSTANTS.RIBBON_FRAGMENT;
    // Create base material with flexible properties
    const baseMaterial = new THREE.MeshStandardMaterial({
      ...materialProps, 
    });

    return new CustomShaderMaterial({
      baseMaterial,
      uniforms,
      vertexShader,
      fragmentShader,
    });
  }, [
    baseUniforms, 
    customUniforms, 
    customVertexShader, 
    customFragmentShader, 
    color,
    materialProps
  ]);

  // Create depth material for shadows with optimized dependencies
  const depthMaterial = useMemo(() => {
    const vertexShader = customVertexShader || SHADER_CONSTANTS.RIBBON_VERTEX;

    // For depth material, we only need essential uniforms
    const depthUniforms = {
      uNodeTex: { value: nodeTex },
      uTrailTex: { value: trailTex },
      uBaseWidth: { value: baseWidth },
      uNodes: { value: nodes },
      uTrails: { value: trails },
      uDebug: { value: 0 },
    };

    return new CustomShaderMaterial({
      baseMaterial: THREE.MeshDepthMaterial,
      uniforms: depthUniforms,
      vertexShader,
      depthPacking: THREE.RGBADepthPacking,
      side: THREE.DoubleSide,
    });
  }, [
    nodeTex, 
    trailTex, 
    baseWidth, 
    nodes, 
    trails, 
    customVertexShader
  ]);

  return {
    material,
    depthMaterial,
    baseUniforms,
  };
}
