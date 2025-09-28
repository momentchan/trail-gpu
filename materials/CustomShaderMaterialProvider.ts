import * as THREE from 'three';
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { MaterialProvider, CustomShaderMaterialConfig } from './types';
import { TrailGPUError } from '../types';

export const CustomShaderMaterialProvider: MaterialProvider = {
  name: 'custom-shader',
  
  createMaterial(config: CustomShaderMaterialConfig): THREE.Material {
    const { vertexShader, fragmentShader, uniforms, materialProps = {} } = config;
    
    // Validate inputs
    if (!vertexShader || !fragmentShader || !uniforms) {
      throw new TrailGPUError('CustomShaderMaterialProvider: vertexShader, fragmentShader, and uniforms are required');
    }
    
    // Create base material with your custom properties
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
  
  createDepthMaterial(config: CustomShaderMaterialConfig): THREE.Material {
    const { vertexShader, uniforms } = config;
    
    // For depth material, only use essential uniforms
    const depthUniforms = Object.keys(uniforms).reduce((acc, key) => {
      // Only include uniforms that are needed for depth rendering
      if (key.startsWith('uNodeTex') || key.startsWith('uTrailTex') || key.startsWith('uBaseWidth') || 
          key.startsWith('uNodes') || key.startsWith('uTrails')) {
        acc[key] = uniforms[key];
      }
      return acc;
    }, {} as Record<string, any>);

    return new CustomShaderMaterial({
      baseMaterial: THREE.MeshDepthMaterial,
      uniforms: depthUniforms,
      vertexShader,
      depthPacking: THREE.RGBADepthPacking,
      side: THREE.DoubleSide,
    });
  },
  
  getRequiredUniforms(): Record<string, any> {
    return {};
  },
  
  updateUniforms(material: THREE.Material, uniforms: any): void {
    if ((material as any).uniforms) {
      Object.assign((material as any).uniforms, uniforms);
    }
  }
};
