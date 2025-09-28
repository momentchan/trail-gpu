import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useParticles, useTrails, Ribbon } from '../index';
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
      
      ivec2 hv = readHeadValid(trail);
      int head = hv.x;
      int valid = hv.y;
      
      vec3 p = readPosByLogical(node, head, valid, uNodes, trail);
      vec3 pPrev = readPosByLogical(node - 1, head, valid, uNodes, trail);
      vec3 pNext = readPosByLogical(node + 1, head, valid, uNodes, trail);
      
      vec3 tangent;
      if (valid < 2) {
          tangent = vec3(1.0, 0.0, 0.0);
      } else if (node <= 0) {
          tangent = normalize(pNext - p);
      } else if (node >= valid - 1) {
          tangent = normalize(p - pPrev);
      } else {
          tangent = normalize(pNext - pPrev);
      }
      
      vec3 viewDir = normalize(uCameraPos - p);
      vec3 side = normalize(cross(tangent, viewDir));
      
      // Add wave effect
      float t = float(node) / float(valid - 1);
      float wave = sin(t * 10.0 + uTime * 2.0) * uWaveAmplitude;
      
      float width = uBaseWidth * (1.0 + wave);
      vec3 pos = p + side * width * aSide;
      
      vSeg = float(node);
      vTrail = float(trail);
      vSide = aSide;
      vWorldPos = pos;
      vUv = uv;
      
      mat4 invModel = inverse(modelMatrix);
      mat3 invModel3 = mat3(invModel);
      
      vec3 posOS = (invModel * vec4(pos, 1.0)).xyz;
      vec3 normalOS = normalize(transpose(invModel3) * normalize(cross(side, tangent)));
      
      csm_Position = posOS;
      csm_Normal = normalOS;
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
  varying vec2 vUv;
  
  void main() {
      // Create pulsing glow effect
      float pulse = sin(uTime * 3.0 + vSeg * 0.1) * 0.5 + 0.5;
      vec3 glow = uGlowColor * pulse * uGlowIntensity;
      vec3 color = uColor + glow;
      
      csm_DiffuseColor = vec4(color, 1.0);
  }
`;

export function RibbonExample() {
    // Create particle system
    const particles = useParticles({
        count: 200,
        config: {
            gravity: new THREE.Vector3(0, -1, 0),
            damping: 0.02,
            maxSpeed: 5.0,
        },
    });

    // Create trail system
    const trails = useTrails({
        nodesPerTrail: 50,
        trailsNum: 200,
        updateDistanceMin: 0.05,
        shaderPack: DistanceShaderPack,
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
            {trails.nodeTexture && trails.trailTexture && (
                <group position={[-2, 0, 0]}>
                    <Ribbon
                        nodeTex={trails.nodeTexture}
                        trailTex={trails.trailTexture}
                        nodes={50}
                        trails={200}
                        baseWidth={0.08}
                        color="#8ec5ff"
                    />
                </group>
            )}

            {/* Example 2: Standard Ribbon with explicit geometry type */}
            {trails.nodeTexture && trails.trailTexture && (
                <group position={[0, 0, 0]}>
                    <Ribbon
                        nodeTex={trails.nodeTexture}
                        trailTex={trails.trailTexture}
                        nodes={50}
                        trails={200}
                        geometryType="quad"
                        baseWidth={0.06}
                        color="#ff6b6b"
                    />
                </group>
            )}

            {/* Example 3: Standard Ribbon with custom material properties */}
            {trails.nodeTexture && trails.trailTexture && (
                <group position={[2, 0, 0]}>
                    <Ribbon
                        nodeTex={trails.nodeTexture}
                        trailTex={trails.trailTexture}
                        nodes={50}
                        trails={200}
                        materialType="standard"
                        baseWidth={0.04}
                        color="#6bff6b"
                        materialProps={{
                            wireframe: true,
                            transparent: true,
                            opacity: 0.8,
                            roughness: 0.2,
                            metalness: 0.8,
                        }}
                    />
                </group>
            )}

            {/* Example 4: Custom Shader Ribbon */}
            {trails.nodeTexture && trails.trailTexture && (
                <group position={[0, 2, 0]}>
                    <Ribbon
                        nodeTex={trails.nodeTexture}
                        trailTex={trails.trailTexture}
                        nodes={50}
                        trails={200}
                        materialType="custom-shader"
                        materialConfig={{
                            vertexShader: customVertexShader,
                            fragmentShader: customFragmentShader,
                            uniforms: {
                                // Standard uniforms (automatically managed by Ribbon)
                                uNodeTex: { value: trails.nodeTexture },
                                uTrailTex: { value: trails.trailTexture },
                                uBaseWidth: { value: 0.1 },
                                uNodes: { value: 50 },
                                uTrails: { value: 200 },
                                uCameraPos: { value: new THREE.Vector3() },
                                uColor: { value: new THREE.Color('#ffffff') },
                                
                                // Custom uniforms
                                uTime: { value: 0 },
                                uWaveAmplitude: { value: 0.05 },
                                uGlowIntensity: { value: 0.3 },
                                uGlowColor: { value: new THREE.Color('#ff6b6b') },
                            }
                        }}
                    />
                </group>
            )}

        </>
    );
}
