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
uniform float uParticleCount; 

// Default physics uniforms
uniform vec3 uGravity;
uniform float uDamping;
uniform float uMaxSpeed;

// Flow field parameters
uniform float uSpeed;
uniform float uNoiseScale;
uniform float uTimeScale;

varying vec2 vUv;

int pixelIndex() {
    float y = vUv.y * float(uParticleCount);
    return int(floor(y));
}

vec4 readParticlePos(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uPositionsPrev, vec2(0.5, v));
}

vec4 readParticleVel(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uVelocitiesPrev, vec2(0.5, v));
}

// 3D noise function
float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 54.53))) * 43758.5453);
}

// Custom force calculation
vec3 calculateCustomForces(vec3 pos, vec3 vel, float aux1, float aux2, float time) {
    // Flow field force
    vec3 flowField = vec3(
        noise(pos * uNoiseScale + time * uTimeScale) - 0.5,
        noise(pos * uNoiseScale + time * uTimeScale + vec3(100.0)) - 0.5,
        noise(pos * uNoiseScale + time * uTimeScale + vec3(200.0)) - 0.5
    ) * uSpeed;
    
    return flowField;
}

void main() {
    int idx = pixelIndex();
    
    vec4 posData = readParticlePos(idx);
    vec4 velData = readParticleVel(idx);
    
    vec3 pos = posData.xyz;
    vec3 vel = velData.xyz;
    float aux1 = velData.w;
    
    // Apply forces and integrate velocity
    vec3 totalForce = uGravity + calculateCustomForces(pos, vel, aux1, 0.0, uTimeSec);
    
    // Integrate velocity
    vel += totalForce * uDeltaTime;
    
    // Apply damping
    vel *= (1.0 - uDamping * uDeltaTime);
    
    // Limit speed
    float speed = length(vel);
    if (speed > uMaxSpeed) {
        vel = normalize(vel) * uMaxSpeed;
    }
    
    gl_FragColor = vec4(vel, aux1);
}
`;

// Position shader - updates position using velocity
const flowFieldPositionShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositionsPrev;
uniform sampler2D uVelocitiesPrev;
uniform float uTimeSec;
uniform float uDeltaTime;
uniform float uParticleCount;

varying vec2 vUv;

int pixelIndex() {
    float y = vUv.y * float(uParticleCount);
    return int(floor(y));
}

vec4 readParticlePos(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uPositionsPrev, vec2(0.5, v));
}

vec4 readParticleVel(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uVelocitiesPrev, vec2(0.5, v));
}

void main() {
    int idx = pixelIndex();
    
    vec4 posData = readParticlePos(idx);
    vec4 velData = readParticleVel(idx);
    
    vec3 pos = posData.xyz;
    vec3 vel = velData.xyz;
    float aux1 = posData.w;
    
    // Update position using velocity
    pos += vel * uDeltaTime;
    
    gl_FragColor = vec4(pos, aux1);
}
`;

export default function FlowFieldExample() {
  // Create particle system with flow field behavior

  const shaderConfig = useMemo(() => ({
    velocityShader: flowFieldVelocityShader,
    positionShader: flowFieldPositionShader,
    uniforms: {
      uSpeed: 1.5,
      uNoiseScale: 0.8,
      uTimeScale: 0.3,
    }
  }), []);

  const particleConfig = useMemo(() => ({
    gravity: new THREE.Vector3(0, -0.2, 0),
    damping: 0.01,
    maxSpeed: 5.0,
  }), []);

  const particles = useParticles({
    count: 1000,
    shaderConfig: shaderConfig,
    config: particleConfig,
  });

  // Create trail system
  const trails = useTrails({
    nodesPerTrail: 80,
    trailsNum: 1000,
    updateDistanceMin: 0.03,
    shaderPack: DistanceShaderPack,
  });

  // Create geometry
  const geometry = useRibbonGeometry({
    geometryType: 'quad',
    geometryConfig: { nodes: 80, trails: 1000, width: 1.0 },
  });

  // Create materials
  const materials = useRibbonMaterials({
    materialType: 'standard',
    materialConfig: { 
      nodeTex: trails.nodeTexture!, 
      trailTex: trails.trailTexture!, 
      baseWidth: 0.02, 
      nodes: 80, 
      trails: 1000, 
      color: '#555555' 
    },
  });

  // Update particles and trails each frame
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    particles.setUniform('uSpeed', 5.0 + Math.sin(time * 0.5) * 0.5);
    particles.setUniform('uNoiseScale', 0.6 + Math.cos(time * 0.3) * 0.3);
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
          trails={1000}
        />
      )}
    </>
  );
}
