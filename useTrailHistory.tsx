import { useMemo, useRef } from "react";
import * as THREE from "three";


export function useTrailHistory(N = 128) {

    const data = useMemo(() => {
        return new Float32Array(N * 4);
    }, [N]);


    const tex = useMemo(() => {
        const t = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat, THREE.FloatType);
        t.needsUpdate = true;
        t.wrapS = THREE.ClampToEdgeWrapping;
        t.wrapT = THREE.ClampToEdgeWrapping;
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestFilter;
        return t;
    }, [data, N]);


    const head = useRef(0);


    function push(p: THREE.Vector3) {
        data[head.current * 4 + 0] = p.x;
        data[head.current * 4 + 1] = p.y;
        data[head.current * 4 + 2] = p.z;
        data[head.current * 4 + 3] = 1;
        head.current = (head.current + 1) % N;
        tex.needsUpdate = true;
    }

    return {
        texture: tex,
        capacity: N,
        head: head,
        push: push,
    }
}