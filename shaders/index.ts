// Shader imports and exports
// This file centralizes all shader imports for easier management

import updateParticlesFrag from './UpdateParticles.glsl?raw';
import calcInputHeadFrag from './CalcInputHead.glsl?raw';
import calcInputWriteNodeFrag from './CalcInputWriteNode.glsl?raw';
import ribbonVertexShader from './RibbonVertex.glsl?raw';
import ribbonFragmentShader from './RibbonFragment.glsl?raw';

export {
  updateParticlesFrag,
  calcInputHeadFrag,
  calcInputWriteNodeFrag,
  ribbonVertexShader,
  ribbonFragmentShader,
};

// Shader constants
export const SHADER_CONSTANTS = {
  FULLSCREEN_VERTEX: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  
  RIBBON_VERTEX: ribbonVertexShader,
  RIBBON_FRAGMENT: ribbonFragmentShader,
} as const;
