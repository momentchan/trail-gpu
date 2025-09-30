// Material providers
import { StandardMaterialProvider } from './StandardMaterialProvider';
import { TubeMaterialProvider } from './TubeMaterialProvider';
export { StandardMaterialProvider, TubeMaterialProvider };
export type { MaterialProvider, MaterialConfig, TubeMaterialConfig } from './types';

// Simple material providers map
export const materialProviders = {
  standard: StandardMaterialProvider,
  tube: TubeMaterialProvider,
} as const;

export type MaterialType = keyof typeof materialProviders;
