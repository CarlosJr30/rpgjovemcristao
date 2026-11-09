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

import {
  freezeArenaDeck,
  validateArenaDeck,
  type ArenaCard,
  type ArenaBaseAction,
} from './arena-deck';
import { describeArenaAction } from './arena-descriptions';
import { CONTENT_040_CARD_BY_ID } from './arena-content-040';
export type ArenaAction = ArenaBaseAction | `card:${string}`;
/** Commands accepted by the normal Arena. Direct specials belong to legacy labs/AI. */
export type ArenaProductAction = 'attack' | 'defend' | `card:${string}`;
export type ArenaSpecial = Readonly<{
  id: ArenaSpecialId;
  name: string;
  description: string;
  type: 'OFFENSIVE' | 'DEFENSIVE' | 'TACTICAL';
  focusCost: number;
  minimumLevel: number;
  cardOnly?: boolean;
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
  measuredStrikeMultiplier: 1.15,
  minimumSpecialFocusCost: 1,
  maximumSpecialPowerMultiplier: 1.25,
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
  {
    id: 'measured-strike',
    name: 'Golpe Medido',
    description: 'Ataque com multiplicador próprio, sem gerar Foco.',
    type: 'OFFENSIVE',
    focusCost: 1,
    minimumLevel: 1,
    cardOnly: true,
    effects: ['damage'],
    tags: ['attack'],
    visual: { icon: '⚔', motion: 'strike', accent: 'gold' },
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
  return Math.max(
    arenaCombatConfig.minimumSpecialFocusCost,
    special.focusCost - discount,
  );
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
          special.id === id &&
          !special.cardOnly &&
          snapshot.level >= special.minimumLevel,
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
export function createArenaDeckBattle(
  player: BattleParticipantSnapshot,
  opponent: BattleParticipantSnapshot,
  seed: number,
  id: string,
  ids: readonly string[],
  owned: readonly ArenaCard[],
): BattleState {
  return {
    ...createArenaBattle(player, opponent, seed, id),
    deck: freezeArenaDeck(player.id, ids, owned),
  };
}
/** Product boundary: a deck is mandatory, and no direct special is accepted. */
export function resolveArenaCommand(
  state: BattleState,
  id: string,
  round: number,
  action: ArenaProductAction,
): BattleState {
  if (
    !state.deck ||
    state.id !== id ||
    state.round !== round ||
    typeof action !== 'string' ||
    (action !== 'attack' && action !== 'defend' && !action.startsWith('card:'))
  )
    return state;
  return resolveArenaRound(state, action);
}
export function arenaCardDescription(card: ArenaCard): string {
  const content = CONTENT_040_CARD_BY_ID.get(card.id);
  if (content) return `${content.summary} ${content.explanation}`;
  return describeArenaAction(card.action).explanation;
}
export function arenaCardAvailability(state: BattleState, id: string) {
  const card = state.deck?.cards.find((c) => c.id === id);
  const content = CONTENT_040_CARD_BY_ID.get(id);
  const rule = content?.rule;
  const special = arenaSpecials.find((s) => `special:${s.id}` === card?.action);
  const focusCost =
    rule?.focusCost ??
    (special ? specialCost(state.player.snapshot, special) : 0);
  const minimumLevel = rule?.minimumLevel ?? special?.minimumLevel ?? 1;
  const missingFocus = Math.max(0, focusCost - arenaFocus(state.player));
  const hpRatio = state.player.hp / state.player.maxHp;
  const healingBudget = Math.min(Math.floor(state.player.maxHp * 0.2), 24);
  const effectiveHeal = rule?.healPercent
    ? Math.min(
        Math.max(0, state.player.maxHp - state.player.hp),
        Math.floor(state.player.maxHp * rule.healPercent),
        rule.healCap ?? Number.MAX_SAFE_INTEGER,
        Math.max(0, healingBudget - (state.player.healingUsed ?? 0)),
      )
    : 0;
  const conditionFailed =
    !!rule &&
    ((rule.requiresSelfHpAtMost !== undefined &&
      hpRatio > rule.requiresSelfHpAtMost) ||
      (rule.healWhenSelfHpAtMost !== undefined &&
        hpRatio > rule.healWhenSelfHpAtMost) ||
      (rule.requiresNoGuard &&
        (!!state.player.guard || state.player.guardMultiplier !== undefined)) ||
      (rule.healPercent !== undefined && effectiveHeal <= 0));
  const status = !card?.action
    ? 'unavailable'
    : state.deck!.usedIds.includes(id)
      ? 'used'
      : state.status !== 'in_progress'
        ? 'finished'
        : !(state.player.snapshot.level >= minimumLevel)
          ? 'level'
          : missingFocus > 0
            ? 'focus'
            : conditionFailed
              ? 'condition'
              : 'available';
  return {
    status,
    focusCost,
    minimumLevel,
    missingFocus,
    effectiveHeal,
  } as const;
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
  return executeArenaRound(state, playerAction, false);
}
/** Internal capability: only the validated card branch can set fromCard. */
function executeArenaRound(
  state: BattleState,
  playerAction: ArenaAction,
  fromCard: boolean,
  selectedCardId?: string,
): BattleState {
  if (state.status !== 'in_progress') return state;
  if (typeof playerAction !== 'string') return state;
  if (
    state.deck &&
    (state.deck.ownerId !== state.player.snapshot.id ||
      validateArenaDeck(
        state.deck.cards.map((c) => c.id),
        state.deck.cards,
      ) ||
      new Set(state.deck.usedIds).size !== state.deck.usedIds.length ||
      state.deck.usedIds.some(
        (id) => !state.deck!.cards.some((c) => c.id === id),
      ))
  )
    return state;
  if (playerAction.startsWith('card:')) {
    const id = playerAction.slice(5);
    const deck = state.deck;
    const card = deck?.cards.find((c) => c.id === id);
    if (
      !deck ||
      !card?.action ||
      arenaCardAvailability(state, id).status !== 'available'
    )
      return state;
    const next = executeArenaRound(state, card.action, true, id);
    if (next === state) return state;
    return { ...next, deck: { ...deck, usedIds: [...deck.usedIds, id] } };
  }
  const selectedSpecial = arenaSpecials.find(
    (special) => playerAction === `special:${special.id}`,
  );
  // Even the legacy export cannot directly activate a special on a product deck.
  if (selectedSpecial && (state.deck || selectedSpecial.cardOnly) && !fromCard)
    return state;
  const specialReady =
    selectedSpecial &&
    (fromCard
      ? state.player.snapshot.level >= selectedSpecial.minimumLevel &&
        arenaFocus(state.player) >=
          specialCost(state.player.snapshot, selectedSpecial)
      : specialAvailability(state.player, selectedSpecial.id) === 'available');
  if (playerAction !== 'attack' && playerAction !== 'defend' && !specialReady)
    return state;
  const content =
    fromCard && selectedCardId
      ? CONTENT_040_CARD_BY_ID.get(selectedCardId)
      : undefined;
  const contentRule = content?.rule;
  if (fromCard && selectedCardId && !content && !selectedSpecial) {
    const selected = state.deck?.cards.find(
      (entry) => entry.id === selectedCardId,
    );
    if (!selected) return state;
  }
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
  const payContent = (
    fighter: Fighter,
    rule: NonNullable<typeof contentRule>,
  ) => {
    fighter.focusPoints = arenaFocus(fighter) - rule.focusCost;
    fighter.abilitiesUsed++;
  };
  const prepareInitiative = (
    fighter: Fighter,
    rule: NonNullable<typeof contentRule>,
  ) => {
    if (!rule.initiative) return;
    const starts =
      rule.initiative.timing === 'current' ? state.round : state.round + 1;
    const expires = starts + (rule.initiative.rounds ?? 1) - 1;
    const overlaps = (fighter.initiativeExpiresRound ?? 0) >= starts;
    if (overlaps && (fighter.initiativeBonus ?? 0) >= rule.initiative.bonus)
      return;
    fighter.initiativeBonus = rule.initiative.bonus;
    fighter.initiativeStartsRound = starts;
    fighter.initiativeExpiresRound = expires;
  };
  const prepareGuard = (
    fighter: Fighter,
    rule: NonNullable<typeof contentRule>,
  ) => {
    if (rule.guardMultiplier === undefined) return;
    const oldMultiplier =
      fighter.guardMultiplier ??
      (fighter.guard === 'fortified'
        ? battleBalanceConfig.fortifiedDefendDamageMultiplier
        : fighter.guard === 'basic'
          ? battleBalanceConfig.defendDamageMultiplier
          : 1);
    // Guards never stack or weaken a stronger protection already prepared.
    if (rule.guardMultiplier >= oldMultiplier) return;
    if (!fighter.guard && fighter.guardMultiplier === undefined)
      fighter.guard = 'basic';
    fighter.guardMultiplier = rule.guardMultiplier;
    fighter.guardHitsRemaining = rule.guardHits ?? 1;
    fighter.guardExpiresRound =
      rule.guardRounds === undefined
        ? undefined
        : state.round + rule.guardRounds;
  };
  // Defensive choices take posture before initiative, protecting the very next incoming blow.
  const prepared = new Set<string>();
  for (const fighter of [player, opponent]) {
    const action = actions.get(fighter.snapshot.id)!;
    if (fighter === player && contentRule) {
      prepareInitiative(fighter, contentRule);
      prepareGuard(fighter, contentRule);
      if (contentRule.mode === 'guard') {
        payContent(fighter, contentRule);
        const delta = contentRule.focusGain
          ? gainFocus(fighter, contentRule.focusGain)
          : 0;
        if (contentRule.tacticalMultiplier)
          fighter.tacticalMultiplier = Math.max(
            fighter.tacticalMultiplier ?? 1,
            contentRule.tacticalMultiplier,
          );
        log(fighter, {
          kind: 'effect',
          presentation: 'defend',
          focusAfter: arenaFocus(fighter),
          focusDelta: delta,
          message: `${content?.name ?? 'Carta'}: guarda preparada.`,
        });
        prepared.add(fighter.snapshot.id);
      }
    } else if (action === 'defend') {
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
    calculateInitiative(
      player.snapshot,
      state.seed,
      state.round,
      player.initiativeStartsRound !== undefined &&
        player.initiativeExpiresRound !== undefined &&
        state.round >= player.initiativeStartsRound &&
        state.round <= player.initiativeExpiresRound
        ? player.initiativeBonus
        : 0,
    ) >=
    calculateInitiative(
      opponent.snapshot,
      state.seed,
      state.round,
      opponent.initiativeStartsRound !== undefined &&
        opponent.initiativeExpiresRound !== undefined &&
        state.round >= opponent.initiativeStartsRound &&
        state.round <= opponent.initiativeExpiresRound
        ? opponent.initiativeBonus
        : 0,
    )
      ? [player, opponent]
      : [opponent, player];
  for (const actor of order) {
    const target = actor === player ? opponent : player;
    if (
      actor.hp <= 0 ||
      target.hp <= 0 ||
      (prepared.has(actor.snapshot.id) &&
        !(actor === player && contentRule?.mode === 'support'))
    )
      continue;
    const action = actions.get(actor.snapshot.id)!;
    const special = arenaSpecials.find(
      (special) => action === `special:${special.id}`,
    );
    if (actor === player && contentRule) {
      payContent(actor, contentRule);
      if (contentRule.mode === 'tactic') {
        const delta = contentRule.focusGain
          ? gainFocus(actor, contentRule.focusGain)
          : 0;
        if (contentRule.tacticalMultiplier)
          actor.tacticalMultiplier = Math.max(
            actor.tacticalMultiplier ?? 1,
            contentRule.tacticalMultiplier,
          );
        log(actor, {
          kind: 'effect',
          presentation: 'focus',
          focusAfter: arenaFocus(actor),
          focusDelta: delta,
          message: `${content?.name ?? 'Carta'}: preparo concluído.`,
        });
        continue;
      }
      if (contentRule.mode === 'support') {
        const budget = Math.min(Math.floor(actor.maxHp * 0.2), 24);
        const healed = Math.min(
          actor.maxHp - actor.hp,
          Math.floor(actor.maxHp * (contentRule.healPercent ?? 0)),
          contentRule.healCap ?? 0,
          Math.max(0, budget - (actor.healingUsed ?? 0)),
        );
        if (healed <= 0) return state;
        actor.hp += healed;
        actor.healingUsed = (actor.healingUsed ?? 0) + healed;
        const delta = contentRule.focusGainWhenHealed
          ? gainFocus(actor, contentRule.focusGainWhenHealed)
          : 0;
        log(actor, {
          kind: 'effect',
          presentation: 'effect',
          amount: healed,
          focusAfter: arenaFocus(actor),
          focusDelta: delta,
          message: `${content?.name ?? 'Carta'} recuperou ${healed} HP.`,
        });
        continue;
      }
      if (contentRule.mode === 'resistance') {
        actor.damageReductionMultiplier = contentRule.damageReduction ?? 1;
        actor.damageReductionExpiresRound =
          state.round + (contentRule.damageReductionRounds ?? 1) - 1;
        log(actor, {
          kind: 'effect',
          presentation: 'defend',
          focusAfter: arenaFocus(actor),
          message: `${content?.name ?? 'Carta'}: resistência preparada.`,
        });
        continue;
      }
    } else if (special) pay(actor, special);
    else actor.lastSpecial = null;
    if (special?.id === 'discernment') {
      const equippedBoost = effect(actor, 'prudence-amulet')
        ? battleBalanceConfig.prudenceAmuletBoost
        : 0;
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
    const preparedBonuses = multiplier;
    if (actor === player && contentRule?.mode === 'attack') {
      multiplier *= contentRule.attackMultiplier ?? 1;
      const selfRatio = actor.hp / actor.maxHp;
      const targetRatio = target.hp / target.maxHp;
      if (
        contentRule.multiplierWhenSelfHpAtMost !== undefined &&
        selfRatio <= contentRule.multiplierWhenSelfHpAtMost
      )
        multiplier =
          preparedBonuses *
          (contentRule.multiplierWhenSelfHpAtMostMultiplier ??
            contentRule.attackMultiplier ??
            1);
      if (
        contentRule.multiplierWhenTargetHpAtMost !== undefined &&
        targetRatio <= contentRule.multiplierWhenTargetHpAtMost
      )
        multiplier =
          preparedBonuses *
          (contentRule.multiplierWhenTargetHpAtMostMultiplier ??
            contentRule.attackMultiplier ??
            1);
    }
    if (special?.id === 'path-strike' || special?.id === 'measured-strike') {
      multiplier *=
        (special.id === 'path-strike'
          ? arenaCombatConfig.strikeMultiplier
          : arenaCombatConfig.measuredStrikeMultiplier) *
        bounded(
          actor.snapshot.specialModifiers?.[special.id]?.powerMultiplier,
          1,
          arenaCombatConfig.maximumSpecialPowerMultiplier,
          1,
        );
      if (special.id === 'path-strike' && effect(actor, 'path-sword'))
        multiplier *= battleBalanceConfig.swordAttackMultiplier;
    }
    const customGuard = target.guardMultiplier;
    const legacyGuard =
      target.guard === 'fortified'
        ? battleBalanceConfig.fortifiedDefendDamageMultiplier
        : target.guard === 'basic'
          ? battleBalanceConfig.defendDamageMultiplier
          : undefined;
    const guardMultiplier = customGuard ?? legacyGuard;
    const resisted =
      target.damageReductionExpiresRound !== undefined &&
      state.round <= target.damageReductionExpiresRound
        ? target.damageReductionMultiplier
        : undefined;
    const defended = guardMultiplier !== undefined;
    const hasDamageReduction = defended || resisted !== undefined;
    let damage = calculateDamage(actor.snapshot, target.snapshot, {
      multiplier,
      defending: hasDamageReduction,
      fortified: target.guard === 'fortified',
      guardMultiplier: Math.min(guardMultiplier ?? 1, resisted ?? 1),
      armored: defended && hasEffect(target, 'traveler-armor'),
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
    } else if (!target.mobilityReady && !boots && !agile) {
      if (target.guardHitsRemaining !== undefined) {
        target.guardHitsRemaining = Math.max(0, target.guardHitsRemaining - 1);
        if (target.guardHitsRemaining === 0) {
          target.guard = null;
          target.guardMultiplier = undefined;
          target.guardHitsRemaining = undefined;
          target.guardExpiresRound = undefined;
        }
      } else target.guard = null;
    }
    const applied = Math.min(target.hp, damage);
    target.hp = Math.max(0, target.hp - damage);
    actor.damageDealt += applied;
    target.damageTaken += applied;
    const delta =
      action === 'attack' && !(actor === player && contentRule)
        ? gainFocus(actor, arenaCombatConfig.attackFocus)
        : 0;
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
  player.defendedLastRound =
    playerAction === 'defend' && (!contentRule || contentRule.mode === 'guard');
  opponent.defendedLastRound = opponentAction === 'defend';
  for (const fighter of [player, opponent])
    for (const id of Object.keys(fighter.cooldowns) as BattleEffectId[])
      fighter.cooldowns[id] = Math.max(0, (fighter.cooldowns[id] ?? 0) - 1);
  for (const fighter of [player, opponent]) {
    if (
      fighter.guardExpiresRound !== undefined &&
      fighter.guardExpiresRound <= state.round
    ) {
      fighter.guard = null;
      fighter.guardMultiplier = undefined;
      fighter.guardHitsRemaining = undefined;
      fighter.guardExpiresRound = undefined;
    }
    if (
      fighter.damageReductionExpiresRound !== undefined &&
      fighter.damageReductionExpiresRound <= state.round
    ) {
      fighter.damageReductionMultiplier = undefined;
      fighter.damageReductionExpiresRound = undefined;
    }
  }
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
