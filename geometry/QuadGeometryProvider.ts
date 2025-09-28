import * as THREE from 'three';
import { GeometryProvider, QuadGeometryConfig } from './types';
import { TrailGPUError } from '../types';

export const QuadGeometryProvider: GeometryProvider = {
  name: 'quad',
  
  createGeometry(config: QuadGeometryConfig): THREE.InstancedBufferGeometry {
    const { nodes, trails } = config;
    
    // Validate inputs
    if (nodes <= 0) {
      throw new TrailGPUError('QuadGeometryProvider: nodes must be greater than 0');
    }
    if (trails <= 0) {
      throw new TrailGPUError('QuadGeometryProvider: trails must be greater than 0');
    }
    
    const geometry = new THREE.InstancedBufferGeometry();

    // Create segment attributes (existing logic from useRibbonGeometry)
    const segmentArray = new Float32Array(nodes * 2);
    const sideArray = new Float32Array(nodes * 2);
    const uvArray = new Float32Array(nodes * 4); // 2 UV coordinates per vertex

    for (let i = 0; i < nodes; i++) {
      segmentArray[i * 2] = i;      // First vertex of segment
      segmentArray[i * 2 + 1] = i;  // Second vertex of segment
      sideArray[i * 2] = -1;        // Left side
      sideArray[i * 2 + 1] = 1;     // Right side

      // UV coordinates: U along trail length (0 to 1), V across ribbon width (0 to 1)
      const u = i / (nodes - 1); // Normalize along trail length
      uvArray[i * 4] = u;        // Left vertex U
      uvArray[i * 4 + 1] = 0.0;  // Left vertex V
      uvArray[i * 4 + 2] = u;    // Right vertex U
      uvArray[i * 4 + 3] = 1.0;  // Right vertex V
    }

    geometry.setAttribute('aSeg', new THREE.BufferAttribute(segmentArray, 1));
    geometry.setAttribute('aSide', new THREE.BufferAttribute(sideArray, 1));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));

    // Create triangle indices (existing logic)
    const indices: number[] = [];
    for (let i = 0; i < nodes - 1; i++) {
      const a = i * 2;      // Left vertex of current segment
      const b = i * 2 + 1;  // Right vertex of current segment
      const c = (i + 1) * 2;      // Left vertex of next segment
      const d = (i + 1) * 2 + 1;  // Right vertex of next segment

      // Two triangles per quad
      indices.push(a, b, c);  // First triangle
      indices.push(b, d, c);  // Second triangle
    }
    geometry.setIndex(indices);

    // Create trail instance attribute
    const trailArray = new Float32Array(trails);
    for (let t = 0; t < trails; t++) {
      trailArray[t] = t;
    }
    geometry.setAttribute('aTrail', new THREE.InstancedBufferAttribute(trailArray, 1));

    // Set large bounding sphere to avoid culling issues
    geometry.computeBoundingSphere = () => {
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    };

    return geometry;
  },
  
  getRequiredAttributes(): string[] {
    return ['aSeg', 'aSide', 'aTrail'];
  },
  
  getShaderDefines(): Record<string, string | number> {
    return {
      GEOMETRY_TYPE_QUAD: 1,
      VERTICES_PER_SEGMENT: 2
    };
  }
};
