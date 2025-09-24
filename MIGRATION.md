# Migration Guide: Trail GPU System Refactor

This guide helps you migrate from the old trail-gpu system to the new refactored version.

## Key Changes

### 1. File Structure

**Old Structure:**
```
lib/trail-gpu/
├── GPUTrailParticles.tsx
├── GPUTrailsPass.tsx
├── Ribbon.tsx
├── ExampleScene.tsx
├── DebugPoints.tsx
├── CalcInputHead.glsl
├── CalcInputWriteNode.glsl
├── UpdateParticles.glsl
└── README.md
```

**New Structure:**
```
lib/trail-gpu/
├── types.ts                    # TypeScript interfaces
├── utils.ts                    # Utility functions
├── GPUTrailParticles.tsx       # Refactored particle system
├── GPUTrailsPass.tsx           # Refactored trail system
├── Ribbon.tsx                  # Improved ribbon component
├── DebugPoints.tsx             # Improved debug component
├── ExampleScene.tsx            # Enhanced example
├── hooks/
│   └── useTrailSystem.tsx      # Custom React hooks
├── shaders/
│   ├── index.ts                # Shader exports
│   ├── UpdateParticles.glsl    # Improved particle shader
│   ├── CalcInputHead.glsl      # Improved head calculation shader
│   ├── CalcInputWriteNode.glsl # Improved node writing shader
│   └── Ribbon.glsl             # Combined ribbon shaders
├── index.ts                    # Main exports
├── README.md                   # Comprehensive documentation
└── MIGRATION.md                # This file
```

### 2. Import Changes

**Old:**
```tsx
import { GPUTrailParticles } from './lib/trail-gpu/GPUTrailParticles';
import { GPUTrailsPass } from './lib/trail-gpu/GPUTrailsPass';
import { Ribbon } from './lib/trail-gpu/Ribbon';
import calcInputHeadFrag from './lib/trail-gpu/CalcInputHead.glsl?raw';
import calcInputWriteNodeFrag from './lib/trail-gpu/CalcInputWriteNode.glsl?raw';
import updateParticlesFrag from './lib/trail-gpu/UpdateParticles.glsl?raw';
```

**New:**
```tsx
import { 
  GPUTrailParticles, 
  GPUTrailsPass, 
  Ribbon,
  useTrailSystemWithFrame,
  calcInputHeadFrag,
  calcInputWriteNodeFrag,
  updateParticlesFrag
} from './lib/trail-gpu';
```

### 3. Constructor Changes

**Old:**
```tsx
const particles = new GPUTrailParticles(count, updateFrag, initPositions);
const trails = new GPUTrailsPass(nodesPerTrail, trailsNum, calcInputHeadFrag, calcInputWriteNodeFrag);
```

**New:**
```tsx
const particles = new GPUTrailParticles(
  count, 
  updateFrag, 
  particleConfig,  // New: configuration object
  initPositions
);

const trails = new GPUTrailsPass(
  nodesPerTrail, 
  trailsNum, 
  calcInputHeadFrag, 
  calcInputWriteNodeFrag,
  trailConfig      // New: configuration object
);
```

### 4. React Component Changes

**Old:**
```tsx
<Ribbon
  NodeTex={trails.NodeTex}
  TrailTex={trails.TrailTex}
  nodes={trails.nodes}
  trails={trails.trails}
  baseWidth={0.08}
/>
```

**New:**
```tsx
<Ribbon
  nodeTex={trails.nodeTexture}    // Changed: camelCase
  trailTex={trails.trailTexture}  // Changed: camelCase
  nodes={trails.nodes}
  trails={trails.trails}
  baseWidth={0.08}
  color="#8ec5ff"                 // New: color prop
  wireframe={true}                // New: wireframe control
/>
```

### 5. New React Hooks

