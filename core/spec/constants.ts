import * as THREE from 'three';

export type AdvanceMode = 'distance' | 'time' | 'external';

export interface AdvanceConfig {
    mode: AdvanceMode;
    distance?: { minStep: number }
    time?: { stepSec: number }
    external?: { texture: THREE.Texture }
}

export interface TrailConfig {
    nodesPerTrail: number;
    trailsNum: number;
    fixedLength?: boolean;     // true: valid always equals nodes
    advance: AdvanceConfig;
}

export interface ShaderDef {
    vertex: string;
    fragment: string;
}

export interface ShaderPack {
    advance: ShaderDef;
    head: ShaderDef;
    write: ShaderDef;
}

export function makeRTParams(): THREE.RenderTargetOptions {
    return {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        depthBuffer: false,
        stencilBuffer: false,
    }
}
