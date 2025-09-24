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

    const nodesPerTrail = 60
    const trailsNum = 1
    const updateDistanceMin = 0.05

    const initialNodeTex = useMemo(() => {
        const data = new Float32Array(nodesPerTrail * 4)
        for (let i = 0; i < nodesPerTrail; i++) data[i * 4 + 3] = -1

        const tex = new THREE.DataTexture(data, nodesPerTrail, 1, THREE.RGBAFormat, THREE.FloatType)
        tex.needsUpdate = true
        tex.minFilter = tex.magFilter = THREE.NearestFilter
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
        return tex
    }, [nodesPerTrail])


    const trails = useMemo(() => {
        const trails = new GPUTrailsPass(nodesPerTrail, trailsNum, initialNodeTex, calcInputHeadFrag, calcInputWriteNodeFrag);
        trails.attachRenderer(gl);
        return trails;
    }, [nodesPerTrail, trailsNum, initialNodeTex, gl])

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
            count={trails.nodes}
            baseWidth={0.08}
        />
    </>;
}