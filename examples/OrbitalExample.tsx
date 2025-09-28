import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useParticles, useTrails, Ribbon, ParticleDebugPoints, useRibbonGeometry, useRibbonMaterials } from '../index';
import { DistanceShaderPack } from '../shaders/packs/distance';

// Velocity shader for orbital motion
const orbitalVelocityShader = /* glsl */ `
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

// Orbital parameters
uniform float uRadius;
uniform float uOrbitSpeed;
uniform vec3 uCenter;

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

// Custom force calculation
vec3 calculateCustomForces(vec3 pos, vec3 vel, float aux1, float aux2, float time) {
    // Calculate orbital force (centripetal force)
    vec3 toCenter = uCenter - pos;
    float distance = length(toCenter);
    
    // Add some variation per particle
    int idx = pixelIndex();
    float particleVariation = float(idx) * 0.01;
    
    // Create orbital force with some spiral motion
    vec3 orbitalForce = normalize(toCenter) * uOrbitSpeed * uOrbitSpeed * (uRadius + particleVariation);
    
    // Add some spiral motion
    vec3 tangent = cross(toCenter, vec3(0, 1, 0));
    if (length(tangent) > 0.1) {
        tangent = normalize(tangent);
        orbitalForce += tangent * uOrbitSpeed * 0.5;
    }
    
    return orbitalForce;
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
const orbitalPositionShader = /* glsl */ `
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

export function OrbitalExample() {

  const shaderConfig = useMemo(() => ({
    velocityShader: orbitalVelocityShader,
    positionShader: orbitalPositionShader,
    uniforms: {
      uRadius: 3.0,
      uOrbitSpeed: 1.2,
      uCenter: new THREE.Vector3(0, 0, 0),
    }
  }), []);

  const particleConfig = useMemo(() => ({
    gravity: new THREE.Vector3(0, -0.5, 0),
    damping: 0.005,
    maxSpeed: 8.0,
  }), []);

  // Create particle system with orbital behavior
  const particles = useParticles({
    count: 500,
    shaderConfig: shaderConfig,
    config: particleConfig,
  });

  // Create trail system
  const trails = useTrails({
    nodesPerTrail: 60,
    trailsNum: 500,
    updateDistanceMin: 0.05,
    shaderPack: DistanceShaderPack,
  });

  // Update particles and trails each frame
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Update orbital parameters dynamically
    particles.setUniform('uRadius', 2.5 + Math.sin(time * 0.3) * 0.5);
    particles.setUniform('uOrbitSpeed', 1.0 + Math.cos(time * 0.4) * 0.3);

    // Make the center point move in a small circle
    const centerX = Math.sin(time * 0.2) * 0.5;
    const centerZ = Math.cos(time * 0.2) * 0.5;
    particles.setUniform('uCenter', new THREE.Vector3(centerX, 0, centerZ));

    // Update particles
    particles.update(time, delta);

    // Update trails with particle positions
    trails.update(time, delta, particles.positionsTexture!);
  });

  // Create geometry
  const geometry = useRibbonGeometry({
    geometryType: 'quad',
    geometryConfig: { nodes: 60, trails: 500, width: 1.0 },
    nodes: 60,
    trails: 500,
  });

  // Create materials
  const materials = useRibbonMaterials({
    materialType: 'standard',
    materialConfig: { 
      nodeTex: trails.nodeTexture!, 
      trailTex: trails.trailTexture!, 
      baseWidth: 0.01, 
      nodes: 60, 
      trails: 500, 
      color: '#ff6b6b' 
    },
    nodeTex: trails.nodeTexture!,
    trailTex: trails.trailTexture!,
    baseWidth: 0.01,
    nodes: 60,
    trails: 500,
    color: '#ff6b6b',
  });

  return (
    <>
      {trails.nodeTexture && trails.trailTexture && materials.material && (
        <Ribbon
          geometry={geometry}
          material={materials.material}
          depthMaterial={materials.depthMaterial}
          trails={500}
        />
      )}
    </>
  );
}

