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

varying vec2 vUv;

// 3D noise function
float noise3D(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 54.321))) * 43758.5453);
}

// Smooth noise
float smoothNoise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    
    float a = noise3D(i);
    float b = noise3D(i + vec3(1.0, 0.0, 0.0));
    float c = noise3D(i + vec3(0.0, 1.0, 0.0));
    float d = noise3D(i + vec3(1.0, 1.0, 0.0));
    float e = noise3D(i + vec3(0.0, 0.0, 1.0));
    float f = noise3D(i + vec3(1.0, 0.0, 1.0));
    float g = noise3D(i + vec3(0.0, 1.0, 1.0));
    float h = noise3D(i + vec3(1.0, 1.0, 1.0));
    
    vec3 u = f * f * (3.0 - 2.0 * f);
    
    return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
               mix(mix(e, f, u.x), mix(g, h, u.x), u.y), u.z);
}

void main() {
    vec2 uv = vUv;
    
    // Read previous position and velocity
    vec4 prevPos = texture2D(uPositionsPrev, uv);
    vec4 prevVel = texture2D(uVelocitiesPrev, uv);
    
    vec3 position = prevPos.xyz;
    vec3 velocity = prevVel.xyz;
    
    // Calculate distance from center
    float distance = length(position.xz);
    
    // Orbital force - perpendicular to radius vector
    vec3 center = vec3(0.0, 0.0, 0.0);
    vec3 toCenter = center - position;
    vec3 orbitalForce = cross(toCenter, vec3(0.0, 1.0, 0.0));
    
    // Normalize and scale orbital force
    if (length(orbitalForce) > 0.0) {
        orbitalForce = normalize(orbitalForce) * (1.0 / (distance + 0.1));
    }
    
    // Add some noise for variation
    float noise = smoothNoise3D(position * 0.1 + uTimeSec * 0.1);
    orbitalForce *= (0.8 + noise * 0.4);
    
    // Apply orbital force
    velocity += orbitalForce * uDeltaTime * 2.0;
    
    // Add centripetal force to maintain orbit
    if (distance > 0.1) {
        vec3 centripetal = normalize(toCenter) * (distance * 0.1);
        velocity += centripetal * uDeltaTime;
    }
    
    // Add some damping
    velocity *= 0.99;
    
    // Limit velocity
    float speed = length(velocity);
    if (speed > 3.0) {
        velocity = normalize(velocity) * 3.0;
    }
    
    // Update position
    position += velocity * uDeltaTime;
    
    // Keep particles roughly in a sphere
    float sphereRadius = 4.0;
    if (length(position) > sphereRadius) {
        position = normalize(position) * sphereRadius;
        velocity = reflect(velocity, normalize(position)) * 0.8;
    }
    
    gl_FragColor = vec4(velocity, 0.0);
}
`;

export function ParticleOrbital() {
  // Create particle system with orbital motion
  const trailNum = 500;
  const nodeNum = 60;

  const shaderConfig = useMemo(() => ({
    velocityShader: orbitalVelocityShader,
  }), []);

  const particleConfig = useMemo(() => ({
    gravity: new THREE.Vector3(0, 0, 0), // No gravity for orbital motion
    damping: 0.01,
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
    geometryConfig: { nodes: 60, trails: 500, width: 1.0 },
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
  });

  // Update particles and trails each frame
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    particles.update(time, delta);
    // Update trails with particle positions
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
        size={0.03}
        color="#00ff00"
      />
    </>
  );
}
