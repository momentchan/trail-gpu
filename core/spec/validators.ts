import * as THREE from 'three';

export class TrailGPUError extends Error {
    constructor(message: string, public codes?: string) {
        super(message)
        this.name = 'TrailGPUError'
    }
}

export function validateRenderer(renderer: THREE.WebGLRenderer) {
    if (!renderer) throw new TrailGPUError('Renderer is required')
    if (!renderer.capabilities.isWebGL2) console.warn('[TrailGPU] WebGL2 is recommended. WebGL1 may be limited in format/precision.');
}


export function assertDims(tex: THREE.Texture | THREE.WebGLRenderTarget, w: number, h: number, label: string) {
    const tw = (tex as THREE.WebGLRenderTarget).width ?? (tex as any).image?.width;
    const th = (tex as THREE.WebGLRenderTarget).height ?? (tex as any).image?.height;
    if (tw !== w || th !== h) {
        throw new TrailGPUError(`[TrailGPU] ${label} expected ${w}×${h}, got ${tw}×${th}`);
    }
}

export function assertPositive(v: number, name: string) {
    if (!(v > 0)) throw new TrailGPUError(`[TrailGPU] ${name} must be > 0`);
}