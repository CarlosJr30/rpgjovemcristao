import {
  battleBalanceConfig,
  calculateDamage,
  calculateInitiative,
  createBattle,
  equipmentEffects,
  seededUnit,
  type ArenaSpecialId,
  type ArenaProfile,
  type BattleState,
  type BattleFighterState,
  type BattleParticipantSnapshot,
  type BattleLogEntry,
  type BattleEffectId,
} from './index';

export type ArenaAction = 'attack' | 'defend' | `special:${ArenaSpecialId}`;
export type ArenaSpecial = Readonly<{
  id: ArenaSpecialId;
  name: string;
  description: string;
  type: 'OFFENSIVE' | 'DEFENSIVE' | 'TACTICAL';
  focusCost: number;
  minimumLevel: number;
  effects: readonly ('damage' | 'guard' | 'insight' | 'mobility')[];
  tags: readonly string[];
  visual: Readonly<{
    icon: string;
    motion: 'strike' | 'guard' | 'insight' | 'step';
    accent: string;
  }>;
}>;
export const arenaCombatConfig = Object.freeze({
  maximumFocus: 3,
  initialFocus: 0,
  attackFocus: 1,
  defendFocus: 1,
  maximumSpecialSlots: 4,
  strikeMultiplier: 1.45,
  agileDodgeChance: 0.12,
});
export const arenaSpecials: readonly ArenaSpecial[] = Object.freeze([
  {
    id: 'path-strike',
    name: 'Golpe do Caminho',
    description: 'Golpe mais forte, com os atributos e efeitos da sua arma.',
    type: 'OFFENSIVE',
    focusCost: 2,
    minimumLevel: 2,
    effects: ['damage'],
    tags: ['attack', 'light'],
    visual: { icon: '⚔', motion: 'strike', accent: 'gold' },
  },
  {
    id: 'steadfast-guard',
    name: 'Guarda Perseverante',
    description: 'Reduz fortemente o próximo golpe recebido.',
    type: 'DEFENSIVE',
    focusCost: 2,
    minimumLevel: 4,
    effects: ['guard'],
    tags: ['defense'],
    visual: { icon: '◈', motion: 'guard', accent: 'green' },
  },
  {
    id: 'discernment',
    name: 'Discernimento',
    description:
      'Sabedoria fortalece o próximo ataque e revela o estilo provável do adversário.',
    type: 'TACTICAL',
    focusCost: 2,
    minimumLevel: 6,
    effects: ['insight'],
    tags: ['wisdom', 'strategy'],
    visual: { icon: '◎', motion: 'insight', accent: 'ivory' },
  },
  {
    id: 'pilgrim-step',
    name: 'Passo do Peregrino',
    description: 'Prepara mobilidade para evitar o próximo golpe recebido.',
    type: 'TACTICAL',
    focusCost: 3,
    minimumLevel: 8,
    effects: ['mobility'],
    tags: ['dodge', 'movement'],
    visual: { icon: '➶', motion: 'step', accent: 'gold' },
  },
]);
export const arenaProfiles: Readonly<
  Record<
    ArenaProfile,
    Readonly<{ label: string; description: string; basicDuration: number }>
  >
> = {
  agile: {
    label: 'Ágil',
    description: 'Pressiona com ataques leves e pode esquivar.',
    basicDuration: 520,
  },
  offensive: {
    label: 'Ofensivo',
    description: 'Acumula Foco para golpes fortes.',
    basicDuration: 680,
  },
  guardian: {
    label: 'Guardiã',
    description: 'Protege-se e responde no momento certo.',
    basicDuration: 760,
  },
  tactical: {
    label: 'Estrategista',
    description: 'Alterna defesa, leitura e ataque.',
    basicDuration: 620,
  },
};
const bounded = (
  value: number | undefined,
  low: number,
  high: number,
  fallback: number,
) =>
  Number.isFinite(value) ? Math.max(low, Math.min(high, value!)) : fallback;
export const arenaFocus = (fighter: BattleFighterState) =>
  Math.floor(
    bounded(
      fighter.focusPoints,
      0,
      arenaCombatConfig.maximumFocus,
      arenaCombatConfig.initialFocus,
    ),
  );
