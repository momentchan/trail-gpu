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
    const trailsNum = 100
    const updateDistanceMin = 0.05

    const trails = useMemo(() => {
        const trails = new GPUTrailsPass(nodesPerTrail, trailsNum, calcInputHeadFrag, calcInputWriteNodeFrag);
        trails.attachRenderer(gl);
        return trails;
    }, [nodesPerTrail, trailsNum, gl])

    const particles = useMemo(() => {
        const particles = new GPUTrailParticles(trailsNum, updateParticlesFrag);
        particles.attachRenderer(gl);
        return particles;
    }, [gl, trailsNum])


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
            trails={trails.trails}
            nodes={trails.nodes}
            baseWidth={0.08}
        />
    </>;
}