import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useParticles, useTrails, Ribbon, ParticleDebugPoints, useRibbonGeometry, useRibbonMaterials } from '../index';
import { DistanceShaderPack } from '../shaders/packs/distance';

// Velocity shader for flow field
const flowFieldVelocityShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositionsPrev;
uniform sampler2D uVelocitiesPrev;
uniform float uTimeSec;
uniform float uDeltaTime;
uniform float uSpeed;

varying vec2 vUv;

// 2D noise function
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 2D smooth noise
float smoothNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Flow field function
vec2 flowField(vec2 pos, float time) {
    float scale = 0.1;
    vec2 st = pos * scale;
    
    // Create a time-varying flow field
    float angle1 = smoothNoise(st + time * 0.1) * 6.28318;
    float angle2 = smoothNoise(st * 2.0 + time * 0.05) * 6.28318;
    
    // Combine multiple noise layers
    vec2 flow1 = vec2(cos(angle1), sin(angle1));
    vec2 flow2 = vec2(cos(angle2), sin(angle2));
    
    // Blend the flows
    float blend = smoothNoise(st * 0.5 + time * 0.02);
    vec2 flow = mix(flow1, flow2, blend);
    
    // Add some curl
    float curl = smoothNoise(st * 3.0 + time * 0.08) * 0.3;
    flow = vec2(-flow.y + curl, flow.x + curl);
    
    return flow;
}

void main() {
    vec2 uv = vUv;
    
    // Read previous position and velocity
    vec4 prevPos = texture2D(uPositionsPrev, uv);
    vec4 prevVel = texture2D(uVelocitiesPrev, uv);
    
    vec3 position = prevPos.xyz;
    vec3 velocity = prevVel.xyz;
    
    // Calculate flow field force at current position
    vec2 flowForce = flowField(position.xz, uTimeSec);
    
    // Apply flow field force to velocity
    velocity.xz += vec2(flowForce.x, flowForce.y) * uSpeed * uDeltaTime;
    
    // Add some damping
    velocity *= 0.98;
    
    // Limit velocity
    float speed = length(velocity);
    if (speed > 2.0) {
        velocity = normalize(velocity) * 2.0;
    }
    
    // Update position
    position += velocity * uDeltaTime;
    
    // Wrap around boundaries
    if (position.x > 5.0) position.x = -5.0;
    if (position.x < -5.0) position.x = 5.0;
    if (position.z > 5.0) position.z = -5.0;
    if (position.z < -5.0) position.z = 5.0;
    
    // Keep Y position relatively stable
    position.y = sin(position.x * 0.5) * 0.5 + cos(position.z * 0.3) * 0.3;
    
    gl_FragColor = vec4(velocity, 0.0);
}
`;

export default function ParticleFlowField() {
  // Create particle system with flow field behavior
  const trailNum = 1000;
  const nodeNum = 80;
  

  const shaderConfig = useMemo(() => ({
    velocityShader: flowFieldVelocityShader,
  }), []);

  const particleConfig = useMemo(() => ({
    gravity: new THREE.Vector3(0, 0, 0), // No gravity in flow field
    damping: 0.02,
    maxSpeed: 5.0,
  }), []);

  // Create particle system
  const particles = useParticles({
    count: trailNum,
    shaderConfig: shaderConfig,
    config: particleConfig,
  });

  // Create trail system
  const trails = useTrails({
    nodesPerTrail: nodeNum,
    trailsNum: trailNum,
    updateDistanceMin: 0.03,
    shaderPack: DistanceShaderPack,
  });

  // Create geometry
  const geometry = useRibbonGeometry({
    geometryType: 'quad',
    geometryConfig: { nodes: nodeNum, trails: trailNum, width: 1.0 },
  });

  // Create materials
  const materials = useRibbonMaterials({
    materialType: 'standard',
    materialConfig: { 
      nodeTex: trails.nodeTexture!, 
      trailTex: trails.trailTexture!, 
      baseWidth: 0.02, 
      nodes: nodeNum, 
      trails: trailNum, 
      color: '#555555' 
    },
  });

  // Update particles and trails each frame
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    particles.setUniform('uSpeed', 5.0 + Math.sin(time * 0.5) * 0.5);
    particles.update(time, delta);
    trails.update(time, delta, particles.positionsTexture!);
  });

  return (
    <>
      {trails.nodeTexture && trails.trailTexture && materials.material && (
        <Ribbon
          geometry={geometry}
          material={materials.material}
          depthMaterial={materials.depthMaterial}
          trails={trailNum}
        />
      )}
      
      {/* Debug particles */}
      <ParticleDebugPoints
        particleTexture={particles.positionsTexture!}
        count={trailNum}
        size={0.02}
        color="#ff0000"
      />
    </>
  );
}
