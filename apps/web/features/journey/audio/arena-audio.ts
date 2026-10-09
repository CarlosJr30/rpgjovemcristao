import { gameAudio } from './audio-manager';
import { ARENA_MIX } from './arena-mix';
export type ArenaSound =
  | 'attack'
  | 'defense'
  | 'focus'
  | 'dodge'
  | 'special'
  | 'impact'
  | 'victory'
  | 'defeat';
/** Semantic integration point; playback stays in the existing singleton/catalog. */
export function emitArenaSound(kind: ArenaSound, abilityId?: string) {
  if (typeof window !== 'undefined')
    window.dispatchEvent(
      new CustomEvent('rpg:arena-sound', { detail: { kind, abilityId } }),
    );
  gameAudio.playEffect(
    kind === 'impact' ? 'player_hit' : kind === 'special' ? 'focus' : kind,
    ARENA_MIX[kind],
  );
}
