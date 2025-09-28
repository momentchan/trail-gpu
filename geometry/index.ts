// Geometry providers
import { QuadGeometryProvider } from './QuadGeometryProvider';
export { QuadGeometryProvider };
export type { GeometryProvider, QuadGeometryConfig, TubeGeometryConfig, GeometryConfig } from './types';

// Simple geometry providers map (no registry needed)
export const geometryProviders = {
  quad: QuadGeometryProvider,
  // tube: TubeGeometryProvider, // Will be added later
} as const;

export type GeometryType = keyof typeof geometryProviders;
