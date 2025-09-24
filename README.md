# Trail GPU System

A high-performance GPU-based trail rendering system for Three.js, designed for creating smooth, dynamic particle trails with minimal CPU overhead.

## Features

- **GPU-accelerated**: All trail calculations performed on GPU using compute shaders
- **Circular buffer**: Efficient memory usage with configurable trail lengths
- **Real-time updates**: Smooth trail generation with distance-based advancement
- **TypeScript support**: Full type safety and IntelliSense support
- **React integration**: Easy-to-use React components and hooks
- **Configurable**: Extensive customization options for appearance and behavior
- **Performance optimized**: Minimal draw calls and efficient memory management

## Quick Start

### Basic Usage

```tsx
import { ExampleScene } from './lib/trail-gpu';

function App() {
  return (
    <Canvas>
      <ExampleScene />
    </Canvas>
  );
}
```

### Custom Configuration

```tsx
import { useTrailSystemWithFrame, Ribbon } from './lib/trail-gpu';

function CustomTrailScene() {
  const { trails } = useTrailSystemWithFrame({
    trailConfig: {
      nodesPerTrail: 100,
      trailsNum: 200,
      updateDistanceMin: 0.02,
    },
    particleConfig: {
      speed: 1.0,
      noiseScale: 1.2,
      timeScale: 0.5,
    },
  });

  return (
    <Ribbon
      nodeTex={trails.nodeTexture}
      trailTex={trails.trailTexture}
      nodes={trails.nodes}
      trails={trails.trails}
      baseWidth={0.1}
      color="#ff6b6b"
    />
  );
}
```

## API Reference

### Core Classes

#### `GPUTrailParticles`

Manages particle positions using GPU computation.

```tsx
const particles = new GPUTrailParticles(
  count: number,
  updateFragmentShader: string,
  config?: Partial<ParticleConfig>,
  initialPositions?: Float32Array
);
```

**Methods:**
- `attachRenderer(renderer: WebGLRenderer)`: Attach a renderer
- `stepUpdate(timeSec: number, deltaTime: number)`: Update particle positions
- `dispose()`: Clean up resources

#### `GPUTrailsPass`

Manages trail data and node positions.

```tsx
const trails = new GPUTrailsPass(
  nodesPerTrail: number,
  trailsNum: number,
  calcInputHeadFragmentShader: string,
  calcInputWriteNodeFragmentShader: string,
  config?: Partial<TrailConfig>
);
```

**Methods:**
- `attachRenderer(renderer: WebGLRenderer)`: Attach a renderer
- `writeInputFromTexture(texture: Texture)`: Write particle positions to trail input
- `stepCalcInput(timeSec: number, updateDistanceMin?: number)`: Update trail data
- `dispose()`: Clean up resources

### React Components

#### `Ribbon`

Renders trails as 3D ribbons.

```tsx
<Ribbon
  nodeTex={THREE.Texture}      // Node position texture
  trailTex={THREE.Texture}     // Trail state texture
  nodes={number}               // Number of nodes per trail
  trails={number}              // Number of trails
  baseWidth={number}           // Ribbon width (default: 0.08)
  color={string}               // Ribbon color (default: '#8ec5ff')
  wireframe={boolean}          // Wireframe mode (default: true)
  transparent={boolean}        // Transparency (default: true)
/>
```

#### `DebugPoints`

Visualizes particle positions as points.

```tsx
<DebugPoints
  texture={THREE.DataTexture}  // Particle position texture
  count={number}               // Number of particles
  size={number}                // Point size (default: 0.07)
  color={string}               // Point color (default: 'red')
  headRef={RefObject<number>}  // Optional: circular buffer head
  validRef={RefObject<number>} // Optional: circular buffer valid count
/>
```

### Hooks

#### `useTrailSystem(options?)`

Creates and manages a trail system.

```tsx
const { particles, trails, updateSystem, dispose } = useTrailSystem({
  trailConfig?: Partial<TrailConfig>,
  particleConfig?: Partial<ParticleConfig>,
  initialParticlePositions?: Float32Array,
});
```

#### `useTrailSystemWithFrame(options?)`

Same as `useTrailSystem` but automatically updates each frame.

### Configuration Types

#### `TrailConfig`

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