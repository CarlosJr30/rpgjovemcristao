import {
  createArenaBattle,
  arenaSpecials,
  type ArenaSpecialId,
  type BattleState,
} from '@rpg/game-engine';
import { createTraveler } from '../domain/traveler';
import { TRAINING_OPPONENTS, travelerBattleSnapshot } from '../data/arena';
import type { BattleFeedback } from '../data/battlePresentation';
import { arenaEventTiming } from '../data/arenaPresentation';

export const LAB_STATES = [
  'idle',
  'attack',
  'defend',
  'dodge',
  'special',
  'hit',
  'victory',
  'defeat',
  'unlock',
  'buffs',
] as const;
export type LabState = (typeof LAB_STATES)[number];
export const LAB_TRAVELER = {
  ...createTraveler(
    'Viajante DEV',
    { hair: 'curto', outfit: 'musgo', skin: 'medio' },
    'arena-dev-fixture',
    '2026-10-05T12:00:00.000Z',
  ),
  level: 8,
};
export function arenaLabFixture(
  opponentIndex: number,
  state: LabState,
  ability: ArenaSpecialId | 'basic',
  focus: number,
  requestedSide: 'player' | 'opponent' = 'player',
) {
  const finished =
    state === 'victory' || state === 'defeat' || state === 'unlock';
  const side = finished
    ? state === 'defeat'
      ? 'opponent'
      : 'player'
    : requestedSide;
  const opponent = TRAINING_OPPONENTS[Math.min(3, Math.max(0, opponentIndex))];
  const initial = createArenaBattle(
    travelerBattleSnapshot(LAB_TRAVELER),
    opponent,
    41,
    'arena-dev-fixture',
  );
  const before: BattleState = {
    ...initial,
    player: { ...initial.player, focusPoints: focus },
    opponent: { ...initial.opponent, focusPoints: focus },
  };
  const targetSide = side === 'player' ? 'opponent' : 'player';
  const actor = before[side],
    target = before[targetSide];
  const special =
    state === 'special'
      ? arenaSpecials.find((s) => s.id === ability)
      : undefined;
  const kind: BattleFeedback['kind'] =
    state === 'defend'
      ? 'defend'
      : state === 'dodge'
        ? 'dodge'
        : state === 'special' && ability === 'steadfast-guard'
          ? 'defend'
          : state === 'special' && ability !== 'path-strike'
            ? 'focus'
            : 'attack';
  const damage =
    state === 'dodge'
      ? 0
      : kind === 'attack'
        ? finished
          ? target.hp
          : 12
        : undefined;
  const recipient =
    state === 'hit'
      ? side
      : kind === 'defend' || kind === 'focus'
        ? side
        : targetSide;
  const source = state === 'hit' ? target : actor;
  const recipientFighter = before[recipient];
  const previewActor = {
    focusPoints: special
      ? Math.max(0, focus - special.focusCost)
      : Math.min(3, focus + 1),
    guard:
      kind === 'defend'
        ? special
          ? ('fortified' as const)
          : ('basic' as const)
        : null,
    tacticalMultiplier: special?.id === 'discernment' ? 1.2 : 1,
    mobilityReady: special?.id === 'pilgrim-step',
  };
  const label =
    special?.name ??
    (state === 'dodge' ? 'ESQUIVOU' : state === 'defend' ? 'DEFESA' : 'ATAQUE');
  const event: BattleFeedback = {
    id: 'dev-preview',
    actorId: source.snapshot.id,
    targetId: recipientFighter.snapshot.id,
    kind,
    label,
    value:
      damage === 0
        ? 'ESQUIVOU'
        : damage
          ? `−${damage} VIDA`
          : kind === 'defend'
            ? 'DEFESA'
            : special?.id === 'pilgrim-step'
              ? 'Mobilidade preparada'
              : 'Vantagem preparada',
    amount: damage,
    description: `DEV FIXTURE · ${source.snapshot.name} → ${recipientFighter.snapshot.name} · ${label}`,
    defended: state === 'hit',
    specialId: special?.id,
    focusAfter: previewActor.focusPoints,
    focusDelta: !special && focus < 3 ? 1 : 0,
    fighterState: previewActor,
    duration: arenaEventTiming(source.snapshot.arenaProfile, Boolean(special))
      .duration,
  };
  const winnerId =
    state === 'defeat'
      ? before.opponent.snapshot.id
      : before.player.snapshot.id;
  const after: BattleState = {
    ...before,
    [state === 'hit' ? targetSide : side]: { ...source, ...previewActor },
    [recipient]: {
      ...recipientFighter,
      ...(recipient === side && state !== 'hit' ? previewActor : {}),
      hp:
        damage !== undefined
          ? Math.max(0, recipientFighter.hp - damage)
          : recipientFighter.hp,
    },
    status: finished ? 'finished' : 'in_progress',
    winnerId: finished ? winnerId : null,
    loserId: finished ? recipientFighter.snapshot.id : null,
  };
  return {
    before,
    after:
      state === 'buffs'
        ? {
            ...before,
            player: {
              ...before.player,
              guard: 'fortified' as const,
              tacticalMultiplier: 1.2,
              mobilityReady: true,
              usedEffects: ['path-sword' as const, 'prudence-amulet' as const],
            },
          }
        : state === 'idle'
          ? { ...before }
          : after,
    events: state === 'idle' || state === 'buffs' ? [] : [event],
    result: finished
      ? state === 'defeat'
        ? ('defeat' as const)
        : ('victory' as const)
      : undefined,
  };
}
