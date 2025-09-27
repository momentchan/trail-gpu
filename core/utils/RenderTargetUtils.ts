import * as THREE from 'three';

/**
 * Utility functions for working with WebGL Render Targets
 */
export class RenderTargetUtils {
    /**
     * Clear a render target with a specific color
     */
    static clearRT(gl: THREE.WebGLRenderer, rt: THREE.WebGLRenderTarget, color: THREE.Color): void {
        const prev = gl.getRenderTarget();
        const prevAuto = gl.autoClear;
        gl.autoClear = true;
        gl.setRenderTarget(rt);
        gl.setClearColor(color, 0); // transparent
        gl.clearColor();
        gl.setRenderTarget(prev);
        gl.autoClear = prevAuto;
    }
}