export function specialCost(
  snapshot: BattleParticipantSnapshot,
  special: ArenaSpecial,
) {
  const discount = Math.floor(
    bounded(snapshot.specialModifiers?.[special.id]?.focusDiscount, 0, 1, 0),
  );
  return Math.max(1, special.focusCost - discount);
}
export function specialLoadout(
  snapshot: BattleParticipantSnapshot,
): readonly ArenaSpecialId[] {
  const desired =
    snapshot.specialLoadout === undefined
      ? arenaSpecials.map((special) => special.id)
      : Array.isArray(snapshot.specialLoadout)
        ? snapshot.specialLoadout
        : [];
  return [...new Set(desired)]
    .filter((id) =>
      arenaSpecials.some(
        (special) =>
          special.id === id && snapshot.level >= special.minimumLevel,
      ),
    )
    .slice(0, arenaCombatConfig.maximumSpecialSlots);
}
export function specialAvailability(
  fighter: BattleFighterState,
  id: ArenaSpecialId,
) {
  const special = arenaSpecials.find((special) => special.id === id);
  if (!special) return 'unknown' as const;
  if (!(fighter.snapshot.level >= special.minimumLevel))
    return 'locked' as const;
  if (!specialLoadout(fighter.snapshot).includes(id))
    return 'unequipped' as const;
  if (arenaFocus(fighter) < specialCost(fighter.snapshot, special))
    return 'focus' as const;
  return 'available' as const;
}
type Fighter = {
  -readonly [K in keyof BattleFighterState]: K extends 'usedEffects'
    ? BattleEffectId[]
    : K extends 'cooldowns'
      ? Partial<Record<BattleEffectId, number>>
      : BattleFighterState[K];
};
function normalize(fighter: BattleFighterState): Fighter {
  return {
    ...fighter,
    usedEffects: [...fighter.usedEffects],
    cooldowns: { ...fighter.cooldowns },
    focusPoints: arenaFocus(fighter),
    guard: fighter.guard ?? null,
    tacticalMultiplier: bounded(
      fighter.tacticalMultiplier,
      1,
      battleBalanceConfig.focusMaximumMultiplier,
      1,
    ),
    mobilityReady: fighter.mobilityReady ?? false,
    lastSpecial: fighter.lastSpecial ?? null,
  };
}
export function createArenaBattle(
  player: BattleParticipantSnapshot,
  opponent: BattleParticipantSnapshot,
  seed: number,
  id?: string,
): BattleState {
  const state = createBattle(player, opponent, seed, id);
  return {
    ...state,
    player: normalize(state.player),
    opponent: normalize(state.opponent),
  };
}
/** Reads the committed state only; the player's upcoming choice is not an input. */
export function chooseArenaOpponentAction(state: BattleState): ArenaAction {
  const fighter = state.opponent;
  const ready = (id: ArenaSpecialId) =>
    specialAvailability(fighter, id) === 'available';
  switch (fighter.snapshot.arenaProfile) {
    case 'agile':
      return fighter.hp / fighter.maxHp < 0.35 && state.round % 4 === 0
        ? 'defend'
        : 'attack';
    case 'offensive':
      return ready('path-strike') && fighter.lastSpecial !== 'path-strike'
        ? 'special:path-strike'
        : 'attack';
    case 'guardian':
      if (
        ready('steadfast-guard') &&
        !fighter.guard &&
        fighter.lastSpecial !== 'steadfast-guard'
      )
        return 'special:steadfast-guard';
      return state.round % 2 === 1 && !fighter.guard ? 'defend' : 'attack';
    case 'tactical':
      if (
        ready('discernment') &&
        (fighter.tacticalMultiplier ?? 1) === 1 &&
        fighter.lastSpecial !== 'discernment'
      )
        return 'special:discernment';
      if (fighter.tacticalMultiplier && fighter.tacticalMultiplier > 1)
        return 'attack';
      return state.round % 3 === 1 && !fighter.guard ? 'defend' : 'attack';
    default:
      return fighter.hp / fighter.maxHp < 0.4 && state.round % 3 === 0
        ? 'defend'
        : 'attack';
  }
}
export function arenaProbableIntent(state: BattleState): string {
  const action = chooseArenaOpponentAction(state);
  return action === 'attack'
    ? 'Provável ataque'
    : action === 'defend'
      ? 'Provável defesa'
      : `Provável ${arenaSpecials.find((special) => action === `special:${special.id}`)?.name ?? 'especial'}`;
}
const hasEffect = (fighter: Fighter, id: BattleEffectId) =>
  fighter.snapshot.equipment.some((item) => item.effectIds.includes(id));
const canUseEffect = (fighter: Fighter, id: BattleEffectId) =>
  hasEffect(fighter, id) &&
  (fighter.cooldowns[id] ?? 0) === 0 &&
  fighter.usedEffects.filter((used) => used === id).length <
    equipmentEffects[id].usesPerBattle;

