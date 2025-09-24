import * as THREE from 'three';
// Particle System Interfaces and Utilities
// This module provides a clean interface for creating different particle behaviors

export interface ParticleSystem {
  update(timeSec: number, deltaTime: number): void;
  getTexture(): THREE.Texture;
  dispose(): void;
}

export interface ParticleSystemConfig {
  count: number;
  [key: string]: any;
}

// Re-export the main particle class
export { GPUTrailParticles } from '../GPUTrailParticles';

// Re-export particle shaders
export { updateParticlesFrag } from '../shaders';
