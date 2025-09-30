import * as THREE from 'three';

// Base interface for material providers
export interface MaterialProvider {
  name: string;
  createMaterial(config: any): THREE.Material;
  createDepthMaterial(config: any): THREE.Material;
  updateUniforms(material: THREE.Material, uniforms: any): void;
}

// Configuration for material (handles both standard and custom shaders)
export interface MaterialConfig {
  nodeTex: THREE.Texture;
  trailTex: THREE.Texture;
  baseWidth: number;
  nodes: number;
  trails: number;
  color: string | THREE.Color;
  materialProps?: Partial<THREE.MeshStandardMaterialParameters>;
  // Custom shader properties (optional - uses defaults if not provided)
  vertexShader?: string;
  fragmentShader?: string;
  uniforms?: { [key: string]: { value: any } };
}

// Configuration for tube material
export interface TubeMaterialConfig extends MaterialConfig {
  segments?: number;
}
