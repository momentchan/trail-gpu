import * as THREE from 'three';

// Base interface for geometry providers
export interface GeometryProvider {
  name: string;
  createGeometry(config: any): THREE.InstancedBufferGeometry;
}

// Configuration for quad geometry
export interface QuadGeometryConfig {
  nodes: number;
  trails: number;
  width?: number;
}

// Configuration for tube geometry (for future use)
export interface TubeGeometryConfig {
  nodes: number;
  trails: number;
  segments?: number;
  radius?: number;
  capStart?: boolean;
  capEnd?: boolean;
}

// Union type for all geometry configs
export type GeometryConfig = QuadGeometryConfig | TubeGeometryConfig;
