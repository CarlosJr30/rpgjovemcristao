import type { Traveler } from '../domain/traveler';
import { resolveAvatarIdentity } from './avatarRuntime';

export type GameplayPortrait = {
  imageUrl: string;
  // Região normalizada da cabeça, convertida pelo resolver à resolução física.
  source: { x: number; y: number; width: number; height: number };
  fallback?: { imageUrl: string; source: GameplayPortrait['source'] };
};

export function getGameplayAvatarPortrait(
  traveler: Pick<Traveler, 'avatar' | 'appearance'>,
): GameplayPortrait {
  const resolved = resolveAvatarIdentity(traveler);
  return {
    imageUrl: resolved.source,
    source: resolved.portrait,
    fallback: {
      imageUrl: resolved.legacySource,
      source: {
        x:
          (resolved.portrait.x * resolved.legacySourceSize.width) /
          resolved.sourceSize.width,
        y:
          (resolved.portrait.y * resolved.legacySourceSize.height) /
          resolved.sourceSize.height,
        width:
          (resolved.portrait.width * resolved.legacySourceSize.width) /
          resolved.sourceSize.width,
        height:
          (resolved.portrait.height * resolved.legacySourceSize.height) /
          resolved.sourceSize.height,
      },
    },
  };
}
