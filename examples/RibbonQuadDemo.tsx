import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useParticles, useTrails, Ribbon, useRibbonGeometry, useRibbonMaterials } from '../index';
import { DistanceShaderPack } from '../shaders/packs/distance';

// Custom vertex shader example
const customVertexShader = `
  precision highp float;
  
  uniform sampler2D uNodeTex;
  uniform sampler2D uTrailTex;
  uniform float uBaseWidth;
  uniform int uNodes;
  uniform int uTrails;
  uniform vec3 uCameraPos;
  uniform float uTime;
  uniform float uWaveAmplitude;
  
  attribute float aSeg;
  attribute float aSide;
  attribute float aTrail;
  
  varying float vSeg;
  varying float vTrail;
  varying float vSide;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  
  vec4 readNode(int node, int trail) {
    float u = (float(node) + 0.5) / float(uNodes);
    float v = (float(trail) + 0.5) / float(uTrails);
    return texture2D(uNodeTex, vec2(u, v));
  }
  
  ivec2 readHeadValid(int trail) {
    float v = (float(trail) + 0.5) / float(uTrails);
    vec4 trailData = texture2D(uTrailTex, vec2(0.5, v));
    int head = int(floor(trailData.x + 0.5));
    int valid = int(floor(trailData.y + 0.5));
    return ivec2(head, valid);
  }
  
  int logicalToPhysical(int i, int head, int valid, int nodes) {
    int start = (head - valid + 1 + nodes) % nodes;
    return (start + i) % nodes;
  }
  
  vec3 readPosByLogical(int i, int head, int valid, int nodes, int trail) {
    if (i < 0) i = 0;
    if (i >= valid) {
      return readNode(head, trail).xyz;
    }
    int k = logicalToPhysical(i, head, valid, nodes);
    return readNode(k, trail).xyz;
  }
  
  void main() {
    int trail = int(aTrail);
    int node = int(aSeg);
    float side = aSide;
    
    ivec2 hv = readHeadValid(trail);
    int head = hv.x;
    int valid = hv.y;
    
    vec3 p = readPosByLogical(node, head, valid, uNodes, trail);
    vec3 pPrev = readPosByLogical(node - 1, head, valid, uNodes, trail);
    vec3 pNext = readPosByLogical(node + 1, head, valid, uNodes, trail);
    
    vec3 tangent = normalize(pNext - pPrev);
    vec3 viewDir = normalize(uCameraPos - p);
    vec3 sideDir = normalize(cross(tangent, viewDir));
    
    // Add wave effect
    float wave = sin(uTime * 2.0 + float(node) * 0.5 + float(trail) * 0.1) * uWaveAmplitude;
    
    vec3 pos = p + sideDir * side * uBaseWidth * (1.0 + wave);
    
    vSeg = float(node);
    vTrail = float(trail);
    vSide = side;
    vWorldPos = pos;
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Custom fragment shader example
const customFragmentShader = `
  precision highp float;
  
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uGlowIntensity;
  uniform vec3 uGlowColor;
  
  varying float vSeg;
  varying float vTrail;
  varying float vSide;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  
  void main() {
    // Base color with trail variation
    vec3 color = uColor;
    
    // Add glow effect
    float glow = sin(uTime * 3.0 + vSeg * 0.2) * 0.5 + 0.5;
    color = mix(color, uGlowColor, glow * uGlowIntensity);
    
    // Add side variation
    float sideGlow = abs(vSide) * 0.3;
    color += sideGlow * uGlowColor;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function RibbonQuadDemo() {
    const trailNum = 100;
    const nodeNum = 50;

    const particleConfig = useMemo(() => ({
        gravity: new THREE.Vector3(0, -1, 0),
        damping: 0.02,
        maxSpeed: 5.0,
    }), []);

    // Create particle system
    const particles = useParticles({
        count: trailNum,
        config: particleConfig,
    });

    // Create trail system
    const trails = useTrails({
        nodesPerTrail: nodeNum,
        trailsNum: trailNum,
        updateDistanceMin: 0.05,
        shaderPack: DistanceShaderPack,
    });

    // Create geometry for Example 1 (Standard Quad)
    const geometry1 = useRibbonGeometry({
        geometryType: 'quad',
        geometryConfig: { nodes: nodeNum, trails: trailNum, width: 1.0 },
    });

    // Create materials for Example 1
    const materials1 = useRibbonMaterials({
        materialType: 'standard',
        materialConfig: { 
            nodeTex: trails.nodeTexture!, 
            trailTex: trails.trailTexture!, 
            baseWidth: 0.08, 
            nodes: nodeNum, 
            trails: trailNum, 
            color: '#8ec5ff' 
        },
    });

    // Create geometry for Example 2 (Explicit Quad)
    const geometry2 = useRibbonGeometry({
        geometryType: 'quad',
        geometryConfig: { nodes: nodeNum, trails: trailNum, width: 1.0 },
    });

    // Create materials for Example 2
    const materials2 = useRibbonMaterials({
        materialType: 'standard',
        materialConfig: { 
            nodeTex: trails.nodeTexture!, 
            trailTex: trails.trailTexture!, 
            baseWidth: 0.06, 
            nodes: nodeNum, 
            trails: trailNum, 
            color: '#ff6b6b' 
        },
    });

    // Create geometry for Example 3 (Custom Material Properties)
    const geometry3 = useRibbonGeometry({
        geometryType: 'quad',
        geometryConfig: { nodes: nodeNum, trails: trailNum, width: 1.0 },
    });

    // Create materials for Example 3
    const materials3 = useRibbonMaterials({
        materialType: 'standard',
        materialConfig: { 
            nodeTex: trails.nodeTexture!, 
            trailTex: trails.trailTexture!, 
            baseWidth: 0.04, 
            nodes: nodeNum, 
            trails: trailNum, 
            color: '#6bff6b',
            materialProps: {
                wireframe: true,
                transparent: true,
                opacity: 0.8,
                roughness: 0.2,
                metalness: 0.8,
            }
        },
    });

    // Create geometry for Example 4 (Custom Shader)
    const geometry4 = useRibbonGeometry({
        geometryType: 'quad',
        geometryConfig: { nodes: nodeNum, trails: trailNum, width: 1.0 },
    });

    // Create materials for Example 4 (Custom Shader)
    const materials4 = useRibbonMaterials({
        materialType: 'standard',
        materialConfig: {
            vertexShader: customVertexShader,
            fragmentShader: customFragmentShader,
            uniforms: {
                uWaveAmplitude: { value: 0.05 },
                uGlowIntensity: { value: 0.3 },
                uGlowColor: { value: new THREE.Color('#ff6b6b') },
            },
            nodeTex: trails.nodeTexture!,
            trailTex: trails.trailTexture!,
            baseWidth: 0.1,
            nodes: nodeNum,
            trails: trailNum,
            color: '#ffffff',
        },
    });

    // Update particles each frame
    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;
        particles.update(time, delta);
        trails.update(time, delta, particles.positionsTexture!);
    });

    return (
        <>
            {/* Example 1: Standard Ribbon (default behavior) */}
            {trails.nodeTexture && trails.trailTexture && materials1.material && (
                <group position={[-2, 0, 0]}>
                    <Ribbon
                        geometry={geometry1}
                        material={materials1.material}
                        depthMaterial={materials1.depthMaterial}
                        trails={trailNum}
                    />
                </group>
            )}

            {/* Example 2: Explicit Quad with different color */}
            {trails.nodeTexture && trails.trailTexture && materials2.material && (
                <group position={[0, 0, 0]}>
                    <Ribbon
                        geometry={geometry2}
                        material={materials2.material}
                        depthMaterial={materials2.depthMaterial}
                        trails={trailNum}
                    />
                </group>
            )}

            {/* Example 3: Custom Material Properties */}
            {trails.nodeTexture && trails.trailTexture && materials3.material && (
                <group position={[2, 0, 0]}>
                    <Ribbon
                        geometry={geometry3}
                        material={materials3.material}
                        depthMaterial={materials3.depthMaterial}
                        trails={trailNum}
                    />
                </group>
            )}

            {/* Example 4: Custom Shader */}
            {trails.nodeTexture && trails.trailTexture && materials4.material && (
                <group position={[4, 0, 0]}>
                    <Ribbon
                        geometry={geometry4}
                        material={materials4.material}
                        depthMaterial={materials4.depthMaterial}
                        trails={trailNum}
                    />
                </group>
            )}
        </>
    );
}
