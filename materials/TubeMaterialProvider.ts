import * as THREE from 'three';
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { MaterialProvider, StandardMaterialConfig } from './types';
import { SHADER_CONSTANTS } from '../shaders';
import { TrailGPUError } from '../types';

export const TubeMaterialProvider: MaterialProvider = {
  name: 'tube',
  
  createMaterial(config: StandardMaterialConfig): THREE.Material {
    const { nodeTex, trailTex, baseWidth, nodes, trails, color, materialProps = {} } = config;
    
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
  
  createDepthMaterial(config: StandardMaterialConfig): THREE.Material {
    const { nodeTex, trailTex, baseWidth, nodes, trails } = config;
    
    const vertexShader = SHADER_CONSTANTS.TUBE_VERTEX;

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
  },
  
  getRequiredUniforms(): Record<string, any> {
    return {
      uNodeTex: null,
      uTrailTex: null,
      uBaseWidth: 0.08,
      uNodes: 0,
      uTrails: 0,
      uCameraPos: new THREE.Vector3(),
      uColor: new THREE.Color('#8ec5ff'),
      uTime: 0,
      uDebug: 0,
    };
  },
  
  updateUniforms(material: THREE.Material, uniforms: any): void {
    if ((material as any).uniforms) {
      Object.assign((material as any).uniforms, uniforms);
    }
  }
};
