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
          float alpha = particleData.w;
          
          // Debug: Use alpha to create color variation
          vColor = vec3(alpha, alpha, alpha);
          
          // Debug: Make first few particles larger and use different colors
          if (aInstanceId < 3.0) {
            // Make first few particles larger so we can see them
            gl_PointSize = uSize * 10.0;
            // Use different colors for first 3 particles
            if (aInstanceId < 1.0) {
              vColor = vec3(1.0, 0.0, 0.0); // Red
            } else if (aInstanceId < 2.0) {
              vColor = vec3(0.0, 1.0, 0.0); // Green  
            } else {
              vColor = vec3(0.0, 0.0, 1.0); // Blue
            }
          } else {
            vColor = vec3(1.0, 1.0, 0.0); // Yellow for others
          }
          
          // Transform to clip space
          vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          gl_PointSize = uSize * (300.0 / -mvPosition.z);
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
