import { useMemo } from 'react';
import { useControls } from 'leva';
import { Ribbon } from '../Ribbon';
import { ParticleDebugPoints } from '../ParticleDebugPoints';
import { useOrbitalParticles } from '../hooks/useOrbitalParticles';
import { TrailConfig } from '../types';
import { useFrame } from '@react-three/fiber';
import { DistanceShaderPack } from '../shaders/packs/distance';
import { useTrails } from '../hooks/useTrails';

export function OrbitalExample() {

  // Trail configuration
  const trailControls = useControls('Trail System', {
    nodesPerTrail: { value: 60, min: 10, max: 200, step: 1 },
    trailsNum: { value: 100, min: 10, max: 500, step: 1 },
    updateDistanceMin: { value: 0.05, min: 0.01, max: 0.5, step: 0.01 },
  });

  // Orbital particle configuration
  const particleControls = useControls('Orbital Particles', {
    radius: { value: 2.0, min: 0.5, max: 5.0, step: 0.1 },
    orbitSpeed: { value: 1.0, min: 0.1, max: 3.0, step: 0.1 },
  });

  const displayControls = useControls('Display', {
    showRibbon: { value: true },
    showParticlePoints: { value: true },
    ribbonColor: { value: '#ff8c42' },
    ribbonWidth: { value: 0.08, min: 0.01, max: 0.3, step: 0.01 },
    wireframe: { value: true },
  });

  // Create trail system configuration
  const trailConfig: TrailConfig = useMemo(() => ({
    nodesPerTrail: trailControls.nodesPerTrail,
    trailsNum: trailControls.trailsNum,
    updateDistanceMin: trailControls.updateDistanceMin,
  }), [trailControls]);

  const particleConfig = useMemo(() => ({
    count: trailControls.trailsNum,
    radius: particleControls.radius,
    orbitSpeed: particleControls.orbitSpeed,
  }), [trailControls.trailsNum, particleControls]);

  // Create orbital particle system
  const { particles } = useOrbitalParticles({
    count: trailControls.trailsNum,
    particleConfig,
  });

  const trail = useTrails({
    nodesPerTrail: trailControls.nodesPerTrail,
    trailsNum: trailControls.trailsNum,
    updateDistanceMin: trailControls.updateDistanceMin,
    shaderPack: DistanceShaderPack,
  });


  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (!trail) return;

    particles.stepUpdate(t, delta);
    trail.update(t, delta, particles.particlesTexture);
  });


  return (
    <>
      {/* Main ribbon visualization */}
      {displayControls.showRibbon && trail.nodeTexture && trail.trailTexture && (
        <Ribbon
          nodeTex={trail.nodeTexture}
          trailTex={trail.trailTexture}
          nodes={trailControls.nodesPerTrail}
          trails={trailControls.trailsNum}
          baseWidth={displayControls.ribbonWidth}
          color={displayControls.ribbonColor}
          materialProps={{ wireframe: displayControls.wireframe, transparent: true }}
        />
      )}

      {/* Debug points for particle positions */}
      {displayControls.showParticlePoints && (
        <ParticleDebugPoints
          particleTexture={particles.particlesTexture}
          count={particles.count}
          size={0.05}
          color="#ff8c42"
        />
      )}
    </>
  );
}
