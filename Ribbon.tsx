import * as THREE from "three";
import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";

export function Ribbon({
    NodeTex, // (x, y, z, time)
    TrailTex, // (head, valid, advance, time)
    nodes,
    trails,
    baseWidth = 0.08,
}: {
    NodeTex: THREE.Texture;
    TrailTex: THREE.Texture;
    nodes: number;
    trails: number;
    baseWidth?: number;
}) {

    const geometry = useMemo(() => {
        const g = new THREE.InstancedBufferGeometry();



        const aSeg = new Float32Array(nodes * 2);
        const aSide = new Float32Array(nodes * 2);

        for (let i = 0; i < nodes; i++) {
            aSeg[i * 2] = i;
            aSeg[i * 2 + 1] = i;
            aSide[i * 2] = -1;
            aSide[i * 2 + 1] = 1;
        }
        g.setAttribute("aSeg", new THREE.BufferAttribute(aSeg, 1));
        g.setAttribute("aSide", new THREE.BufferAttribute(aSide, 1));
        const indices: number[] = [];
        for (let i = 0; i < nodes - 1; i++) {
            const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
            indices.push(a, b, c, b, d, c);  // two triangles
        }
        g.setIndex(indices);

        // instance
        const aTrail = new Float32Array(trails);
        for (let t = 0; t < trails; t++) aTrail[t] = t;
        g.setAttribute("aTrail", new THREE.InstancedBufferAttribute(aTrail, 1));

        g.instanceCount = trails;

        // Avoid NaN bounding sphere warnings in dev; give a large bound and disable culling.
        g.computeBoundingSphere = () => {
            g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
        };

        return g;
    }, [nodes, trails]);

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uNodeTex: { value: NodeTex },
            uTrailTex: { value: TrailTex },
            uBaseWidth: { value: baseWidth },
            uNodes: { value: nodes },
            uTrails: { value: trails },
            uCameraPos: { value: new THREE.Vector3() },
            uColor: { value: new THREE.Color('#8ec5ff') },
            uDebug: { value: 0 },
        },
        vertexShader: /*glsl*/ `
        precision highp float;
        uniform sampler2D uNodeTex;
        uniform sampler2D uTrailTex;
        uniform float uBaseWidth;
        uniform int uNodes;
        uniform int uTrails;
        uniform vec3 uCameraPos;

        attribute float aSeg;    // [0...nodes-1]
        attribute float aSide;   // [-1, 1]
        attribute float aTrail;  // [0...trails-1]

        varying float vSeg;
        varying float vT;


        //
        
        vec4 readNode(int node, int trail){
            float u = (float(node) + 0.5) / float(uNodes);
            float v = (float(trail) + 0.5) / float(uTrails);
            return texture2D(uNodeTex, vec2(u, v));
        }


        ivec2 readHeadValid(int trail){
            float v = (float(trail) + 0.5) / float(uTrails);
            vec4 tv = texture2D(uTrailTex, vec2(0.5, v));
            int head = int(floor(tv.x + 0.5));
            int valid = int(floor(tv.y + 0.5));
            return ivec2(head, valid);
        }

        // i -> k
        int logicalToPhysical(int i, int head, int valid, int nodes){
            // where the head is
            int start = (head - valid + 1 + nodes) % nodes;
            return (start + i) % nodes;
        }

        vec3 readPosByLogical(int i, int head, int valid, int nodes, int trail){
            if(i<0) i=0;
            if(i >= valid){
                return readNode(head, trail).xyz;
            }
            int k = logicalToPhysical(i, head, valid, nodes);
            return readNode(k, trail).xyz;
        }
        
        void main() {
            int trail = int(aTrail);
            int node = int(aSeg);

            ivec2 hv = readHeadValid(trail);
            int head = hv.x;
            int valid = hv.y;

            vec3 p = readPosByLogical(node, head, valid, uNodes, trail);
            vec3 pPrev = readPosByLogical(node-1, head, valid, uNodes, trail);
            vec3 pNext = readPosByLogical(node+1, head, valid, uNodes, trail);

            bool shortStrip = (valid < 2);

            vec3 tangent = shortStrip ? vec3(1.0, 0.0, 0.0)
                         : (node<=0) ? normalize(pNext - p)
                         : (node >= valid-1) ? normalize(p - pPrev)
                         : normalize(pNext - pPrev);

            vec3 viewDir = normalize(uCameraPos - p);
            vec3 side  = normalize(cross(tangent, viewDir));


            float width = uBaseWidth;
            vec3 pos = p + side * width * aSide;

            vSeg = float(node);

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
    }), [NodeTex, baseWidth, nodes]);


    const { camera } = useThree();

    const control = useControls({
        debug: { value: 0, min: 0, max: nodes, step: 1 },
    })

    useFrame(() => {
        material.uniforms.uCameraPos.value.copy(camera.position);
        material.uniforms.uNodes.value = nodes
        material.uniforms.uTrails.value = trails
        material.uniforms.uDebug.value = control.debug;
    });
    return <mesh frustumCulled={false} geometry={geometry} material={material} />;
}