import { arenaEventTiming } from './arenaPresentation';
import {
  equipmentEffects,
  arenaSpecials,
  type BattleState,
  type ArenaSpecialId,
  type BattlePresentationState,
} from '@rpg/game-engine';

export type BattleFeedback = {
  id: string;
  actorId: string;
  targetId: string;
  kind: 'attack' | 'defend' | 'focus' | 'dodge' | 'effect';
  label: string;
  value: string;
  amount?: number;
  description: string;
  defended: boolean;
  specialId?: ArenaSpecialId;
  focusAfter?: number;
  focusDelta?: number;
  duration?: number;
  fighterState?: BattlePresentationState;
  targetState?: BattlePresentationState;
};

/** Adapt the current engine's log; damage actor is the attacker, effect actor its recipient. */
export function battleFeedback(
  before: BattleState,
  after: BattleState,
): BattleFeedback[] {
  const entries = after.log.slice(before.log.length);
  const names = new Map(
    [before.player, before.opponent].map((fighter) => [
      fighter.snapshot.id,
      fighter.snapshot.name,
    ]),
  );
  const defending = new Set(
    entries
      .filter(
        (entry) =>
          entry.message.endsWith('Defender.') ||
          entry.message.includes('usou Guarda Perseverante.'),
      )
      .map((entry) => entry.actorId),
  );
  const abilities = new Map<string, string>();
  return entries.flatMap((entry, index): BattleFeedback[] => {
    if (
      entry.effectType === 'ACTIVE' &&
      entry.message.endsWith('do equipamento reforçou a ação.')
    )
      return [];
    if (entry.presentation) {
      const special = arenaSpecials.find(
        (special) => special.id === entry.specialId,
      );
      const actor =
        entry.actorId === before.player.snapshot.id
          ? before.player
          : before.opponent;
      const targetId = entry.targetId ?? entry.actorId;
      const value =
        entry.kind === 'damage'
          ? entry.amount === 0
            ? 'ESQUIVOU!'
            : `−${entry.amount} VIDA${entry.defended ? ' · DEFESA' : ''}`
          : entry.focusDelta
            ? `+${entry.focusDelta} FOCO`
            : special?.id === 'steadfast-guard'
              ? '+DEFESA'
              : special?.id === 'pilgrim-step'
                ? 'Mobilidade preparada'
                : 'Vantagem preparada';
      const label =
        special?.name ??
        (entry.presentation === 'attack'
          ? 'ATAQUE'
          : entry.presentation === 'defend'
            ? 'DEFESA!'
            : entry.presentation === 'dodge'
              ? 'ESQUIVOU!'
              : 'FOCO');
      return [
        {
          id: `${before.id}-${before.round}-${index}`,
          actorId: entry.actorId,
          targetId,
          kind: entry.presentation,
          label,
          value,
          amount: entry.kind === 'damage' ? entry.amount : undefined,
          description:
            entry.kind === 'damage'
              ? `${names.get(entry.actorId)} → ${names.get(targetId)} · ${label} · ${value}${entry.focusDelta ? ` · +${entry.focusDelta} FOCO` : ''}`
              : entry.message,
          defended: Boolean(entry.defended),
          specialId: entry.specialId,
          focusAfter: entry.focusAfter,
          focusDelta: entry.focusDelta,
          fighterState: entry.fighterState,
          targetState: entry.targetState,
          duration: arenaEventTiming(
            actor.snapshot.arenaProfile,
            Boolean(special),
          ).duration,
        },
      ];
    }
    if (
      entry.kind === 'result' ||
      entry.message.endsWith('Atacar.') ||
      entry.message.endsWith('Defender.') ||
      entry.message.endsWith('Focar.') ||
      entry.message.endsWith('Habilidade.')
    )
      return [];
    const targetId =
      entry.kind === 'damage'
        ? entry.actorId === before.player.snapshot.id
          ? before.opponent.snapshot.id
          : before.player.snapshot.id
        : entry.actorId;
    let kind: BattleFeedback['kind'] = 'effect';
    let label = 'EFEITO';
    let value = '';
    if (entry.kind === 'damage') {
      kind = entry.amount === 0 ? 'dodge' : 'attack';
      label =
        entry.amount === 0
          ? 'ESQUIVA!'
          : (abilities.get(entry.actorId) ?? 'ATAQUE');
      value =
        entry.amount === 0 ? 'Golpe evitado' : `−${entry.amount ?? 0} VIDA`;
    } else if (entry.message.includes('postura defensiva')) {
      kind = 'defend';
      label = 'DEFESA!';
      value = 'Proteção nesta rodada';
    } else if (entry.message.includes('concentrou-se')) {
      kind = 'focus';
      label = 'FOCO';
      value = 'Próxima ação fortalecida';
    } else {
      const effect = Object.values(equipmentEffects).find((effect) =>
        entry.message.includes(effect.name),
      );
      label = effect?.name ?? 'Espada do Caminho';
      if (effect?.id === 'path-sword') {
        abilities.set(entry.actorId, effect.name);
        return [];
      }
      if (effect?.id === 'pilgrim-boots') return []; // The following zero-damage entry presents the dodge on the defender.
      if (effect?.id === 'steadfast-shield') {
        kind = 'defend';
        value = 'Guarda reforçada';
      }
      if (effect?.id === 'prudence-amulet') {
        kind = 'focus';
        value = 'Foco ampliado';
      }
    }
    return [
      {
        id: `${before.id}-${before.round}-${index}`,
        actorId: entry.actorId,
        targetId,
        kind,
        label,
        value,
        amount: entry.kind === 'damage' ? entry.amount : undefined,
        defended: entry.kind === 'damage' && defending.has(targetId),
        description:
          entry.kind === 'damage'
            ? `${names.get(entry.actorId)} → ${names.get(targetId)} · ${label} · ${value}`
            : entry.message,
      },
    ];
  });
}
