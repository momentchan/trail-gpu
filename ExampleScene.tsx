import { useMemo } from 'react';
import { useControls } from 'leva';
import { Ribbon } from './Ribbon';
import { ParticleDebugPoints } from './ParticleDebugPoints';
import { useTrailSystemWithFrame, useTrailSystem } from './hooks/useTrailSystem';
import { TrailConfig, ParticleConfig } from './types';

export function ExampleScene() {
  // Configuration controls
  const trailControls = useControls('Trail System', {
    nodesPerTrail: { value: 60, min: 10, max: 200, step: 1 },
    trailsNum: { value: 100, min: 10, max: 500, step: 1 },
    updateDistanceMin: { value: 0.05, min: 0.01, max: 0.5, step: 0.01 },
  });

  const particleControls = useControls('Particle System', {
    speed: { value: 0.6, min: 0.1, max: 2.0, step: 0.1 },
    noiseScale: { value: 0.8, min: 0.1, max: 2.0, step: 0.1 },
    timeScale: { value: 0.3, min: 0.1, max: 1.0, step: 0.1 },
  });

  const displayControls = useControls('Display', {
    showRibbon: { value: true },
    showParticlePoints: { value: true }, // Show particle positions (heads)
    ribbonColor: { value: '#8ec5ff' },
    ribbonWidth: { value: 0.08, min: 0.01, max: 0.3, step: 0.01 },
    wireframe: { value: true },
  });

  // Create trail system configuration
  const trailConfig: TrailConfig = useMemo(() => ({
    nodesPerTrail: trailControls.nodesPerTrail,
    trailsNum: trailControls.trailsNum,
    updateDistanceMin: trailControls.updateDistanceMin,
  }), [trailControls]);

  const particleConfig: ParticleConfig = useMemo(() => ({
    count: trailControls.trailsNum, // Match number of trails
    speed: particleControls.speed,
    noiseScale: particleControls.noiseScale,
    timeScale: particleControls.timeScale,
  }), [trailControls.trailsNum, particleControls]);

  // Initialize trail system
  const { particles, trails } = useTrailSystemWithFrame({
    trailConfig,
    particleConfig,
  });


  return (
    <>
      {/* Main ribbon visualization */}
      {displayControls.showRibbon && (
        <Ribbon
          nodeTex={trails.nodeTexture}
          trailTex={trails.trailTexture}
          nodes={trails.nodes}
          trails={trails.trails}
          baseWidth={displayControls.ribbonWidth}
          color={displayControls.ribbonColor}
          wireframe={displayControls.wireframe}
          transparent={true}
        />
      )}

      {/* Debug points for particle positions (heads) */}
      {displayControls.showParticlePoints && (
        <ParticleDebugPoints
          particleTexture={particles.particlesTexture}
          count={particles.count}
          size={0.05}
          color="#ff6b6b"
        />
      )}
    </>
  );
}

// Alternative example with manual control
export function ManualExampleScene() {
  const { particles, trails, updateSystem } = useTrailSystem({
    trailConfig: {
      nodesPerTrail: 80,
      trailsNum: 150,
      updateDistanceMin: 0.03,
    },
    particleConfig: {
      speed: 0.8,
      noiseScale: 1.0,
      timeScale: 0.4,
    },
  });

  // Manual update control
  const manualControls = useControls('Manual Control', {
    update: { value: false },
    reset: { value: false },
  });

  // You would implement manual update logic here
  // This is just a placeholder for the structure

  return (
    <>
      <Ribbon
        nodeTex={trails.nodeTexture}
        trailTex={trails.trailTexture}
        nodes={trails.nodes}
        trails={trails.trails}
        baseWidth={0.1}
        color="#ff8c42"
        wireframe={false}
        transparent={true}
      />
      
      <ParticleDebugPoints
        particleTexture={particles.particlesTexture}
        count={particles.count}
        size={0.03}
        color="#42ff8c"
      />
    </>
  );
}