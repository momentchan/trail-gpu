import { useMemo } from 'react';
import * as THREE from 'three';
import { geometryProviders, GeometryType, GeometryConfig } from '../geometry';

export interface UseRibbonGeometryConfig {
  geometryType: GeometryType;
  geometryConfig: GeometryConfig;
}

export function useRibbonGeometry({
  geometryType,
  geometryConfig,
}: UseRibbonGeometryConfig): THREE.InstancedBufferGeometry {
  return useMemo(() => {
    const provider = geometryProviders[geometryType];
    return provider.createGeometry(geometryConfig);
  }, [geometryType, geometryConfig]);
}