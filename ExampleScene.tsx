import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTrailHistory } from "./useTrailHistory";
import { Ribbon } from "./Ribbon";
import { TrailDriver } from "./TrailDriver";
import { DebugPoints } from "./DebugPoints";
import { useUnityStyleTrails } from "./useUnityStyleTrails";

export function ExampleScene() {
    const trails = useUnityStyleTrails({ life: 1, updateDistanceMin: 0.05 })

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
        trails.stepCalcInputCPU(performance.now() * 0.001) // time(秒)
    }, -1) // -1 makes the update position ahead of rendering

    return <>
        <Ribbon
            tex={trails.nodeTex}
            N={trails.nodeNumPerTrail}
            baseWidth={0.08}
            headRef={trails.headRef}
            validRef={trails.validRef} />
        <DebugPoints
            tex={trails.nodeTex}
            N={trails.nodeNumPerTrail}
            size={0.01}
            headRef={trails.headRef}
            validRef={trails.validRef} />
    </>;
}