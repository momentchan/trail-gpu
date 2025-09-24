# Trail and Particle System Separation Guide

This guide shows how to use the separated trail and particle systems to create different particle behaviors with the same trail functionality.

## Architecture Overview

The system is now split into two main parts:

1. **Trail System** (`useTrails`): Handles trail generation and rendering
2. **Particle Systems**: Different particle behaviors that can be combined with trails

## Basic Usage

### 1. Using Trails with Flow Field Particles

```tsx
import { useTrailsWithParticles, useFlowFieldParticles } from './lib/trail-gpu';

function FlowFieldTrailScene() {
  // Create flow field particles
  const { particles } = useFlowFieldParticles({
    count: 100,
    particleConfig: {
      speed: 0.6,
      noiseScale: 0.8,
      timeScale: 0.3,
    },
  });

  // Combine with trail system
  const { trails } = useTrailsWithParticles({
    particleSystem: particles,
    trailConfig: {
      nodesPerTrail: 60,
      trailsNum: 100,
      updateDistanceMin: 0.05,
    },
  });

  return (
    <Ribbon
      nodeTex={trails.nodeTexture}
      trailTex={trails.trailTexture}
      nodes={trails.nodes}
      trails={trails.trails}
      color="#8ec5ff"
    />
  );
}
```

### 2. Using Trails with Orbital Particles

```tsx
import { useTrailsWithParticles, useOrbitalParticles } from './lib/trail-gpu';

function OrbitalTrailScene() {
  // Create orbital particles
  const { particles } = useOrbitalParticles({
    count: 100,
    particleConfig: {
      radius: 2.0,
      orbitSpeed: 1.0,
    },
  });

  // Combine with trail system
  const { trails } = useTrailsWithParticles({
    particleSystem: particles,
    trailConfig: {
      nodesPerTrail: 60,
      trailsNum: 100,
      updateDistanceMin: 0.05,
    },
  });

  return (
    <Ribbon
      nodeTex={trails.nodeTexture}
      trailTex={trails.trailTexture}
      nodes={trails.nodes}
      trails={trails.trails}
      color="#ff8c42"
    />
  );
}
```

## Available Particle Systems

### 1. FlowFieldParticles
Particles that move through a 3D noise-based flow field.

**Features:**
- Smooth, organic movement
- Configurable speed, noise scale, and time scale
- Natural-looking trails

**Usage:**
```tsx
const { particles } = useFlowFieldParticles({
  count: 100,
  particleConfig: {
    speed: 0.6,        // Movement speed
    noiseScale: 0.8,   // Noise coordinate scale
    timeScale: 0.3,    // Animation time scale
  },
});
```

### 2. OrbitalParticles
Particles that orbit around a center point with varying patterns.

**Features:**
- Circular and spiral patterns
- Configurable radius and orbit speed
- Smooth orbital motion

**Usage:**
```tsx
const { particles } = useOrbitalParticles({
  count: 100,
  particleConfig: {
    radius: 2.0,       // Orbit radius
    orbitSpeed: 1.0,   // Speed of orbit
  },
});
```

### 3. AttractorParticles
Particles that are attracted to multiple attractor points.

**Features:**
- Multiple attractor points
- Configurable attraction strength
- Complex, dynamic movement patterns

**Usage:**
```tsx
const { particles } = useAttractorParticles({
  count: 100,
  particleConfig: {
    attractorStrength: 1.0,
    attractor1: new THREE.Vector3(2, 0, 0),
    attractor2: new THREE.Vector3(-2, 0, 0),
    attractor3: new THREE.Vector3(0, 2, 0),
  },
});
```

## Creating Custom Particle Systems

### 1. Extend GPUTrailParticles

```tsx
import { GPUTrailParticles } from './lib/trail-gpu';

const customParticleShader = `
precision highp float;

uniform sampler2D uParticlesPrev;
uniform float uTimeSec;
uniform float uDeltaTime;
uniform float uSpeed;
uniform float uParticleCount;

