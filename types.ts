import * as THREE from 'three';

export interface TrailConfig {
  nodesPerTrail: number;
  trailsNum: number;
  updateDistanceMin: number;
}

export interface ParticleConfig {
  count: number;
  // Physics parameters
  gravity?: THREE.Vector3;
  damping?: number;        // Velocity damping factor
  maxSpeed?: number;       // Maximum velocity magnitude
  // Integration method
  integrationMethod?: 'euler' | 'verlet' | 'rk4';
  // Initial conditions
  initialPositions?: Float32Array;
  initialVelocities?: Float32Array;
}

export interface ParticleShaderParams {
  uSpeed: number;
  uNoiseScale: number;
  uTimeScale: number;
  [key: string]: any; // Allow any additional custom uniforms
}

export interface CustomUniforms {
  [key: string]: any;
}

export interface ParticleShaderConfig {
  vertexShader?: string;
  fragmentShader?: string; // For backward compatibility
  velocityShader?: string; // For velocity pass
  positionShader?: string; // For position pass
  uniforms?: CustomUniforms;
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
  velocity: THREE.Vector3;
  aux1: number;
  aux2: number;
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
  uPositionsPrev: { value: THREE.Texture | null };
  uVelocitiesPrev: { value: THREE.Texture | null };
  uTimeSec: { value: number };
  uDeltaTime: { value: number };
  uSpeed: { value: number };
  uNoiseScale: { value: number };
  uTimeScale: { value: number };
  uParticleCount: { value: number };
  uGravity: { value: THREE.Vector3 };
  uDamping: { value: number };
  uMaxSpeed: { value: number };
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
  // Geometry configuration
  geometryType?: 'quad'; // Only quad for now, tube will be added later
  geometryConfig?: any;
  // Material configuration
  materialType?: 'standard' | 'custom-shader';
  materialConfig?: any;
  // Flexible material properties - pass any Three.js material props
  materialProps?: Partial<THREE.MeshStandardMaterialParameters>;
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
};
