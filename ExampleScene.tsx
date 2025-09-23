import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Ribbon } from "./Ribbon";
import { GPUTrailsPass } from "./GPUTrailsPass";
import calcInputHeadFrag from "./CalcInputHead.glsl?raw";
import calcInputWriteNodeFrag from "./CalcInputWriteNode.glsl?raw";

export function ExampleScene() {
    const { gl } = useThree()

    const count = 60
    const updateDistanceMin = 0.05

    const initialNodeTex = useMemo(() => {
        const data = new Float32Array(count * 4)
        for (let i = 0; i < count; i++) data[i * 4 + 3] = -1

        const tex = new THREE.DataTexture(data, count, 1, THREE.RGBAFormat, THREE.FloatType)
        tex.needsUpdate = true
        tex.minFilter = tex.magFilter = THREE.NearestFilter
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
        return tex
    }, [count])


    const trails = useMemo(() => new GPUTrailsPass(count, initialNodeTex, calcInputHeadFrag, calcInputWriteNodeFrag),
        [count, initialNodeTex])


    useEffect(() => trails.attachRenderer(gl), [gl, trails]);

    const t = useRef(0)
    useFrame((_, dt) => {
        t.current += dt * 1.0
        const R = 1.2
        const p = new THREE.Vector3(
            Math.cos(t.current) * R,
            0.0,
            Math.sin(t.current * 0.7) * 0.6
        )
        trails.writeInput(p)
        trails.stepCalcInput(gl, performance.now() * 0.001, updateDistanceMin) // time(秒)
    }, -1) // -1 makes the update position ahead of rendering

    return <>
        <Ribbon
            NodeTex={trails.NodeTex}
            TrailTex={trails.TrailTex}
            count={trails.count}
            baseWidth={0.08}
        />
    </>;
}