// Material providers
import { StandardMaterialProvider } from './StandardMaterialProvider';
import { CustomShaderMaterialProvider } from './CustomShaderMaterialProvider';
export { StandardMaterialProvider, CustomShaderMaterialProvider };
export type { MaterialProvider, StandardMaterialConfig, CustomShaderMaterialConfig, MaterialConfig } from './types';

// Simple material providers map
export const materialProviders = {
  standard: StandardMaterialProvider,
  'custom-shader': CustomShaderMaterialProvider,
} as const;

export type MaterialType = keyof typeof materialProviders;
