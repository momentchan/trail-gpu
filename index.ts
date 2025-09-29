// Trail GPU System - Main Export File
// A high-performance GPU-based trail rendering system for Three.js

// React Components
export { Ribbon, ParticleDebugPoints } from './components';

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
  calcInputHeadFrag,
  calcInputWriteNodeFrag,
  calcInputAdvanceFrag,
  calcInputAdvanceTimeFrag,
  ribbonVertexShader,
  ribbonFragmentShader,
  tubeVertexShader,
  tubeFragmentShader,
  SHADER_CONSTANTS,
} from './shaders';

// Shader Packs
export { DistanceShaderPack, makeDistanceShaderPack } from './shaders/packs/distance';
export { TimeShaderPack, makeTimeShaderPack } from './shaders/packs/time';

// Examples
export { default as ParticleFlowField } from './examples/ParticleFlowField';
export { ParticleOrbital } from './examples/ParticleOrbital';
export { ParticleBasic } from './examples/ParticleBasic';
export { ParticleTimeTrail } from './examples/ParticleTimeTrail';
export { RibbonQuadDemo } from './examples/RibbonQuadDemo';
export { RibbonTubeDemo } from './examples/RibbonTubeDemo';
