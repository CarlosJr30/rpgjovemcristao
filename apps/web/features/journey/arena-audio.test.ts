// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { emitArenaSound, type ArenaSound } from './audio/arena-audio';
import { gameAudio } from './audio/audio-manager';
afterEach(() => vi.restoreAllMocks());
test.each([
  ['attack', 'attack', 0.75],
  ['defense', 'defense', 0.8],
  ['focus', 'focus', 0.5],
  ['dodge', 'dodge', 0.6],
  ['special', 'focus', 0.65],
  ['impact', 'player_hit', 0.9],
  ['victory', 'victory', 0.8],
  ['defeat', 'defeat', 0.6],
] as const)(
  'evento %s solicita uma única reprodução no binding existente',
  (kind, effect, gain) => {
    const playback = vi
      .spyOn(gameAudio, 'playEffect')
      .mockImplementation(() => undefined);
    const listener = vi.fn();
    window.addEventListener('rpg:arena-sound', listener);
    emitArenaSound(
      kind as ArenaSound,
      kind === 'special' ? 'path-strike' : undefined,
    );
    window.removeEventListener('rpg:arena-sound', listener);
    expect(listener).toHaveBeenCalledOnce();
    expect(playback).toHaveBeenCalledExactlyOnceWith(effect, gain);
  },
);
