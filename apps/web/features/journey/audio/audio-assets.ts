export type MusicContext =
  | 'menu'
  | 'garden'
  | 'tower'
  | 'boss'
  | 'reward'
  | 'ebd'
  | `world:${'origins' | 'patriarchs' | 'liberation' | 'promised-land' | 'kings' | 'return' | 'jesus' | 'church' | 'new-creation'}`
  | 'journey'
  | 'exploration'
  | 'snake'
  | 'arena'
  | 'guild'
  | 'devotional'
  | 'quiz';
export type SoundEffect =
  | 'chest_common'
  | 'chest_uncommon'
  | 'chest_rare'
  | 'chest_epic'
  | 'chest_extraordinary'
  | 'ui'
  | 'attack'
  | 'defense'
  | 'focus'
  | 'dodge'
  | 'reward'
  | 'levelUp'
  | 'chest'
  | 'equipment'
  | 'objective'
  | 'guildApproval'
  | 'serpent_near'
  | 'serpent_attack'
  | 'pickup_light'
  | 'pickup_fragment'
  | 'pickup_powerup'
  | 'portal_open'
  | 'player_hit'
  | 'victory'
  | 'defeat';
export type AudioAsset = Readonly<{
  src: string;
  license: string;
  fallbackSrc?: string;
  loop?: boolean;
  defaultVolume?: number;
}>;
// Production always uses the production auditor's catalog. The separate Suno
// Free prototype catalog is compiled out outside development.
export const MUSIC_ASSETS: Readonly<Partial<Record<MusicContext, AudioAsset>>> =
  process.env.NODE_ENV === 'development'
    ? { ...APPROVED_MUSIC, ...PROTOTYPE_ARENA_MUSIC }
    : APPROVED_MUSIC;
export const SOUND_ASSETS: Readonly<Partial<Record<SoundEffect, AudioAsset>>> =
  APPROVED_EFFECTS;
// These effects may only be selected by AudioManager in the Arena context.
export const ARENA_PROTOTYPE_EFFECTS = PROTOTYPE_ARENA_EFFECTS;
export function isApprovedAudioAsset(asset: AudioAsset) {
  return (
    /^\/assets\/audio\/[a-zA-Z0-9/_-]{1,180}\.(mp3|ogg|wav|m4a)$/.test(
      asset.src,
    ) &&
    asset.license.trim().length > 0 &&
    (!asset.fallbackSrc ||
      /^\/assets\/audio\/[a-zA-Z0-9/_-]{1,180}\.mp3$/.test(asset.fallbackSrc))
  );
}
import { APPROVED_MUSIC, APPROVED_EFFECTS } from './approved-audio-assets';
import {
  PROTOTYPE_ARENA_MUSIC,
  PROTOTYPE_ARENA_EFFECTS,
} from '../dev/prototype-arena-audio-assets';
