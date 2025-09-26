// trail-gpu/shaders/packs/distance.ts
import { ShaderPack } from '../../core/spec/constants';

import fullscreenVS from '../FullscreenVS.glsl?raw';
import calcInputAdvanceFrag from '../CalcInputAdvance.glsl?raw';
import calcInputHeadFrag from '../CalcInputHead.glsl?raw';
import calcInputWriteNodeFrag from '../CalcInputWriteNode.glsl?raw';

/**
/**
 * Fixed combination: ShaderPack for distance-based trails
 * - advance: CalcInputAdvance.glsl outputs a 1×M advance mask
 * - head:    CalcInputHead.glsl applies head/valid state transitions
 * - write:   CalcInputWriteNode.glsl writes input into the head slot
 */
export const DistanceShaderPack: ShaderPack = {
    advance: { vertex: fullscreenVS, fragment: calcInputAdvanceFrag },
    head: { vertex: fullscreenVS, fragment: calcInputHeadFrag },
    write: { vertex: fullscreenVS, fragment: calcInputWriteNodeFrag },
};

/**
 * If you need to inject #define or replace include in the future, you can use the factory function
 * e.g. makeDistanceShaderPack({ USE_JITTER: 1 })
 */
export function makeDistanceShaderPack(): ShaderPack {
    return DistanceShaderPack;
}
