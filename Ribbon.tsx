import * as THREE from 'three';
import { useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RibbonProps } from './types';
import { SHADER_CONSTANTS } from './shaders';

export function Ribbon({
  nodeTex,
  trailTex,
  nodes,
  trails,
  baseWidth = 0.08,
  color = '#8ec5ff',
  wireframe = true,
  transparent = true,
  // Custom shader props
  customVertexShader,
  customFragmentShader,
  customUniforms = {},
}: RibbonProps) {
  const { camera } = useThree();

  // Create geometry with proper instancing
  const geometry = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry();

    // Create segment attributes
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

    g.setAttribute('aSeg', new THREE.BufferAttribute(segmentArray, 1));
    g.setAttribute('aSide', new THREE.BufferAttribute(sideArray, 1));
    g.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));

    // Create triangle indices
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
    g.setIndex(indices);

    // Create trail instance attribute
    const trailArray = new Float32Array(trails);
    for (let t = 0; t < trails; t++) {
      trailArray[t] = t;
    }
    g.setAttribute('aTrail', new THREE.InstancedBufferAttribute(trailArray, 1));
    
    g.instanceCount = trails;
    
    // Set large bounding sphere to avoid culling issues
    g.computeBoundingSphere = () => {
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    };

    return g;
  }, [nodes, trails]);

  // Create material with proper uniforms
  const material = useMemo(() => {
    const colorObj = new THREE.Color(color);
    
    // Base uniforms that are always needed
    const baseUniforms = {
      uNodeTex: { value: nodeTex },
      uTrailTex: { value: trailTex },
      uBaseWidth: { value: baseWidth },
      uNodes: { value: nodes },
      uTrails: { value: trails },
      uCameraPos: { value: new THREE.Vector3() },
      uColor: { value: colorObj },
      uTime: { value: 0 },
      uDebug: { value: 0 },
    };

    // Merge base uniforms with custom uniforms
    const uniforms = {
      ...baseUniforms,
      ...customUniforms,
    };

    // Use custom shaders or fallback to defaults
    const vertexShader = customVertexShader || SHADER_CONSTANTS.RIBBON_VERTEX;
    const fragmentShader = customFragmentShader || SHADER_CONSTANTS.RIBBON_FRAGMENT;
    
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent,
      wireframe,
      depthWrite: false,
    });
  }, [nodeTex, trailTex, baseWidth, nodes, trails, color, transparent, wireframe, 
      customVertexShader, customFragmentShader, customUniforms]);

  // Update uniforms each frame
  const updateUniforms = useCallback(() => {
    material.uniforms.uCameraPos.value.copy(camera.position);
    material.uniforms.uNodes.value = nodes;
    material.uniforms.uTrails.value = trails;
    material.uniforms.uTime.value = performance.now() * 0.001; // Convert to seconds
  }, [material, camera, nodes, trails]);

  useFrame(updateUniforms);

  return (
    <mesh 
      frustumCulled={false} 
      geometry={geometry} 
      material={material}
    />
  );
}