export function resolveArenaRound(
  state: BattleState,
  playerAction: ArenaAction,
): BattleState {
  if (state.status !== 'in_progress') return state;
  const selectedSpecial = arenaSpecials.find(
    (special) => playerAction === `special:${special.id}`,
  );
  if (
    playerAction !== 'attack' &&
    playerAction !== 'defend' &&
    (!selectedSpecial ||
      specialAvailability(state.player, selectedSpecial.id) !== 'available')
  )
    return state;
  const opponentAction = chooseArenaOpponentAction(state);
  const player = normalize(state.player),
    opponent = normalize(state.opponent);
  const actions = new Map<string, ArenaAction>([
    [player.snapshot.id, playerAction],
    [opponent.snapshot.id, opponentAction],
  ]);
  const logs: BattleLogEntry[] = [...state.log];
  const presentationState = (fighter: Fighter) => ({
    focusPoints: arenaFocus(fighter),
    guard: fighter.guard ?? null,
    tacticalMultiplier: fighter.tacticalMultiplier ?? 1,
    mobilityReady: fighter.mobilityReady ?? false,
  });
  const log = (
    fighter: Fighter,
    entry: Omit<BattleLogEntry, 'round' | 'actorId'>,
  ) =>
    logs.push({
      round: state.round,
      actorId: fighter.snapshot.id,
      fighterState: presentationState(fighter),
      ...entry,
    });
  const effect = (fighter: Fighter, id: BattleEffectId) => {
    if (!canUseEffect(fighter, id)) return false;
    fighter.usedEffects.push(id);
    fighter.cooldowns[id] = equipmentEffects[id].cooldown + 1;
    log(fighter, {
      kind: 'effect',
      effectType: 'ACTIVE',
      message: `${equipmentEffects[id].name} do equipamento reforçou a ação.`,
    });
    return true;
  };
  const gainFocus = (fighter: Fighter, amount: number) => {
    const before = arenaFocus(fighter);
    fighter.focusPoints = Math.min(
      arenaCombatConfig.maximumFocus,
      before + amount,
    );
    return fighter.focusPoints - before;
  };
  const pay = (fighter: Fighter, special: ArenaSpecial) => {
    fighter.focusPoints =
      arenaFocus(fighter) - specialCost(fighter.snapshot, special);
    fighter.abilitiesUsed++;
    fighter.lastSpecial = special.id;
  };
  // Defensive choices take posture before initiative, protecting the very next incoming blow.
  const prepared = new Set<string>();
  for (const fighter of [player, opponent]) {
    const action = actions.get(fighter.snapshot.id)!;
    if (action === 'defend') {
      if (fighter.guard !== 'fortified') fighter.guard = 'basic';
      fighter.lastSpecial = null;
      const delta = gainFocus(fighter, arenaCombatConfig.defendFocus);
      log(fighter, {
        kind: 'action',
        presentation: 'defend',
        focusAfter: arenaFocus(fighter),
        focusDelta: delta,
        message: `${fighter.snapshot.name} assumiu uma postura defensiva. +${delta} Foco.`,
      });
      prepared.add(fighter.snapshot.id);
    } else if (action === 'special:steadfast-guard') {
      const special = arenaSpecials[1];
      pay(fighter, special);
      fighter.guard = 'fortified';
      effect(fighter, 'steadfast-shield');
      log(fighter, {
        kind: 'effect',
        presentation: 'defend',
        specialId: special.id,
        focusAfter: arenaFocus(fighter),
        message: `${fighter.snapshot.name} usou Guarda Perseverante. Próximo dano reduzido.`,
      });
      prepared.add(fighter.snapshot.id);
    }
  }
  const order =
    calculateInitiative(player.snapshot, state.seed, state.round) >=
    calculateInitiative(opponent.snapshot, state.seed, state.round)
      ? [player, opponent]
      : [opponent, player];
  for (const actor of order) {
    const target = actor === player ? opponent : player;
    if (actor.hp <= 0 || target.hp <= 0 || prepared.has(actor.snapshot.id))
      continue;
    const action = actions.get(actor.snapshot.id)!;
    const special = arenaSpecials.find(
      (special) => action === `special:${special.id}`,
    );
    if (special) pay(actor, special);
    else actor.lastSpecial = null;
    if (special?.id === 'discernment') {
      const equippedBoost = effect(actor, 'prudence-amulet') ? 0.15 : 0;
      actor.tacticalMultiplier = Math.min(
        battleBalanceConfig.focusMaximumMultiplier,
        battleBalanceConfig.focusBaseMultiplier +
          equippedBoost +
          bounded(actor.snapshot.attributes.wisdom, 0, 999, 0) *
            battleBalanceConfig.focusPerWisdom,
      );
      log(actor, {
        kind: 'effect',
        presentation: 'focus',
        specialId: special.id,
        focusAfter: arenaFocus(actor),
        message: `${actor.snapshot.name} usou Discernimento. Sabedoria fortalece o próximo ataque.`,
      });
      continue;
    }
    if (special?.id === 'pilgrim-step') {
      actor.mobilityReady = true;
      log(actor, {
        kind: 'effect',
        presentation: 'focus',
        specialId: special.id,
        focusAfter: arenaFocus(actor),
        message: `${actor.snapshot.name} usou Passo do Peregrino. Mobilidade preparada.`,
      });
      continue;
    }
    let multiplier = actor.tacticalMultiplier ?? 1;
    actor.tacticalMultiplier = 1;
    if (actor.defendedLastRound && hasEffect(actor, 'path-sword'))
      multiplier *= battleBalanceConfig.swordAfterDefendMultiplier;
    if (special?.id === 'path-strike') {
      multiplier *=
        arenaCombatConfig.strikeMultiplier *
        bounded(
          actor.snapshot.specialModifiers?.[special.id]?.powerMultiplier,
          1,
          1.25,
          1,
        );
      if (effect(actor, 'path-sword'))
        multiplier *= battleBalanceConfig.swordAttackMultiplier;
    }
    const defended = Boolean(target.guard);
    let damage = calculateDamage(actor.snapshot, target.snapshot, {
      multiplier,
      defending: defended,
      fortified: target.guard === 'fortified',
      armored: hasEffect(target, 'traveler-armor'),
    });
    const boots =
      hasEffect(target, 'pilgrim-boots') &&
      !target.usedEffects.includes('pilgrim-boots') &&
      (target.hp - damage) / target.maxHp <=
        battleBalanceConfig.lowHealthThreshold;
    const agile =
      target.snapshot.arenaProfile === 'agile' &&
      seededUnit(state.seed, state.round, `dodge:${target.snapshot.id}`) <
        arenaCombatConfig.agileDodgeChance;
    if (target.mobilityReady || boots || agile) {
      if (target.mobilityReady) target.mobilityReady = false;
      else if (boots) target.usedEffects.push('pilgrim-boots');
      damage = 0;
    } else target.guard = null;
    const applied = Math.min(target.hp, damage);
    target.hp = Math.max(0, target.hp - damage);
    actor.damageDealt += applied;
    target.damageTaken += applied;
    const delta =
      action === 'attack' ? gainFocus(actor, arenaCombatConfig.attackFocus) : 0;
    log(actor, {
      kind: 'damage',
      presentation: damage === 0 ? 'dodge' : 'attack',
      targetId: target.snapshot.id,
      specialId: special?.id,
      amount: applied,
      defended: defended && damage > 0,
      targetState: presentationState(target),
      focusAfter: arenaFocus(actor),
      focusDelta: delta,
      message: damage
        ? `${actor.snapshot.name} causou ${applied} de dano${defended ? ' · DEFESA' : ''}.`
        : `${target.snapshot.name} ESQUIVOU!`,
    });
  }
  player.defendedLastRound = playerAction === 'defend';
  opponent.defendedLastRound = opponentAction === 'defend';
  for (const fighter of [player, opponent])
    for (const id of Object.keys(fighter.cooldowns) as BattleEffectId[])
      fighter.cooldowns[id] = Math.max(0, (fighter.cooldowns[id] ?? 0) - 1);
  const forced = state.round >= battleBalanceConfig.maximumRounds;
  const finished = player.hp <= 0 || opponent.hp <= 0 || forced;
  const wins =
    opponent.hp <= 0 ||
    (forced && player.hp / player.maxHp >= opponent.hp / opponent.maxHp);
  const winnerId = finished
    ? wins
      ? player.snapshot.id
      : opponent.snapshot.id
    : null;
  const loserId = finished
    ? wins
      ? opponent.snapshot.id
      : player.snapshot.id
    : null;
  if (winnerId)
    logs.push({
      round: state.round,
      actorId: winnerId,
      kind: 'result',
      message: `${wins ? player.snapshot.name : opponent.snapshot.name} venceu o treino com respeito.`,
    });
  return {
    ...state,
    player,
    opponent,
    log: logs,
    status: finished ? 'finished' : 'in_progress',
    round: finished ? state.round : state.round + 1,
    winnerId,
    loserId,
  };
}
