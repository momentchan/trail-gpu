# Trail GPU System

A high-performance GPU-based trail rendering system for Three.js, designed for creating smooth, dynamic particle trails with minimal CPU overhead.

## Features

- **GPU-accelerated**: All trail calculations performed on GPU using compute shaders
- **Modular architecture**: Decoupled geometry and material providers for maximum flexibility
- **Multiple geometry types**: Support for quad ribbons and 3D tubes
- **Custom shaders**: Easy integration of custom vertex and fragment shaders
- **React integration**: Simple-to-use React components and hooks
- **TypeScript support**: Full type safety and IntelliSense support
- **Performance optimized**: Minimal draw calls and efficient memory management

## Quick Start

### Basic Usage

```tsx
import { useParticles, useTrails, useRibbonGeometry, useRibbonMaterials, Ribbon } from './lib/trail-gpu';

function BasicTrailScene() {
  const trailNum = 100;
  const nodeNum = 50;

  // Create particle system
  const particles = useParticles({
    count: trailNum,
    config: { gravity: new THREE.Vector3(0, -1, 0), damping: 0.02 },
  });

  // Create trail system
  const trails = useTrails({
    nodesPerTrail: nodeNum,
    trailsNum: trailNum,
    updateDistanceMin: 0.05,
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
      baseWidth: 0.08,
      nodes: nodeNum,
      trails: trailNum,
      color: '#8ec5ff',
    },
  });

  // Update each frame
  useFrame((state, delta) => {
    particles.update(state.clock.elapsedTime, delta);
    trails.update(state.clock.elapsedTime, delta, particles.positionsTexture!);
  });

  return (
    <Ribbon
      geometry={geometry}
      material={materials.material}
      depthMaterial={materials.depthMaterial}
      trails={trailNum}
    />
  );
}
```

## API Reference

### React Hooks

#### `useParticles(config)`

Creates and manages a particle system.

```tsx
const particles = useParticles({
  count: number,
  config?: ParticleConfig,
  shaderConfig?: ParticleShaderConfig,
});
```

**Returns:**
- `positionsTexture`: Data texture containing particle positions
- `update(time, delta)`: Function to update particle positions
- `setUniform(name, value)`: Function to update shader uniforms

#### `useTrails(config)`

Creates and manages a trail system.

```tsx
const trails = useTrails({
  nodesPerTrail: number,
  trailsNum: number,
  updateDistanceMin: number,
  shaderPack?: ShaderPack,
});
```

**Returns:**
- `nodeTexture`: Texture containing trail node positions
- `trailTexture`: Texture containing trail state data
- `update(time, delta, positionsTexture)`: Function to update trails

#### `useRibbonGeometry(config)`

Creates geometry for ribbon rendering.

```tsx
const geometry = useRibbonGeometry({
  geometryType: 'quad' | 'tube',
  geometryConfig: QuadGeometryConfig | TubeGeometryConfig,
});
```

#### `useRibbonMaterials(config)`

Creates materials for ribbon rendering.

```tsx
const materials = useRibbonMaterials({
  materialType: 'standard' | 'tube',
  materialConfig: MaterialConfig,
});
```

**Returns:**
- `material`: Main rendering material
- `depthMaterial`: Depth-only material for shadows

### React Components

#### `Ribbon`

Renders trails using pre-created geometry and materials.

```tsx
<Ribbon
  geometry={THREE.InstancedBufferGeometry}  // Geometry from useRibbonGeometry
  material={THREE.Material | null}          // Material from useRibbonMaterials
  depthMaterial={THREE.Material | null}     // Depth material from useRibbonMaterials
  trails={number}                           // Number of trails
  receiveShadow={boolean}                   // Receive shadows (default: true)
  castShadow={boolean}                      // Cast shadows (default: true)
  frustumCulled={boolean}                   // Frustum culling (default: false)
/>
```

#### `ParticleDebugPoints`

Visualizes particle positions as points.

```tsx
<ParticleDebugPoints
  texture={THREE.DataTexture}  // Particle position texture
  count={number}               // Number of particles
  size={number}                // Point size (default: 0.07)
  color={string}               // Point color (default: 'red')
/>
```

### Geometry Providers

#### Quad Geometry

```tsx
const geometry = useRibbonGeometry({
  geometryType: 'quad',
  geometryConfig: {
    nodes: number,      // Number of nodes per trail
    trails: number,     // Number of trails
    width?: number,     // Ribbon width (default: 1.0)
  },
});
```

#### Tube Geometry