varying vec2 vUv;

// Your custom particle update logic here
void main() {
    int idx = int(floor(vUv.y * float(uParticleCount)));
    
    vec4 prev = texture2D(uParticlesPrev, vec2(0.5, (float(idx) + 0.5) / float(uParticleCount)));
    vec3 pos = prev.xyz;
    
    // Custom movement logic
    pos.x += sin(uTimeSec + float(idx) * 0.1) * uSpeed * uDeltaTime;
    pos.y += cos(uTimeSec + float(idx) * 0.1) * uSpeed * uDeltaTime;
    pos.z += sin(uTimeSec * 0.5 + float(idx) * 0.1) * uSpeed * uDeltaTime;
    
    gl_FragColor = vec4(pos, prev.w);
}
`;

export class CustomParticles extends GPUTrailParticles {
  constructor(count: number, config = {}, initialPositions?) {
    super(count, customParticleShader, config, initialPositions);
  }
}
```

### 2. Create a Hook for Your Custom System

```tsx
import { useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { CustomParticles } from './CustomParticles';

export function useCustomParticles({ count, config = {}, initialPositions }) {
  const { gl } = useThree();
  
  const particles = useMemo(() => {
    const system = new CustomParticles(count, config, initialPositions);
    system.attachRenderer(gl);
    return system;
  }, [gl, count, config, initialPositions]);

  const updateParticles = useCallback((timeSec, deltaTime) => {
    particles.stepUpdate(timeSec, deltaTime);
  }, [particles]);

  const dispose = useCallback(() => {
    particles.dispose();
  }, [particles]);

  return { particles, updateParticles, dispose };
}
```

### 3. Use with Trail System

```tsx
function CustomTrailScene() {
  const { particles } = useCustomParticles({
    count: 100,
    config: { speed: 0.5 },
  });

  const { trails } = useTrailsWithParticles({
    particleSystem: particles,
    trailConfig: { nodesPerTrail: 60, trailsNum: 100 },
  });

  return <Ribbon {...trails} color="#ff0000" />;
}
```

## Manual Control

If you need manual control over the update timing:

```tsx
function ManualControlScene() {
  const { particles } = useFlowFieldParticles({ count: 100 });
  const { trails, updateSystem } = useTrailsWithParticles({
    particleSystem: particles,
    autoUpdate: false, // Disable automatic updates
  });

  // Manual update control
  const controls = useControls({
    update: { value: false },
  });

  useFrame((state, delta) => {
    if (controls.update) {
      updateSystem(state.clock.getElapsedTime(), delta);
    }
  });

  return <Ribbon {...trails} />;
}
```

## Multiple Trail Systems

You can create multiple trail systems with different particle behaviors:

```tsx
function MultipleTrailScene() {
  // Flow field trails
  const { particles: flowParticles } = useFlowFieldParticles({ count: 50 });
  const { trails: flowTrails } = useTrailsWithParticles({
    particleSystem: flowParticles,
    trailConfig: { trailsNum: 50 },
  });

  // Orbital trails
  const { particles: orbitalParticles } = useOrbitalParticles({ count: 50 });
  const { trails: orbitalTrails } = useTrailsWithParticles({
    particleSystem: orbitalParticles,
    trailConfig: { trailsNum: 50 },
  });

  return (
    <>
      <Ribbon {...flowTrails} color="#8ec5ff" />
      <Ribbon {...orbitalTrails} color="#ff8c42" />
    </>
  );
}
```

## Performance Tips

1. **Reuse Trail Systems**: Create one trail system and use it with different particle systems
2. **Optimize Particle Count**: Use fewer particles for better performance
3. **Adjust Trail Length**: Shorter trails (fewer nodes) are more performant
4. **Use Manual Updates**: For complex scenes, consider manual update control

## Examples

Check out the example files:
- `examples/FlowFieldExample.tsx` - Flow field particles with trails
- `examples/OrbitalExample.tsx` - Orbital particles with trails

These examples show complete implementations with controls and debugging options.
