import { useMemo } from 'react';
import * as THREE from 'three';
import { geometryProviders, GeometryType, GeometryConfig } from '../geometry';

export interface UseRibbonGeometryConfig {
  geometryType: GeometryType;
  geometryConfig: GeometryConfig;
  nodes: number;
  trails: number;
}

export function useRibbonGeometry({
  geometryType,
  geometryConfig,
  nodes,
  trails,
}: UseRibbonGeometryConfig): THREE.InstancedBufferGeometry {
  return useMemo(() => {
    const provider = geometryProviders[geometryType];
    const config = { ...geometryConfig, nodes, trails };
    return provider.createGeometry(config);
  }, [geometryType, geometryConfig, nodes, trails]);
}