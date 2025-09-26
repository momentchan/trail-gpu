import { GPUTrailParticles } from '../GPUTrailParticles';
import { ParticleConfig } from '../types';
import { updateParticlesFrag } from '../shaders';

/**
 * Flow Field Particle System
 * Particles that move through a 3D noise-based flow field
 */
export class FlowFieldParticles extends GPUTrailParticles {
  constructor(
    count: number,
    config: Partial<ParticleConfig> = {},
    initialPositions?: Float32Array
  ) {
    super(count, updateParticlesFrag, config, initialPositions);
  }

  // Override to add flow field specific methods
  setFlowFieldParams(speed: number, noiseScale: number, timeScale: number) {
    this.updateUniforms({ speed, noiseScale, timeScale });
  }
}
