// Material providers
import { StandardMaterialProvider } from './StandardMaterialProvider';
import { CustomShaderMaterialProvider } from './CustomShaderMaterialProvider';
import { TubeMaterialProvider } from './TubeMaterialProvider';
export { StandardMaterialProvider, CustomShaderMaterialProvider, TubeMaterialProvider };
export type { MaterialProvider, StandardMaterialConfig, CustomShaderMaterialConfig, MaterialConfig } from './types';

// Simple material providers map
export const materialProviders = {
  standard: StandardMaterialProvider,
  'custom-shader': CustomShaderMaterialProvider,
  tube: TubeMaterialProvider,
} as const;

export type MaterialType = keyof typeof materialProviders;
