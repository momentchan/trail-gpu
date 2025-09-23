import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Ribbon } from "./Ribbon";
import { GPUTrailsPass } from "./GPUTrailsPass";
import calcInputHeadFrag from "./CalcInputHead.glsl?raw";
import calcInputWriteNodeFrag from "./CalcInputWriteNode.glsl?raw";
import { GPUTrailParticles } from "./GPUTrailParticles";
import updateParticlesFrag from "./UpdateParticles.glsl?raw";

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


    const trails = useMemo(() => {
        const trails = new GPUTrailsPass(count, initialNodeTex, calcInputHeadFrag, calcInputWriteNodeFrag);
        trails.attachRenderer(gl);
        return trails;
    }, [count, initialNodeTex, gl])

    const particles = useMemo(() => {
        const particles = new GPUTrailParticles(1, updateParticlesFrag);
        particles.attachRenderer(gl);
        return particles;
    }, [gl])


    const t = useRef(0)
    useFrame((state, dt) => {
        const timeSec = state.clock.getElapsedTime()
        particles.stepUpdate(gl, timeSec, dt)
        trails.writeInputFromTex(particles.ParticlesTex)
        trails.stepCalcInput(gl, timeSec, updateDistanceMin)
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