// trail-gpu/shaders/packs/time.ts
import { ShaderPack } from '../../core/spec/constants';

import fullscreenVS from '../FullscreenVS.glsl?raw';
import calcInputAdvanceTimeFrag from '../CalcInputAdvanceTime.glsl?raw';
import calcInputHeadFrag from '../CalcInputHead.glsl?raw';
import calcInputWriteNodeFrag from '../CalcInputWriteNode.glsl?raw';

/**
 * Fixed combination: ShaderPack for time-based trails
 * - advance: CalcInputAdvanceTime.glsl outputs a 1×M advance mask based on time intervals
 * - head:    CalcInputHead.glsl applies head/valid state transitions
 * - write:   CalcInputWriteNode.glsl writes input into the head slot
 */
export const TimeShaderPack: ShaderPack = {
    advance: { vertex: fullscreenVS, fragment: calcInputAdvanceTimeFrag },
    head: { vertex: fullscreenVS, fragment: calcInputHeadFrag },
    write: { vertex: fullscreenVS, fragment: calcInputWriteNodeFrag },
};

/**
 * Factory function for time-based shader pack
 * e.g. makeTimeShaderPack({ USE_JITTER: 1 })
 */
export function makeTimeShaderPack(): ShaderPack {
    return TimeShaderPack;
}
