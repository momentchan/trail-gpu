import * as THREE from 'three';

// Base interface for material providers
export interface MaterialProvider {
  name: string;
  createMaterial(config: any): THREE.Material;
  createDepthMaterial(config: any): THREE.Material;
  getRequiredUniforms(): Record<string, any>;
  updateUniforms(material: THREE.Material, uniforms: any): void;
}

// Configuration for standard material
export interface StandardMaterialConfig {
  nodeTex: THREE.Texture;
  trailTex: THREE.Texture;
  baseWidth: number;
  nodes: number;
  trails: number;
  color: string | THREE.Color;
  materialProps?: Partial<THREE.MeshStandardMaterialParameters>;
  customVertexShader?: string;
  customFragmentShader?: string;
  customUniforms?: { [key: string]: { value: any } };
}

// Configuration for custom shader material
export interface CustomShaderMaterialConfig extends StandardMaterialConfig {
  vertexShader: string;
  fragmentShader: string;
  uniforms: { [key: string]: { value: any } };
}

// Configuration for tube material
export interface TubeMaterialConfig extends StandardMaterialConfig {
  segments?: number;
}

// Union type for all material configs
export type MaterialConfig = StandardMaterialConfig | CustomShaderMaterialConfig | TubeMaterialConfig;
