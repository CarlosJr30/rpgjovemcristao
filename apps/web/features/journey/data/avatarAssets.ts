export type AvatarGender = 'male' | 'female';
export type RuntimeHair = 'short' | 'long' | 'curly';
export type RuntimeClothing = 'moss' | 'ochre' | 'blue';
export type RuntimeSkin = 'light' | 'medium' | 'dark';
export type AvatarRuntimeSelection = { bodyType: AvatarGender; hair: RuntimeHair; clothing: RuntimeClothing; skin: RuntimeSkin };
const aliases = {
  hair: { curto: 'short', longo: 'long', cacheado: 'curly', short: 'short', long: 'long', curly: 'curly' },
  clothing: { musgo: 'moss', ocre: 'ochre', azul: 'blue', moss: 'moss', ochre: 'ochre', blue: 'blue' },
  skin: { claro: 'light', medio: 'medium', 'médio': 'medium', escuro: 'dark', light: 'light', medium: 'medium', dark: 'dark' },
} as const;
const fallback = (bodyType: AvatarGender) => `/assets/avatar/runtime/${bodyType}/${bodyType}_short_moss_light.png`;
export function getAvatarRuntimeImage(selection: AvatarRuntimeSelection): string {
  const hair = aliases.hair[selection.hair as keyof typeof aliases.hair];
  const clothing = aliases.clothing[selection.clothing as keyof typeof aliases.clothing];
  const skin = aliases.skin[selection.skin as keyof typeof aliases.skin];
  if (!hair || !clothing || !skin || !['male', 'female'].includes(selection.bodyType)) return fallback(selection.bodyType === 'female' ? 'female' : 'male');
  return `/assets/avatar/runtime/${selection.bodyType}/${selection.bodyType}_${hair}_${clothing}_${skin}.png`;
}
export function runtimeSelectionFromAppearance(bodyType: AvatarGender, appearance: { hair: string; outfit: string; skin: string }): AvatarRuntimeSelection {
  return { bodyType, hair: appearance.hair as RuntimeHair, clothing: appearance.outfit as RuntimeClothing, skin: appearance.skin as RuntimeSkin };
}

export { equipmentIcons, equipmentAssetForItem } from './equipmentAssets';