```tsx
const geometry = useRibbonGeometry({
  geometryType: 'tube',
  geometryConfig: {
    nodes: number,        // Number of nodes per trail
    trails: number,       // Number of trails
    segments?: number,    // Radial segments (default: 8)
    radius?: number,      // Tube radius (default: 0.04)
    capStart?: boolean,   // Add cap at start (default: false)
    capEnd?: boolean,     // Add cap at end (default: false)
  },
});
```

### Material Providers

#### Standard Material

```tsx
const materials = useRibbonMaterials({
  materialType: 'standard',
  materialConfig: {
    nodeTex: THREE.Texture,    // Trail node texture
    trailTex: THREE.Texture,   // Trail state texture
    baseWidth: number,         // Base width/radius
    nodes: number,             // Number of nodes
    trails: number,            // Number of trails
    color: string,             // Base color
    materialProps?: object,    // Standard Three.js material properties
  },
});
```

#### Custom Shader Material

```tsx
const materials = useRibbonMaterials({
  materialType: 'standard',
  materialConfig: {
    vertexShader: string,      // Custom vertex shader
    fragmentShader: string,    // Custom fragment shader
    uniforms: object,          // Custom uniforms
    nodeTex: THREE.Texture,    // Trail node texture
    trailTex: THREE.Texture,   // Trail state texture
    baseWidth: number,         // Base width/radius
    nodes: number,             // Number of nodes
    trails: number,            // Number of trails
    color: string,             // Base color
  },
});
```

## Examples

The system includes several example implementations:

- `ParticleFlowField`: Particles following a flow field
- `ParticleOrbital`: Particles in orbital motion
- `ParticleBasic`: Basic velocity/position integration
- `RibbonQuadDemo`: Quad geometry variations
- `RibbonTubeDemo`: 3D tube geometry

```tsx
import { ParticleFlowField, ParticleOrbital, RibbonQuadDemo, RibbonTubeDemo } from './lib/trail-gpu';

// Use any of the examples directly
<ParticleFlowField />
```

## Configuration Types

### `TrailConfig`

```tsx
interface TrailConfig {
  nodesPerTrail: number;      // Number of nodes per trail
  trailsNum: number;          // Number of trails
  updateDistanceMin: number;  // Minimum distance to advance trail
}
```

#### `ParticleConfig`

```tsx
interface ParticleConfig {
  count: number;              // Number of particles
  speed: number;              // Movement speed
  noiseScale: number;         // Noise coordinate scale
  timeScale: number;          // Animation time scale
}
```

## Shaders

The system includes several GLSL shaders:

- **UpdateParticles.glsl**: Updates particle positions using 3D flow fields
- **CalcInputHead.glsl**: Determines when to advance trail heads
- **CalcInputWriteNode.glsl**: Writes new node positions to trails
- **Ribbon.glsl**: Renders trails as 3D ribbons

## Performance Tips

1. **Optimize trail count**: More trails = more GPU memory usage
2. **Adjust node count**: More nodes per trail = longer trails but more memory
3. **Tune update distance**: Smaller values = smoother trails but more updates
4. **Use appropriate precision**: Float32 is usually sufficient for most use cases

## Examples

### Basic Trail System

```tsx
import { useTrailSystemWithFrame, Ribbon } from './lib/trail-gpu';

function BasicTrail() {
  const { trails } = useTrailSystemWithFrame();
  
  return (
    <Ribbon
      nodeTex={trails.nodeTexture}
      trailTex={trails.trailTexture}
      nodes={trails.nodes}
      trails={trails.trails}
    />
  );
}
```

### Custom Particle Behavior

```tsx
// Create custom particle update shader
const customParticleShader = `
  // Your custom particle update logic here
`;

const particles = new GPUTrailParticles(
  100,
  customParticleShader,
  { speed: 2.0, noiseScale: 1.5 }
);
```

### Multiple Trail Systems

```tsx
function MultipleTrails() {
  const trail1 = useTrailSystemWithFrame({ 
    trailConfig: { trailsNum: 50 } 
  });
  const trail2 = useTrailSystemWithFrame({ 
    trailConfig: { trailsNum: 100 } 
  });

  return (
    <>
      <Ribbon {...trail1.trails} color="#ff0000" />
      <Ribbon {...trail2.trails} color="#0000ff" />
    </>
  );
}
```

## Troubleshooting

### Common Issues

1. **Trails not appearing**: Check that renderer is attached and textures are valid
2. **Performance issues**: Reduce trail count or node count
3. **Memory errors**: Ensure proper disposal of resources
4. **Shader compilation errors**: Check GLSL syntax and uniform names

### Debug Mode

Use the debug controls in the example scene to visualize trail segments and particle positions.

## License

This project is part of your portfolio and follows your project's licensing terms.