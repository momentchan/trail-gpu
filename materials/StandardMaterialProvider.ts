import * as THREE from 'three';
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { MaterialProvider, MaterialConfig } from './types';
import { SHADER_CONSTANTS } from '../shaders';
import { TrailGPUError } from '../types';

export const StandardMaterialProvider: MaterialProvider = {
  name: 'standard',
  
  createMaterial(config: MaterialConfig): THREE.Material {
    const { nodeTex, trailTex, baseWidth, nodes, trails, color, materialProps = {}, vertexShader: customVertexShader, fragmentShader: customFragmentShader, uniforms: customUniforms = {} } = config;
    
    // Validate inputs
    if (!nodeTex || !trailTex) {
      throw new TrailGPUError('StandardMaterialProvider: nodeTex and trailTex are required');
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

    // Merge base uniforms with custom uniforms
    const uniforms = {
      ...baseUniforms,
      ...customUniforms,
    };

    // Use custom shaders or fallback to defaults
    const vertexShader = customVertexShader || SHADER_CONSTANTS.RIBBON_VERTEX;
    const fragmentShader = customFragmentShader || SHADER_CONSTANTS.RIBBON_FRAGMENT;

    // Create base material
    const baseMaterial = new THREE.MeshStandardMaterial({
      ...materialProps, 
    });

    return new CustomShaderMaterial({
      baseMaterial,
      uniforms,
      vertexShader,
      fragmentShader,
    });
  },
  
  createDepthMaterial(config: MaterialConfig): THREE.Material {
    const { nodeTex, trailTex, baseWidth, nodes, trails, vertexShader: customVertexShader } = config;
    
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
  },
  
  
  updateUniforms(material: THREE.Material, uniforms: any): void {
    if ((material as any).uniforms) {
      Object.assign((material as any).uniforms, uniforms);
    }
  }
};
