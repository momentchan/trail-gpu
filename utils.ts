import * as THREE from 'three';
import { RenderTargetConfig, DEFAULT_RENDER_TARGET_CONFIG, TrailGPUError } from './types';

/**
 * Creates a render target with the specified configuration
 */
export function createRenderTarget(
  width: number,
  height: number,
  config: Partial<RenderTargetConfig> = {}
): THREE.WebGLRenderTarget {
  const finalConfig = { ...DEFAULT_RENDER_TARGET_CONFIG, ...config };
  
  return new THREE.WebGLRenderTarget(width, height, {
    type: finalConfig.type,
    format: finalConfig.format,
    minFilter: finalConfig.minFilter,
    magFilter: finalConfig.magFilter as THREE.MagnificationTextureFilter,
    wrapS: finalConfig.wrapS,
    wrapT: finalConfig.wrapT,
    depthBuffer: finalConfig.depthBuffer,
    stencilBuffer: finalConfig.stencilBuffer,
  });
}

/**
 * Creates a data texture with the specified data and configuration
 */
export function createDataTexture(
  data: Float32Array,
  width: number,
  height: number,
  format: THREE.PixelFormat = THREE.RGBAFormat,
  type: THREE.TextureDataType = THREE.FloatType
): THREE.DataTexture {
  const texture = new THREE.DataTexture(data, width, height, format, type);
  texture.needsUpdate = true;
  texture.minFilter = texture.magFilter = THREE.NearestFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Blits a source texture to a render target
 */
export function blitTexture(
  renderer: THREE.WebGLRenderer,
  sourceTexture: THREE.Texture,
  targetRenderTarget: THREE.WebGLRenderTarget
): void {
  if (!renderer) {
    throw new TrailGPUError('Renderer is required for blitting');
  }

  const oldRenderTarget = renderer.getRenderTarget();
  
  // Create temporary geometry and material for blitting
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({ map: sourceTexture })
  );
  
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(quad);

  // Perform the blit
  renderer.setRenderTarget(targetRenderTarget);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(oldRenderTarget);

  // Cleanup
  (quad.material as THREE.MeshBasicMaterial).map?.dispose();
  quad.material.dispose();
  quad.geometry.dispose();
}

/**
 * Generates random particle positions
 */
export function generateRandomParticlePositions(
  count: number,
  scale: number = 2
): Float32Array {
  const data = new Float32Array(count * 4);
  
  for (let i = 0; i < count; i++) {
    data[i * 4] = (Math.random() - 0.5) * scale;     // x
    data[i * 4 + 1] = (Math.random() - 0.5) * scale; // y
    data[i * 4 + 2] = (Math.random() - 0.5) * scale; // z
    data[i * 4 + 3] = 1;                             // aux
  }
  
  return data;
}

/**
 * Generates initial trail data
 */
export function generateInitialTrailData(trailsNum: number): Float32Array {
  const data = new Float32Array(trailsNum * 4);
  
  for (let i = 0; i < trailsNum; i++) {
    data[i * 4] = -1;     // head (invalid)
    data[i * 4 + 1] = 0;  // valid
    data[i * 4 + 2] = 0;  // advance
    data[i * 4 + 3] = 0;  // time
  }
  
  return data;
}

/**
 * Generates initial node data
 */
export function generateInitialNodeData(
  nodesPerTrail: number,
  trailsNum: number
): Float32Array {
  const data = new Float32Array(nodesPerTrail * trailsNum * 4);
  
  for (let t = 0; t < trailsNum; t++) {
    for (let n = 0; n < nodesPerTrail; n++) {
      const index = (t * nodesPerTrail + n) * 4;
      data[index] = 0;     // x
      data[index + 1] = 0; // y
      data[index + 2] = 0; // z
      data[index + 3] = -1; // time (invalid)
    }
  }
  
  return data;
}

/**
 * Creates a standard vertex shader for fullscreen quads
 */
export const FULLSCREEN_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Creates a standard scene setup for GPU computation
 */
export function createComputationScene(): {
  scene: THREE.Scene;
  quad: THREE.Mesh;
  camera: THREE.OrthographicCamera;
} {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  scene.add(quad);
  
  return { scene, quad, camera };
}

/**
 * Safely disposes of a render target and its texture
 */
export function disposeRenderTarget(renderTarget: THREE.WebGLRenderTarget): void {
  renderTarget.texture.dispose();
  renderTarget.dispose();
}

/**
 * Safely disposes of multiple render targets
 */
export function disposeRenderTargets(renderTargets: THREE.WebGLRenderTarget[]): void {
  renderTargets.forEach(disposeRenderTarget);
}

/**
 * Validates that a renderer is available and WebGL2 compatible
 */
export function validateRenderer(renderer: THREE.WebGLRenderer): void {
  if (!renderer) {
    throw new TrailGPUError('Renderer is required');
  }
  
  if (!renderer.capabilities.isWebGL2) {
    console.warn('WebGL2 is recommended for optimal performance');
  }
}

/**
 * Creates UV coordinates for texture sampling
 */
export function createUVCoordinates(index: number, total: number): { u: number; v: number } {
  return {
    u: (index + 0.5) / total,
    v: (index + 0.5) / total,
  };
}

/**
 * Creates 2D UV coordinates for texture sampling
 */
export function createUV2D(x: number, y: number, width: number, height: number): { u: number; v: number } {
  return {
    u: (x + 0.5) / width,
    v: (y + 0.5) / height,
  };
}
