// Geometry providers
import { QuadGeometryProvider } from './QuadGeometryProvider';
import { TubeGeometryProvider } from './TubeGeometryProvider';
export { QuadGeometryProvider, TubeGeometryProvider };
export type { GeometryProvider, QuadGeometryConfig, TubeGeometryConfig, GeometryConfig } from './types';

// Simple geometry providers map (no registry needed)
export const geometryProviders = {
  quad: QuadGeometryProvider,
  tube: TubeGeometryProvider,
} as const;

export type GeometryType = keyof typeof geometryProviders;
