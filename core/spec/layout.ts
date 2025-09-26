import * as THREE from 'three';


export const NODE_RGBA = { x: 0, y: 1, z: 2, t: 3 } as const;
export const TRAIL_RGBA = { head: 0, valid: 1, advanced: 2, time: 3 } as const;


export function clampValid(valid: number, nodes: number): number {
    return Math.max(0, Math.min(valid, nodes))
}

export function physIndex(i: number, head: number, valid: number, nodes: number): number {
    const v = clampValid(valid, nodes);
    if (v <= 0) return 0
    const oldes = (head - (v - 1) + nodes) % nodes
    return (oldes + i) % nodes
}

export function nodeUV(node: number, trail: number, nodes: number, trails: number): THREE.Vector2 {
    return new THREE.Vector2((node + 0.5) / nodes, (trail + 0.5) / trails)
}

export function trailUV(trail: number, trails: number): THREE.Vector2 {
    return new THREE.Vector2(0.5, (trail + 0.5) / trails)
}