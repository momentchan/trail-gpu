// Trail GPU System - Main Export File
// A high-performance GPU-based trail rendering system for Three.js

// Core Classes
export { ParticleCompute } from './core/compute/ParticleCompute';

// React Components
export { Ribbon } from './Ribbon';
export { ParticleDebugPoints } from './ParticleDebugPoints';

// Hooks
export { useTrails } from './hooks/useTrails';
export { useParticles } from './hooks/useParticles';

// Types and Interfaces
export type {
  TrailConfig,
  ParticleConfig,
  ParticleShaderConfig,
  CustomUniforms,
  RenderTargetConfig,
  TrailData,
  NodeData,
  ParticleData,
  TrailUniforms,
  ParticleUniforms,
  RibbonUniforms,
  RibbonProps,
  DebugPointsProps,
  ParticleDebugPointsProps,
} from './types';

export { TrailGPUError } from './types';

// Constants
export {
  DEFAULT_RENDER_TARGET_CONFIG,
  DEFAULT_TRAIL_CONFIG,
  DEFAULT_PARTICLE_CONFIG,
} from './types';

// Utilities
export {
  createRenderTarget,
  createDataTexture,
  blitTexture,
  generateRandomParticlePositions,
  generateInitialTrailData,
  generateInitialNodeData,
  createComputationScene,
  disposeRenderTarget,
  disposeRenderTargets,
  validateRenderer,
  createUVCoordinates,
  createUV2D,
} from './utils';

// Shaders
export {
  velPosTemplateFrag,
  calcInputHeadFrag,
  calcInputWriteNodeFrag,
  ribbonVertexShader,
  ribbonFragmentShader,
  SHADER_CONSTANTS,
} from './shaders';

// Examples
export { default as FlowFieldExample } from './examples/FlowFieldExample';
export { OrbitalExample } from './examples/OrbitalExample';
export { VelPosExample } from './examples/VelPosExample';

// Re-export commonly used Three.js types for convenience
export type { Texture, WebGLRenderTarget, ShaderMaterial } from 'three';
