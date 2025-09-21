import * as THREE from "three";
import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";

export function Ribbon({
    tex,
    N = 128,
    baseWidth = 0.08
}: {
    tex: THREE.DataTexture;
    N?: number;
    baseWidth?: number;
}) {

    const gemo = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const idx = new Float32Array(N * 2);
        const side = new Float32Array(N * 2);

        for (let i = 0; i < N; i++) {
            idx[i * 2] = i;
            idx[i * 2 + 1] = i;
            side[i * 2] = -1;
            side[i * 2 + 1] = 1;
        }

        geometry.setAttribute("aSeg", new THREE.BufferAttribute(idx, 1));
        geometry.setAttribute("aSide", new THREE.BufferAttribute(side, 1));


        const indices: number[] = [];
        for (let i = 0; i < N - 1; i++) {
            const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
            indices.push(a, b, c, b, d, c);  // two triangles
        }

        geometry.setIndex(indices);

        return geometry;
    }, [N]);

    const mat = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uTex: { value: tex },
            uBaseWidth: { value: baseWidth },
            uCount: { value: N },
            uColor: { value: new THREE.Color('#8ec5ff') },
            uCameraPos: { value: new THREE.Vector3() },
            uHead: { value: 0 },
            uDebug: { value: 0 }
        },
        vertexShader: /*glsl*/ `
        precision highp float;
        uniform sampler2D uTex;
        uniform float uBaseWidth;
        uniform int uCount;
        uniform vec3 uCameraPos;

        attribute float aSeg;
        attribute float aSide;
        varying float vT;
        varying float vSeg;

        vec3 readPosition(int k){
            k = clamp(k, 0, uCount-1);
            float u = (float(k)+0.5)/float(uCount);
            vec4 px = texture2D(uTex, vec2(u, 0.5));
            return px.xyz;
        }
        
        void main() {
            int i = int(aSeg);
            vec3 p = readPosition(i);

            vec3 pPrev = readPosition(i-1);
            vec3 pNext = readPosition(i+1);

            vec3 tangent = (i == 0) ? normalize(pNext - p)
                         : (i == uCount-1) ? normalize(p - pPrev)
                         : normalize(pNext - pPrev);

            vec3 viewDir = normalize(uCameraPos - p);
            vec3 side  = normalize(cross(tangent, viewDir));
            // side = normalize(cross(vec3(.0, 1.0,0.),tangent));

            float t = float(i) / float(uCount-1);

            float width = uBaseWidth;// * (1.0 - t);


            vec3 pos = p + side * width * aSide;


            vT = t;

            vSeg = aSeg;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
        `,
        fragmentShader: /*glsl*/ `
        precision highp float;
        uniform sampler2D uTex;
        uniform vec3 uColor;
        uniform int uDebug;
        varying float vT;
        varying float vSeg;
        
        void main() {
            int i = int(vSeg);

            float alpha = smoothstep(1.0, 0.0, vT);

            float s = i == uDebug? 1.0 : 0.0;

            vec3 c = mix(uColor, vec3(1.0, 0.0, 0.0), s);
            gl_FragColor = vec4(c, 1.0);
        }
        `,
        transparent: true,
        wireframe: true,
        depthWrite: false,
        // side: THREE.DoubleSide,

    }), [tex, baseWidth, N]);


    const { camera } = useThree();

    const control = useControls({
        debug: { value: 0, min: 0, max: N, step: 1 },
    })

    useFrame(() => {
        mat.uniforms.uCameraPos.value.copy(camera.position);
        mat.uniforms.uDebug.value = control.debug;
    });
    return <mesh frustumCulled={false} geometry={gemo} material={mat} />;
}