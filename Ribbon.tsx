import * as THREE from "three";
import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";

export function Ribbon({
    tex, // (time, x, y, z)
    N = 128,
    baseWidth = 0.08,
    headRef,
    validRef,
}: {
    tex: THREE.DataTexture;
    N?: number;
    baseWidth?: number;
    headRef?: React.RefObject<number>;
    validRef?: React.RefObject<number>;
}) {

    const geometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        const aSeg = new Float32Array(N * 2);
        const aSide = new Float32Array(N * 2);

        for (let i = 0; i < N; i++) {
            aSeg[i * 2] = i;
            aSeg[i * 2 + 1] = i;
            aSide[i * 2] = -1;
            aSide[i * 2 + 1] = 1;
        }

        g.setAttribute("aSeg", new THREE.BufferAttribute(aSeg, 1));
        g.setAttribute("aSide", new THREE.BufferAttribute(aSide, 1));


        const indices: number[] = [];
        for (let i = 0; i < N - 1; i++) {
            const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
            indices.push(a, b, c, b, d, c);  // two triangles
        }

        g.setIndex(indices);
        return g;
    }, [N]);

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uTex: { value: tex },
            uBaseWidth: { value: baseWidth },
            uCount: { value: N },
            uHead: { value: -1 },
            uValid: { value: 0 },
            uCameraPos: { value: new THREE.Vector3() },
            uColor: { value: new THREE.Color('#8ec5ff') },
            uDebug: { value: 0 },
        },
        vertexShader: /*glsl*/ `
        precision highp float;
        uniform sampler2D uTex;
        uniform float uBaseWidth;
        uniform int uCount;
        uniform int uHead;
        uniform int uValid;
        uniform vec3 uCameraPos;

        attribute float aSeg;
        attribute float aSide;

        varying float vSeg;
        varying float vT;


        // i -> k
        int logicalToPhysical(int i){
            // where the head is
            int start = (uHead - uValid + 1 + uCount) % uCount;
            return (start + i) % uCount;
        }

        vec4 readNode(int k){
            k = clamp(k, 0, uCount-1);
            float u = (float(k) + 0.5) / float(uCount);
            return texture2D(uTex, vec2(u, 0.5));
        }

        vec3 readPosByLogical(int i){
            if(i<0) i=0;
            if(i >= uValid){
                return readNode(uHead).xyz;
            }
            int k = logicalToPhysical(i);
            return readNode(k).xyz;
        }
        
        void main() {
            int i = int(aSeg);

            vec3 p = readPosByLogical(i);
            vec3 pPrev = readPosByLogical(i-1);
            vec3 pNext = readPosByLogical(i+1);

            bool shortStrip = (uValid < 2);

            vec3 tangent = shortStrip ? vec3(1.0, 0.0, 0.0)
                         : (i<=0) ? normalize(pNext - p)
                         : (i >= uCount-1) ? normalize(p - pPrev)
                         : normalize(pNext - pPrev);

            vec3 viewDir = normalize(uCameraPos - p);
            vec3 side  = normalize(cross(tangent, viewDir));
            // side = normalize(cross(vec3(.0, 1.0,0.),tangent));

            float t = float(i) / float(uCount-1);

            float width = uBaseWidth;
            vec3 pos = p + side * width * aSide;

            vSeg = float(i);

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
        `,
        fragmentShader: /*glsl*/ `
        precision highp float;
        uniform vec3 uColor;
        uniform int uDebug;
        varying float vSeg;
        
        void main() {
            int i = int(vSeg);


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
        material.uniforms.uCameraPos.value.copy(camera.position);
        material.uniforms.uCount.value = tex.image.width
        material.uniforms.uDebug.value = control.debug;
        material.uniforms.uValid.value = validRef?.current ?? 0;
        material.uniforms.uHead.value = headRef?.current ?? 0;
    });
    return <mesh frustumCulled={false} geometry={geometry} material={material} />;
}