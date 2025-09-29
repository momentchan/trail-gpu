// Trail GPU System - Main Export File
// A high-performance GPU-based trail rendering system for Three.js

// Core Classes
export { ParticleCompute } from './core/compute/ParticleCompute';

// React Components
export { Ribbon } from './Ribbon';
export { ParticleDebugPoints } from './ParticleDebugPoints';

// Geometry Providers
export { geometryProviders, QuadGeometryProvider, TubeGeometryProvider } from './geometry';
export type { GeometryProvider, QuadGeometryConfig, TubeGeometryConfig, GeometryType } from './geometry';

// Material Providers
export { materialProviders, StandardMaterialProvider, CustomShaderMaterialProvider, TubeMaterialProvider } from './materials';
export type { MaterialProvider, StandardMaterialConfig, CustomShaderMaterialConfig, TubeMaterialConfig, MaterialType } from './materials';

// Hooks
export { useTrails } from './hooks/useTrails';
export { useParticles } from './hooks/useParticles';
export { useRibbonGeometry, useRibbonMaterials } from './hooks';
export type { UseRibbonGeometryConfig, UseRibbonMaterialsConfig } from './hooks';

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
  tubeVertexShader,
  tubeFragmentShader,
  SHADER_CONSTANTS,
} from './shaders';

// Examples
export { default as FlowFieldExample } from './examples/FlowFieldExample';
export { OrbitalExample } from './examples/OrbitalExample';
export { VelPosExample } from './examples/VelPosExample';
export { RibbonQuadExample } from './examples/RibbonQuadExample';
export { RibbonTubeExample } from './examples/RibbonTubeExample';

// Re-export commonly used Three.js types for convenience
export type { Texture, WebGLRenderTarget, ShaderMaterial } from 'three';
