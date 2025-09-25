import * as THREE from 'three';
import { RibbonProps, TrailGPUError } from './types';
import { useRibbonGeometry } from './hooks/useRibbonGeometry';
import { useRibbonMaterials } from './hooks/useRibbonMaterials';
import { useRibbonUniforms } from './hooks/useRibbonUniforms';

export function Ribbon({
    nodeTex,
    trailTex,
    nodes,
    trails,
    baseWidth = 0.08,
    color = '#8ec5ff',
    materialProps = {},
    // Custom shader props
    customVertexShader,
    customFragmentShader,
    customUniforms = {},
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

    // Create geometry using custom hook
    const { geometry } = useRibbonGeometry({ nodes, trails });

    // Create materials using custom hook
    const { material, depthMaterial } = useRibbonMaterials({
        nodeTex,
        trailTex,
        baseWidth,
        nodes,
        trails,
        color,
        materialProps,
        customVertexShader,
        customFragmentShader,
        customUniforms,
    });

    // Update uniforms each frame using custom hook
    useRibbonUniforms({ material, nodes, trails });

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