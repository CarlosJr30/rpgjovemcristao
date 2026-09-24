import type { Traveler } from '../domain/traveler';
import { getAvatarRuntimeImage, runtimeSelectionFromAppearance } from './avatarAssets';

export type GameplayPortrait = {
  imageUrl: string;
  // Todos os sprites runtime auditados medem 512 × 768. Região da cabeça e cabelo.
  source: { x: number; y: number; width: number; height: number };
};

export function getGameplayAvatarPortrait(traveler: Pick<Traveler, 'avatar' | 'appearance'>): GameplayPortrait {
  return {
    imageUrl: getAvatarRuntimeImage(runtimeSelectionFromAppearance(traveler.avatar.gender, traveler.appearance)),
    source: { x: 150, y: 0, width: 212, height: 205 },
  };
}
