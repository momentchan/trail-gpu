import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { ShaderPack } from '../core/spec/constants';
import { RenderTargetPool } from '../core/utils/RenderTargetPool';
import { TrailCompute } from '../core/compute/TrailCompute';

export type UseTrailSystemConfig = {
    nodesPerTrail: number;
    trailsNum: number;
    fixedLength?: boolean;
    updateDistanceMin?: number; // 便捷：給 distance 模式用
    shaderPack: ShaderPack;
};

export function useTrails(cfg: UseTrailSystemConfig) {
    const { gl } = useThree();
    const computeRef = useRef<TrailCompute | null>(null);
    const poolRef = useRef<RenderTargetPool | null>(null);

    const { nodesPerTrail, trailsNum, fixedLength, updateDistanceMin, shaderPack } = cfg;

    useEffect(() => {
        poolRef.current = new RenderTargetPool();
        computeRef.current = new TrailCompute(
            gl,
            {
                nodesPerTrail: cfg.nodesPerTrail,
                trailsNum: cfg.trailsNum,
                fixedLength: !cfg.fixedLength,
                advance: {
                    mode: 'distance',
                    distance: { minStep: cfg.updateDistanceMin ?? 0.05 }
                },
            },
            cfg.shaderPack,
            poolRef.current
        );

        return () => {
            computeRef.current?.dispose();
            poolRef.current?.dispose();
            computeRef.current = null;
            poolRef.current = null;
        };
    }, [gl, shaderPack]);


    useEffect(() => {
        const sys = computeRef.current;
        if (!sys) return;
        sys.resize(nodesPerTrail, trailsNum);
    }, [nodesPerTrail, trailsNum]);

    useEffect(() => {
        computeRef.current?.setUpdateDistanceMin(updateDistanceMin ?? 0.05);
    }, [updateDistanceMin]);


    function update(timeSec: number, deltaTime: number, inputTexture: THREE.Texture) {
        const sys = computeRef.current;
        if (!sys) return;
        sys.writeInputFromTexture(inputTexture);
        sys.step(timeSec, deltaTime);
    }

    const textures = computeRef.current?.readTextures

    const api = useMemo(() => ({
        update,
        textures,
        get nodeTexture(): THREE.Texture | null {
            return computeRef.current ? computeRef.current.readTextures.node.texture : null;
        },
        get trailTexture(): THREE.Texture | null {
            return computeRef.current ? computeRef.current.readTextures.trail.texture : null;
        },

    }), [textures]);

    return api;
}
