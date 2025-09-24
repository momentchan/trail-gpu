import { useMemo } from 'react';
import { useControls } from 'leva';
import { Ribbon } from '../Ribbon';
import { ParticleDebugPoints } from '../ParticleDebugPoints';
import { useTrailsWithParticles } from '../hooks/useTrailsWithParticles';
import { useFlowFieldParticles } from '../hooks/useFlowFieldParticles';
import { TrailConfig, ParticleConfig } from '../types';

export function FlowFieldExample() {
  // Trail configuration
  const trailControls = useControls('Trail System', {
    nodesPerTrail: { value: 60, min: 10, max: 200, step: 1 },
    trailsNum: { value: 100, min: 10, max: 500, step: 1 },
    updateDistanceMin: { value: 0.05, min: 0.01, max: 0.5, step: 0.01 },
  });

  // Flow field particle configuration
  const particleControls = useControls('Flow Field Particles', {
    speed: { value: 0.6, min: 0.1, max: 2.0, step: 0.1 },
    noiseScale: { value: 0.8, min: 0.1, max: 2.0, step: 0.1 },
    timeScale: { value: 0.3, min: 0.1, max: 1.0, step: 0.1 },
  });

  const displayControls = useControls('Display', {
    showRibbon: { value: true },
    showParticlePoints: { value: true },
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
    count: trailControls.trailsNum,
    speed: particleControls.speed,
    noiseScale: particleControls.noiseScale,
    timeScale: particleControls.timeScale,
  }), [trailControls.trailsNum, particleControls]);

  // Create flow field particle system
  const { particles } = useFlowFieldParticles({
    count: trailControls.trailsNum,
    particleConfig,
  });

  // Combine with trail system
  const { trails } = useTrailsWithParticles({
    particleSystem: particles,
    trailConfig,
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

      {/* Debug points for particle positions */}
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
