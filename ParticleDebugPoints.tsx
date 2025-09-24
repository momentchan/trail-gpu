import * as THREE from 'three';
import { useMemo } from 'react';

export interface ParticleDebugPointsProps {
  particleTexture: THREE.Texture;
  count: number;
  size?: number;
  color?: string;
}

export function ParticleDebugPoints({
  particleTexture,
  count,
  size = 0.05,
  color = '#ff6b6b',
}: ParticleDebugPointsProps) {
  // Create instanced geometry for particles
  const geometry = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry();
    
    // Create a simple point geometry
    const positions = new Float32Array([0, 0, 0]);
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create instance attributes
    const instanceIds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      instanceIds[i] = i;
    }
    g.setAttribute('aInstanceId', new THREE.InstancedBufferAttribute(instanceIds, 1));
    
    g.instanceCount = count;
    
    return g;
  }, [count]);

  // Create shader material that reads from the particle texture
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uParticleTexture: { value: particleTexture },
        uParticleCount: { value: count },
        uSize: { value: size },
        uColor: { value: new THREE.Color(color) },
      },
      vertexShader: `
        attribute float aInstanceId;
        uniform sampler2D uParticleTexture;
        uniform float uParticleCount;
        uniform float uSize;
        
        varying vec3 vColor;
        
        void main() {
          // Read particle position from texture
          float v = (aInstanceId + 0.5) / uParticleCount;
          vec4 particleData = texture2D(uParticleTexture, vec2(0.5, v));
          
          // Extract position
          vec3 worldPos = particleData.xyz;
          
          // Transform to clip space
          vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Set point size
          gl_PointSize = uSize * (300.0 / -mvPosition.z);
          
          // Pass color
          vColor = vec3(1.0, 0.0, 0.0); // Red color for particles
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform vec3 uColor;
        
        void main() {
          gl_FragColor = vec4(uColor, 1.0);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
  }, [particleTexture, count, size, color]);

  return (
    <points geometry={geometry} material={material} />
  );
}