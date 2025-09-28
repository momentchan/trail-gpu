import * as THREE from 'three';
import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RibbonProps, TrailGPUError } from './types';
import { geometryProviders, GeometryType } from './geometry';
import { materialProviders, MaterialType } from './materials';

export function Ribbon({
    nodeTex,
    trailTex,
    nodes,
    trails,
    baseWidth = 0.08,
    color = '#8ec5ff',
    geometryType = 'quad',
    geometryConfig = {},
    materialType = 'standard',
    materialConfig = {},
    materialProps = {},
}: RibbonProps) {
    // Validate inputs
    if (!nodeTex || !trailTex) {
        throw new TrailGPUError('Ribbon: nodeTex and trailTex are required');
    }
    
    if (nodes <= 0 || trails <= 0) {
        throw new TrailGPUError('Ribbon: nodes and trails must be greater than 0');
    }
    
    if (baseWidth <= 0) {
        throw new TrailGPUError('Ribbon: baseWidth must be greater than 0');
    }

    // Get geometry provider and create geometry
    const geometryProvider = geometryProviders[geometryType];
    const geometry = useMemo(() => {
        const config = { nodes, trails, ...geometryConfig };
        return geometryProvider.createGeometry(config);
    }, [nodes, trails, geometryConfig, geometryProvider]);

    // Get material provider and create materials
    const materialProvider = materialProviders[materialType];
    const { material, depthMaterial } = useMemo(() => {
        const config = {
            nodeTex,
            trailTex,
            baseWidth,
            nodes,
            trails,
            color,
            materialProps,
            ...materialConfig,
        };
        
        return {
            material: materialProvider.createMaterial(config),
            depthMaterial: materialProvider.createDepthMaterial(config),
        };
    }, [nodeTex, trailTex, baseWidth, nodes, trails, color, materialProps, materialConfig, materialProvider]);

    // Update uniforms each frame
    const { camera } = useThree();
    useFrame(() => {
        const uniforms = {
            uCameraPos: { value: camera.position },
            uTime: { value: performance.now() * 0.001 },
        };
        materialProvider.updateUniforms(material, uniforms);
    });

    return (
        <instancedMesh
            frustumCulled={false}
            customDepthMaterial={depthMaterial}
            geometry={geometry}
            material={material}
            receiveShadow
            castShadow
            args={[geometry, material, trails]}
        />
    );
}