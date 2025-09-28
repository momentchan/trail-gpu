import * as THREE from 'three';
import { GeometryProvider, TubeGeometryConfig } from './types';

export const TubeGeometryProvider: GeometryProvider = {
  name: 'tube',
  
  createGeometry(config: TubeGeometryConfig): THREE.InstancedBufferGeometry {
    const { nodes, trails, segments = 8, capStart = false, capEnd = false } = config;
    const geometry = new THREE.InstancedBufferGeometry();
    
    // Calculate total vertices
    let totalVertices = nodes * segments;
    if (capStart) totalVertices += segments + 1; // +1 for center vertex
    if (capEnd) totalVertices += segments + 1; // +1 for center vertex
    
    // Create attributes
    const segmentArray = new Float32Array(totalVertices);
    const radialArray = new Float32Array(totalVertices);
    const normalArray = new Float32Array(totalVertices * 3);
    const uvArray = new Float32Array(totalVertices * 2);
    
    let vertexIndex = 0;
    
    // Main tube vertices
    for (let node = 0; node < nodes; node++) {
      for (let radial = 0; radial < segments; radial++) {
        segmentArray[vertexIndex] = node;
        radialArray[vertexIndex] = radial;
        
        // Calculate normal (points outward from tube center)
        const angle = (radial / segments) * 2 * Math.PI;
        normalArray[vertexIndex * 3] = Math.cos(angle);
        normalArray[vertexIndex * 3 + 1] = 0;
        normalArray[vertexIndex * 3 + 2] = Math.sin(angle);
        
        // UV coordinates
        uvArray[vertexIndex * 2] = node / (nodes - 1);
        uvArray[vertexIndex * 2 + 1] = radial / segments;
        
        vertexIndex++;
      }
    }
    
    // Start cap vertices
    if (capStart) {
      // Cap rim vertices
      for (let radial = 0; radial < segments; radial++) {
        segmentArray[vertexIndex] = -1; // Special value for cap
        radialArray[vertexIndex] = radial;
        
        const angle = (radial / segments) * 2 * Math.PI;
        normalArray[vertexIndex * 3] = -1; // Points backward
        normalArray[vertexIndex * 3 + 1] = 0;
        normalArray[vertexIndex * 3 + 2] = 0;
        
        uvArray[vertexIndex * 2] = 0.5;
        uvArray[vertexIndex * 2 + 1] = 0.5;
        
        vertexIndex++;
      }
      
      // Cap center vertex
      segmentArray[vertexIndex] = -1;
      radialArray[vertexIndex] = -1;
      normalArray[vertexIndex * 3] = -1;
      normalArray[vertexIndex * 3 + 1] = 0;
      normalArray[vertexIndex * 3 + 2] = 0;
      uvArray[vertexIndex * 2] = 0.5;
      uvArray[vertexIndex * 2 + 1] = 0.5;
      vertexIndex++;
    }
    
    // End cap vertices
    if (capEnd) {
      // Cap rim vertices
      for (let radial = 0; radial < segments; radial++) {
        segmentArray[vertexIndex] = nodes; // Special value for cap
        radialArray[vertexIndex] = radial;
        
        const angle = (radial / segments) * 2 * Math.PI;
        normalArray[vertexIndex * 3] = 1; // Points forward
        normalArray[vertexIndex * 3 + 1] = 0;
        normalArray[vertexIndex * 3 + 2] = 0;
        
        uvArray[vertexIndex * 2] = 0.5;
        uvArray[vertexIndex * 2 + 1] = 0.5;
        
        vertexIndex++;
      }
      
      // Cap center vertex
      segmentArray[vertexIndex] = nodes;
      radialArray[vertexIndex] = -1;
      normalArray[vertexIndex * 3] = 1;
      normalArray[vertexIndex * 3 + 1] = 0;
      normalArray[vertexIndex * 3 + 2] = 0;
      uvArray[vertexIndex * 2] = 0.5;
      uvArray[vertexIndex * 2 + 1] = 0.5;
      vertexIndex++;
    }

    // Create triangle indices for tube
    const indices: number[] = [];
    
    // Main tube triangles
    for (let node = 0; node < nodes - 1; node++) {
      for (let radial = 0; radial < segments; radial++) {
        const current = node * segments + radial;
        const next = node * segments + ((radial + 1) % segments);
        const currentNext = (node + 1) * segments + radial;
        const nextNext = (node + 1) * segments + ((radial + 1) % segments);
        
        // Two triangles per quad
        indices.push(current, next, currentNext);
        indices.push(next, nextNext, currentNext);
      }
    }
    
    // Start cap indices
    if (capStart) {
      const startCapOffset = nodes * segments;
      const centerVertex = startCapOffset + segments;
      for (let radial = 0; radial < segments; radial++) {
        const next = (radial + 1) % segments;
        indices.push(startCapOffset + radial, startCapOffset + next, centerVertex);
      }
    }
    
    // End cap indices
    if (capEnd) {
      const endCapOffset = nodes * segments + (capStart ? segments + 1 : 0);
      const centerVertex = endCapOffset + segments;
      for (let radial = 0; radial < segments; radial++) {
        const next = (radial + 1) % segments;
        indices.push(endCapOffset + radial, centerVertex, endCapOffset + next);
      }
    }
    
    geometry.setIndex(indices);

    geometry.setAttribute('aSeg', new THREE.BufferAttribute(segmentArray, 1));
    geometry.setAttribute('aRadial', new THREE.BufferAttribute(radialArray, 1));
    geometry.setAttribute('aNormal', new THREE.BufferAttribute(normalArray, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));

    // Create trail instance attribute
    const trailArray = new Float32Array(trails);
    for (let t = 0; t < trails; t++) {
      trailArray[t] = t;
    }
    geometry.setAttribute('aTrail', new THREE.InstancedBufferAttribute(trailArray, 1));

    // Disable frustum culling for performance
    geometry.computeBoundingSphere = () => {
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    };

    return geometry;
  },
  
  getRequiredAttributes(): string[] {
    return ['aSeg', 'aRadial', 'aNormal', 'aTrail'];
  },
  
  getShaderDefines(): Record<string, string | number> {
    return {
      GEOMETRY_TYPE_TUBE: 1,
      VERTICES_PER_SEGMENT: 8, // configurable
      TUBE_SEGMENTS: 8
    };
  }
};