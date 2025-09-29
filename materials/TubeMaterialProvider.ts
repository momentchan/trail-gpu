import * as THREE from 'three';
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { MaterialProvider, TubeMaterialConfig } from './types';
import { SHADER_CONSTANTS } from '../shaders';
import { TrailGPUError } from '../types';

export const TubeMaterialProvider: MaterialProvider = {
  name: 'tube',
  
  createMaterial(config: TubeMaterialConfig): THREE.Material {
    const { nodeTex, trailTex, baseWidth, nodes, trails, color, materialProps = {}, segments = 8 } = config;
    
    // Validate inputs
    if (!nodeTex || !trailTex) {
      throw new TrailGPUError('TubeMaterialProvider: nodeTex and trailTex are required');
    }
    
    // Create base uniforms
    const baseUniforms = {
      uNodeTex: { value: nodeTex },
      uTrailTex: { value: trailTex },
      uBaseWidth: { value: baseWidth },
      uNodes: { value: nodes },
      uTrails: { value: trails },
      uSegments: { value: segments },
      uCameraPos: { value: new THREE.Vector3() },
      uColor: { value: typeof color === 'string' ? new THREE.Color(color) : color },
      uTime: { value: 0 },
      uDebug: { value: 0 },
    };

    // Use tube shaders
    const vertexShader = SHADER_CONSTANTS.TUBE_VERTEX;
    const fragmentShader = SHADER_CONSTANTS.TUBE_FRAGMENT;

    // Create base material
    const baseMaterial = new THREE.MeshStandardMaterial({
      ...materialProps, 
    });

    return new CustomShaderMaterial({
      baseMaterial,
      uniforms: baseUniforms,
      vertexShader,
      fragmentShader,
    });
  },
  
  createDepthMaterial(config: TubeMaterialConfig): THREE.Material {
    const { nodeTex, trailTex, baseWidth, nodes, trails, segments = 8 } = config;
    
    const vertexShader = SHADER_CONSTANTS.TUBE_VERTEX;

    // For depth material, we only need essential uniforms
    const depthUniforms = {
      uNodeTex: { value: nodeTex },
      uTrailTex: { value: trailTex },
      uBaseWidth: { value: baseWidth },
      uNodes: { value: nodes },
      uTrails: { value: trails },
      uSegments: { value: segments },
      uDebug: { value: 0 },
    };

    return new CustomShaderMaterial({
      baseMaterial: THREE.MeshDepthMaterial,
      uniforms: depthUniforms,
      vertexShader,
      depthPacking: THREE.RGBADepthPacking,
      side: THREE.DoubleSide,
    });
  },
  
  
  updateUniforms(material: THREE.Material, uniforms: any): void {
    if ((material as any).uniforms) {
      Object.assign((material as any).uniforms, uniforms);
    }
  }
};
