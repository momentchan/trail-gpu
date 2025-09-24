import { GPUTrailParticles } from '../GPUTrailParticles';
import { ParticleConfig } from '../types';

// Orbital particle shader - particles orbit around a center point
const orbitalParticleShader = `
precision highp float;

uniform sampler2D uParticlesPrev;
uniform float uTimeSec;
uniform float uDeltaTime;
uniform float uSpeed;
uniform float uRadius;
uniform float uOrbitSpeed;
uniform float uParticleCount;

varying vec2 vUv;

int pixelIndex() {
    float y = vUv.y * float(uParticleCount);
    return int(floor(y));
}

vec4 readParticle(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uParticlesPrev, vec2(0.5, v));
}

void main() {
    int idx = pixelIndex();
    
    vec4 prev = readParticle(idx);
    vec3 pos = prev.xyz;
    float aux = prev.w;
    
    // Calculate orbital motion
    float angle = uTimeSec * uOrbitSpeed + float(idx) * 0.1;
    float radius = uRadius + sin(uTimeSec * 0.5 + float(idx) * 0.2) * 0.5;
    
    // Update position in orbital pattern
    pos.x = cos(angle) * radius;
    pos.y = sin(angle) * radius;
    pos.z = sin(uTimeSec * 0.3 + float(idx) * 0.1) * 0.5;
    
    gl_FragColor = vec4(pos, aux);
}
`;

/**
 * Orbital Particle System
 * Particles that orbit around a center point with varying patterns
 */
export class OrbitalParticles extends GPUTrailParticles {
  constructor(
    count: number,
    config: Partial<ParticleConfig & { radius?: number; orbitSpeed?: number }> = {},
    initialPositions?: Float32Array
  ) {
    // Add orbital-specific uniforms
    const orbitalConfig = {
      ...config,
      radius: config.radius || 2.0,
      orbitSpeed: config.orbitSpeed || 1.0,
    } as any;
    
    super(count, orbitalParticleShader, orbitalConfig, initialPositions);
  }

  setOrbitParams(radius: number, orbitSpeed: number) {
    this.updateConfig({ radius, orbitSpeed } as any);
  }
}
