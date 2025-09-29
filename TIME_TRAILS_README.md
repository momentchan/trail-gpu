# Time-Based Trails

This document explains how to use the new time-based trail system in addition to the existing distance-based trails.

## Overview

The trail system now supports two modes:
- **Distance-based**: Trails advance when particles move a certain distance from the last node
- **Time-based**: Trails advance at regular time intervals, regardless of particle movement

## Usage

### Basic Time-Based Trail Setup

```tsx
import { TimeShaderPack } from './shaders/packs/time';
import { useTrails } from './hooks/useTrails';

const trailSystem = useTrails({
    nodesPerTrail: 32,
    trailsNum: 50,
    fixedLength: false,
    advanceMode: 'time',           // Enable time-based mode
    updateTimeStep: 0.1,           // Update every 0.1 seconds
    shaderPack: TimeShaderPack,    // Use time-based shader pack
});
```

### Comparison with Distance-Based

```tsx
import { DistanceShaderPack } from './shaders/packs/distance';
import { TimeShaderPack } from './shaders/packs/time';

// Distance-based (existing)
const distanceTrails = useTrails({
    advanceMode: 'distance',
    updateDistanceMin: 0.05,       // Minimum distance to advance
    shaderPack: DistanceShaderPack,
});

// Time-based (new)
const timeTrails = useTrails({
    advanceMode: 'time',
    updateTimeStep: 0.1,           // Time interval to advance
    shaderPack: TimeShaderPack,
});
```

## Key Differences

| Aspect | Distance-Based | Time-Based |
|--------|----------------|------------|
| **Trigger** | Particle movement distance | Time intervals |
| **Consistency** | Varies with speed | Consistent timing |
| **Use Case** | Natural motion trails | Timed effects, animations |
| **Performance** | Depends on movement | Predictable |

## Examples

### Simple Time-Based Trail
```tsx
import { TimeTrailTest } from './examples/TimeTrailTest';

// Shows particles with time-based trails
<TimeTrailTest />
```

### Side-by-Side Comparison
```tsx
import { TrailComparison } from './examples/TrailComparison';

// Shows both distance and time-based trails
<TrailComparison />
```

### Advanced Time-Based Example
```tsx
import { ParticleTimeTrail } from './examples/ParticleTimeTrail';

// Complex particle system with time-based trails
<ParticleTimeTrail />
```

## Configuration Options

### Time-Based Configuration
- `updateTimeStep`: Time interval in seconds between trail advances
- `advanceMode`: Set to `'time'` for time-based trails
- `shaderPack`: Use `TimeShaderPack` for time-based shaders

### When to Use Time-Based Trails

1. **Consistent Animation Timing**: When you need trails to advance at regular intervals regardless of particle speed
2. **Synchronized Effects**: For effects that need to be timed with other animations
3. **Performance Control**: When you want predictable trail update frequency
4. **Visual Effects**: For creating rhythmic or pulsing trail effects

### When to Use Distance-Based Trails

1. **Natural Motion**: When trails should follow natural particle movement
2. **Variable Speed**: When particles move at different speeds
3. **Physics Simulation**: For realistic trail behavior in physics-based systems

## Technical Details

The time-based system uses a new shader (`CalcInputAdvanceTime.glsl`) that:
- Compares current time with the timestamp of the last written node
- Advances the trail when the time difference exceeds `updateTimeStep`
- Stores timestamps in the node data for accurate time tracking

The system maintains the same API as distance-based trails, making it easy to switch between modes.
