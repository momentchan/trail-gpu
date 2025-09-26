import * as THREE from 'three';

export class RenderTargetPool {
  private pool: THREE.WebGLRenderTarget[] = [];

  /**
   * Get an existing render target from the pool if available,
   * or create a new one if none matches.
   */
  get(width: number, height: number, options: THREE.RenderTargetOptions) {
    const idx = this.pool.findIndex(
      (rt) => rt.width === width && rt.height === height
    );
    if (idx >= 0) {
      return this.pool.splice(idx, 1)[0];
    }
    return new THREE.WebGLRenderTarget(width, height, options);
  }

  /** Return a render target to the pool for reuse. */
  release(rt: THREE.WebGLRenderTarget) {
    this.pool.push(rt);
  }

  /** Dispose all render targets and clear the pool. */
  dispose() {
    this.pool.forEach((rt) => rt.dispose());
    this.pool.length = 0;
  }
}