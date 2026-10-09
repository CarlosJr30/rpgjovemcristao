import type { AudioAsset, MusicContext, SoundEffect } from './audio-assets';
// Validated local pack; rerun the validator after any media change.
export const APPROVED_MUSIC: Readonly<Partial<Record<MusicContext, AudioAsset>>> = {};
export const APPROVED_EFFECTS: Readonly<Partial<Record<SoundEffect, AudioAsset>>> = {};
