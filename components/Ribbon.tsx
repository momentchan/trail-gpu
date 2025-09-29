import * as THREE from 'three';
import { RibbonProps, TrailGPUError } from '../types';

export function Ribbon({
    geometry,
    material,
    depthMaterial,
    trails,
    receiveShadow = true,
    castShadow = true,
    frustumCulled = false,
}: RibbonProps) {
    // Validate inputs
    if (!geometry) {
        throw new TrailGPUError('Ribbon: geometry is required');
    }
    
    if (!material) {
        // Return null if material isn't ready yet (textures not loaded)
        return null;
    }
    
    if (trails <= 0) {
        throw new TrailGPUError('Ribbon: trails must be greater than 0');
    }

    return (
        <instancedMesh
            frustumCulled={frustumCulled}
            customDepthMaterial={depthMaterial || undefined}
            geometry={geometry}
            material={material}
            receiveShadow={receiveShadow}
            castShadow={castShadow}
            args={[geometry, material, trails]}
        />
    );
}