**Old Manual Setup:**
```tsx
const particles = useMemo(() => {
  const p = new GPUTrailParticles(trailsNum, updateParticlesFrag);
  p.attachRenderer(gl);
  return p;
}, [gl, trailsNum]);

const trails = useMemo(() => {
  const t = new GPUTrailsPass(nodesPerTrail, trailsNum, calcInputHeadFrag, calcInputWriteNodeFrag);
  t.attachRenderer(gl);
  return t;
}, [nodesPerTrail, trailsNum, gl]);

useFrame((state, dt) => {
  const timeSec = state.clock.getElapsedTime();
  particles.stepUpdate(gl, timeSec, dt);
  trails.writeInputFromTex(particles.ParticlesTex);
  trails.stepCalcInput(gl, timeSec, updateDistanceMin);
}, -1);
```

**New Hook-Based:**
```tsx
const { particles, trails } = useTrailSystemWithFrame({
  trailConfig: {
    nodesPerTrail: 60,
    trailsNum: 100,
    updateDistanceMin: 0.05,
  },
  particleConfig: {
    speed: 0.6,
    noiseScale: 0.8,
    timeScale: 0.3,
  },
});
```

### 6. Property Name Changes

| Old Property | New Property | Notes |
|-------------|--------------|-------|
| `ParticlesTex` | `particlesTexture` | camelCase |
| `NodeTex` | `nodeTexture` | camelCase |
| `TrailTex` | `trailTexture` | camelCase |
| `InputTex` | `inputTexture` | camelCase |
| `writeInputFromTex()` | `writeInputFromTexture()` | More descriptive |
| `stepUpdate(renderer, ...)` | `stepUpdate(...)` | Renderer handled internally |
| `stepCalcInput(renderer, ...)` | `stepCalcInput(...)` | Renderer handled internally |

### 7. Error Handling

**Old:**
```tsx
// No error handling
particles.stepUpdate(gl, timeSec, dt);
```

**New:**
```tsx
// Automatic error handling with descriptive messages
try {
  particles.stepUpdate(timeSec, dt);
} catch (error) {
  if (error instanceof TrailGPUError) {
    console.error(`Trail GPU Error: ${error.message}`);
  }
}
```

### 8. Configuration Objects

**Old:**
```tsx
// Hardcoded values scattered throughout code
const speed = 0.6;
const noiseScale = 0.8;
const updateDistanceMin = 0.05;
```

**New:**
```tsx
// Centralized configuration
const trailConfig: TrailConfig = {
  nodesPerTrail: 60,
  trailsNum: 100,
  updateDistanceMin: 0.05,
};

const particleConfig: ParticleConfig = {
  count: 100,
  speed: 0.6,
  noiseScale: 0.8,
  timeScale: 0.3,
};
```

## Migration Steps

### Step 1: Update Imports
Replace all old imports with the new centralized import from `./lib/trail-gpu`.

### Step 2: Update Component Props
Change property names from PascalCase to camelCase and add new optional props.

### Step 3: Use New Hooks (Recommended)
Replace manual setup with `useTrailSystemWithFrame` hook for automatic updates.

### Step 4: Add Configuration Objects
Create configuration objects for better organization and type safety.

### Step 5: Update Error Handling
Add try-catch blocks around GPU operations for better error handling.

### Step 6: Test and Verify
Ensure all functionality works as expected with the new system.

## Benefits of Migration

1. **Better Type Safety**: Full TypeScript support with proper interfaces
2. **Improved Performance**: Optimized GPU operations and memory management
3. **Easier Maintenance**: Better code organization and documentation
4. **Enhanced Features**: New configuration options and React hooks
5. **Better Error Handling**: Descriptive error messages and proper error types
6. **Cleaner API**: More intuitive property names and method signatures

## Backward Compatibility

The old API is not supported in the new version. You must update your code to use the new API. The migration should be straightforward for most use cases.

## Support

If you encounter issues during migration, refer to the comprehensive README.md or check the example implementations in ExampleScene.tsx.
