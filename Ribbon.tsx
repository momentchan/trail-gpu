import * as THREE from "three";
import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";

export function Ribbon({
    NodeTex, // (x, y, z, time)
    TrailTex, // (head, valid, advance, time)
    count = 128,
    baseWidth = 0.08,
}: {
    NodeTex: THREE.Texture;
    TrailTex: THREE.Texture;
    count?: number;
    baseWidth?: number;
}) {

    const geometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        const aSeg = new Float32Array(count * 2);
        const aSide = new Float32Array(count * 2);

        for (let i = 0; i < count; i++) {
            aSeg[i * 2] = i;
            aSeg[i * 2 + 1] = i;
            aSide[i * 2] = -1;
            aSide[i * 2 + 1] = 1;
        }
        g.setAttribute("aSeg", new THREE.BufferAttribute(aSeg, 1));
        g.setAttribute("aSide", new THREE.BufferAttribute(aSide, 1));
        const indices: number[] = [];
        for (let i = 0; i < count - 1; i++) {
            const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
            indices.push(a, b, c, b, d, c);  // two triangles
        }

        g.setIndex(indices);
        return g;
    }, [count]);

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uNodeTex: { value: NodeTex },
            uTrailTex: { value: TrailTex },
            uBaseWidth: { value: baseWidth },
            uCount: { value: count },
            uCameraPos: { value: new THREE.Vector3() },
            uColor: { value: new THREE.Color('#8ec5ff') },
            uDebug: { value: 0 },
        },
        vertexShader: /*glsl*/ `
        precision highp float;
        uniform sampler2D uNodeTex;
        uniform sampler2D uTrailTex;
        uniform float uBaseWidth;
        uniform int uCount;
        uniform vec3 uCameraPos;

        attribute float aSeg;
        attribute float aSide;

        varying float vSeg;
        varying float vT;


        // 
        ivec2 readHeadValid(){
            vec4 tv = texture2D(uTrailTex, vec2(0.5));
            int head = int(floor(tv.x + 0.5));
            int valid = int(floor(tv.y + 0.5));
            return ivec2(head, valid);
        }

        // i -> k
        int logicalToPhysical(int i, int head, int valid, int count){
            // where the head is
            int start = (head - valid + 1 + count) % count;
            return (start + i) % count;
        }

        vec4 readNode(int k){
            k = clamp(k, 0, uCount-1);
            float u = (float(k) + 0.5) / float(uCount);
            return texture2D(uNodeTex, vec2(u, 0.5));
        }

        vec3 readPosByLogical(int i, int head, int valid, int count){
            if(i<0) i=0;
            if(i >= valid){
                return readNode(head).xyz;
            }
            int k = logicalToPhysical(i, head, valid, count);
            return readNode(k).xyz;
        }
        
        void main() {
            ivec2 hv = readHeadValid();
            int head = hv.x;
            int valid = hv.y;


            int i = int(aSeg);

            vec3 p = readPosByLogical(i, head, valid, uCount);
            vec3 pPrev = readPosByLogical(i-1, head, valid, uCount);
            vec3 pNext = readPosByLogical(i+1, head, valid, uCount);

            bool shortStrip = (valid < 2);

            vec3 tangent = shortStrip ? vec3(1.0, 0.0, 0.0)
                         : (i<=0) ? normalize(pNext - p)
                         : (i >= valid-1) ? normalize(p - pPrev)
                         : normalize(pNext - pPrev);

            vec3 viewDir = normalize(uCameraPos - p);
            vec3 side  = normalize(cross(tangent, viewDir));


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
    }), [NodeTex, baseWidth, count]);


    const { camera } = useThree();

    const control = useControls({
        debug: { value: 0, min: 0, max: count, step: 1 },
    })

    useFrame(() => {
        material.uniforms.uCameraPos.value.copy(camera.position);
        material.uniforms.uCount.value = NodeTex.image.width
        material.uniforms.uDebug.value = control.debug;
    });
    return <mesh frustumCulled={false} geometry={geometry} material={material} />;
}