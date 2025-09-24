import * as THREE from 'three';

// Core configuration interfaces
export interface TrailConfig {
  nodesPerTrail: number;
  trailsNum: number;
  updateDistanceMin: number;
}

export interface ParticleConfig {
  count: number;
  speed: number;
  noiseScale: number;
  timeScale: number;
}

export interface RenderTargetConfig {
  type: THREE.TextureDataType;
  format: THREE.PixelFormat;
  minFilter: THREE.TextureFilter;
  magFilter: THREE.TextureFilter;
  wrapS: THREE.Wrapping;
  wrapT: THREE.Wrapping;
  depthBuffer: boolean;
  stencilBuffer: boolean;
}

// Data structures
export interface TrailData {
  head: number;
  valid: number;
  advance: number;
  time: number;
}

export interface NodeData {
  position: THREE.Vector3;
  time: number;
}

export interface ParticleData {
  position: THREE.Vector3;
  aux: number;
}

// Uniform interfaces
export interface TrailUniforms {
  uTrailPrev: { value: THREE.Texture | null };
  uNodePrev: { value: THREE.Texture | null };
  uInputTex: { value: THREE.Texture | null };
  uTimeSec: { value: number };
  uUpdateDistanceMin: { value: number };
  uNodes: { value: number };
  uTrails: { value: number };
}

export interface ParticleUniforms {
  uParticlesPrev: { value: THREE.Texture | null };
  uTimeSec: { value: number };
  uDeltaTime: { value: number };
  uSpeed: { value: number };
  uNoiseScale: { value: number };
  uTimeScale: { value: number };
  uParticleCount: { value: number };
}

export interface RibbonUniforms {
  uNodeTex: { value: THREE.Texture | null };
  uTrailTex: { value: THREE.Texture | null };
  uBaseWidth: { value: number };
  uNodes: { value: number };
  uTrails: { value: number };
  uCameraPos: { value: THREE.Vector3 };
  uColor: { value: THREE.Color };
  uDebug: { value: number };
}

// Component props
export interface RibbonProps {
  nodeTex: THREE.Texture;
  trailTex: THREE.Texture;
  nodes: number;
  trails: number;
  baseWidth?: number;
  color?: string;
  wireframe?: boolean;
  transparent?: boolean;
  // Custom shader props
  customVertexShader?: string;
  customFragmentShader?: string;
  customUniforms?: { [key: string]: { value: any } };
}

export interface DebugPointsProps {
  texture: THREE.DataTexture;
  count: number;
  size?: number;
  color?: string;
  headRef?: React.RefObject<number>;
  validRef?: React.RefObject<number>;
}

export interface ParticleDebugPointsProps {
  particleTexture: THREE.Texture;
  count: number;
  size?: number;
  color?: string;
}

// Error types
export class TrailGPUError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'TrailGPUError';
  }
}

// Constants
export const DEFAULT_RENDER_TARGET_CONFIG: RenderTargetConfig = {
  type: THREE.FloatType,
  format: THREE.RGBAFormat,
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
  wrapS: THREE.ClampToEdgeWrapping,
  wrapT: THREE.ClampToEdgeWrapping,
  depthBuffer: false,
  stencilBuffer: false,
};

export const DEFAULT_TRAIL_CONFIG: TrailConfig = {
  nodesPerTrail: 60,
  trailsNum: 100,
  updateDistanceMin: 0.05,
};

export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  count: 100,
  speed: 0.6,
  noiseScale: 0.8,
  timeScale: 0.3,
};
