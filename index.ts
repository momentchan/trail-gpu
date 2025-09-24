// Trail GPU System - Main Export File
// A high-performance GPU-based trail rendering system for Three.js

// Core Classes
export { GPUTrailParticles } from './GPUTrailParticles';
export { GPUTrailsPass } from './GPUTrailsPass';

// React Components
export { Ribbon } from './Ribbon';
export { DebugPoints } from './DebugPoints';
export { ParticleDebugPoints } from './ParticleDebugPoints';

// Hooks
export { useTrailSystem, useTrailSystemWithFrame } from './hooks/useTrailSystem';

// Example Scenes
export { ExampleScene, ManualExampleScene } from './ExampleScene';

// Types and Interfaces
export type {
  TrailConfig,
  ParticleConfig,
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
  updateParticlesFrag,
  calcInputHeadFrag,
  calcInputWriteNodeFrag,
  ribbonVertexShader,
  ribbonFragmentShader,
  SHADER_CONSTANTS,
} from './shaders';

// Re-export commonly used Three.js types for convenience
export type { Texture, WebGLRenderTarget, ShaderMaterial } from 'three';
