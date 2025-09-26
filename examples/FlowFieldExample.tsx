'use client';

import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ParticleConfig, ParticleDebugPoints, Ribbon, useFlowFieldParticles, useTrails } from '..';
import { useControls } from 'leva';
import { DistanceShaderPack } from '../shaders/packs/distance';

export default function FlowFieldExampleNew() {
  const trailControls = useControls('Trail System', {
    nodesPerTrail: { value: 60, min: 10, max: 200, step: 1 },
    trailsNum: { value: 100, min: 10, max: 500, step: 1 },
    updateDistanceMin: { value: 0.05, min: 0.01, max: 0.5, step: 0.01 },
  });

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
    wireframe: { value: false },
  });

  const particleConfig: ParticleConfig = useMemo(() => ({
    count: trailControls.trailsNum,
    speed: particleControls.speed,
    noiseScale: particleControls.noiseScale,
    timeScale: particleControls.timeScale,
  }), [trailControls.trailsNum, particleControls]);

  const { particles } = useFlowFieldParticles({
    count: trailControls.trailsNum,
    particleConfig,
  });


  const config = useMemo(() => ({
    nodesPerTrail: trailControls.nodesPerTrail,
    trailsNum: trailControls.trailsNum,
    updateDistanceMin: trailControls.updateDistanceMin,
    shaderPack: DistanceShaderPack,
  }), [trailControls.nodesPerTrail, trailControls.trailsNum, trailControls.updateDistanceMin]);

  const trail = useTrails(config);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (!trail) return;

    particles.stepUpdate(t, delta);
    trail.update(t, delta, particles.particlesTexture);
  });

  return (
    <>
      {trail.nodeTexture && trail.trailTexture ? (
        <Ribbon
          nodeTex={trail.nodeTexture}
          trailTex={trail.trailTexture}
          nodes={trailControls.nodesPerTrail}
          trails={trailControls.trailsNum}
          baseWidth={0.01}
          materialProps={{ wireframe: true, transparent: false }}
        />
      ) : null}

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
