export type BattleAttributes = Readonly<{ life: number; strength: number; defense: number; wisdom: number }>;
export type BattleAction = 'attack' | 'defend' | 'focus' | 'equipment';
export type BattleStatus = 'pending' | 'ready' | 'in_progress' | 'finished' | 'cancelled';
export type BattleEffectTrigger = 'onBattleStart' | 'onRoundStart' | 'onAttack' | 'onDefend' | 'onDamageTaken' | 'onLowHealth' | 'onFocus' | 'onVictory';
export type BattleEffectId = 'path-sword' | 'steadfast-shield' | 'pilgrim-boots' | 'prudence-amulet' | 'traveler-helmet' | 'traveler-armor';
export type BattleEquipmentSnapshot = Readonly<{ id: string; name: string; power: number; effectIds: readonly BattleEffectId[] }>;
export type BattleParticipantSnapshot = Readonly<{
  id: string; name: string; level: number; attributes: BattleAttributes;
  equipment: readonly BattleEquipmentSnapshot[]; combatPower: number; avatarKey?: string;
}>;
export type BattleChallengeContract = Readonly<{
  id: string; challengerId: string; challengedId: string; status: BattleStatus; seed: number;
  challengerSnapshot: BattleParticipantSnapshot; challengedSnapshot: BattleParticipantSnapshot; createdAt: string;
}>;
export type BattleLogEntry = Readonly<{ round: number; actorId: string; kind: 'action' | 'damage' | 'effect' | 'result'; message: string; amount?: number }>;
export type BattleFighterState = Readonly<{
  snapshot: BattleParticipantSnapshot; hp: number; maxHp: number; focusMultiplier: number;
  defendedLastRound: boolean; usedEffects: readonly BattleEffectId[];
  cooldowns: Readonly<Partial<Record<BattleEffectId, number>>>;
  damageDealt: number; damageTaken: number; abilitiesUsed: number;
}>;
export type BattleState = Readonly<{
  id: string; seed: number; status: Extract<BattleStatus, 'in_progress' | 'finished'>; round: number;
  player: BattleFighterState; opponent: BattleFighterState; winnerId: string | null; loserId: string | null;
  log: readonly BattleLogEntry[];
}>;

export const battleBalanceConfig = Object.freeze({
  hpBase: 20, hpPerLife: 6, baseDamage: 3, strengthDamageMultiplier: 2.2, equipmentPowerDamageMultiplier: 0.18,
  defenseReductionMultiplier: 1.15, minimumDamage: 1, defendDamageMultiplier: 0.5,
  fortifiedDefendDamageMultiplier: 0.25, armorDefendDamageMultiplier: 0.85,
  focusBaseMultiplier: 1.18, focusPerWisdom: 0.035, focusMaximumMultiplier: 1.55,
  swordAttackMultiplier: 1.28, swordAfterDefendMultiplier: 1.2, lowHealthThreshold: 0.35,
  initiativeVariance: 2, matchmakingRangeRatio: 0.1, trainingRewardXp: 8, trainingRewardCoins: 3,
  rewardedBattlesPerOpponentPerDay: 3, maximumRounds: 30,
});

export const equipmentEffects: Readonly<Record<BattleEffectId, Readonly<{
  id: BattleEffectId; name: string; trigger: BattleEffectTrigger; description: string;
  cooldown: number; usesPerBattle: number; active: boolean;
}>>> = Object.freeze({
  'path-sword': { id: 'path-sword', name: 'Golpe do Caminho', trigger: 'onAttack', description: 'Um golpe fortalecido; após Defender, o próximo ataque também recebe bônus.', cooldown: 0, usesPerBattle: 1, active: true },
  'steadfast-shield': { id: 'steadfast-shield', name: 'Guarda Perseverante', trigger: 'onDefend', description: 'Reduz fortemente o dano recebido nesta rodada.', cooldown: 0, usesPerBattle: 1, active: true },
  'pilgrim-boots': { id: 'pilgrim-boots', name: 'Passo do Peregrino', trigger: 'onLowHealth', description: 'Evita um ataque quando a vida está baixa.', cooldown: 0, usesPerBattle: 1, active: false },
  'prudence-amulet': { id: 'prudence-amulet', name: 'Discernimento', trigger: 'onFocus', description: 'Amplia o próximo Foco. Pode ser usado novamente após duas rodadas.', cooldown: 2, usesPerBattle: 2, active: true },
  'traveler-helmet': { id: 'traveler-helmet', name: 'Prontidão', trigger: 'onRoundStart', description: 'Concede +1 à iniciativa.', cooldown: 0, usesPerBattle: 0, active: false },
  'traveler-armor': { id: 'traveler-armor', name: 'Postura Firme', trigger: 'onDefend', description: 'Melhora levemente a proteção ao Defender.', cooldown: 0, usesPerBattle: 0, active: false },
});

const clampStat = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(999, value)) : 0;
const equipmentPower = (snapshot: BattleParticipantSnapshot) => snapshot.equipment.reduce((sum, item) => sum + clampStat(item.power), 0);
const hasEffect = (fighter: BattleFighterState, effect: BattleEffectId) => fighter.snapshot.equipment.some((item) => item.effectIds.includes(effect));

export function calculateMaxHp(attributes: BattleAttributes): number {
  return Math.round(battleBalanceConfig.hpBase + clampStat(attributes.life) * battleBalanceConfig.hpPerLife);
}
export function calculateCombatPower(input: Pick<BattleParticipantSnapshot, 'level' | 'attributes' | 'equipment'>): number {
  const effects = new Set(input.equipment.flatMap((item) => item.effectIds)).size;
  return Math.round(clampStat(input.level) * 18 + calculateMaxHp(input.attributes) * 1.4 + clampStat(input.attributes.strength) * 24 + clampStat(input.attributes.defense) * 21 + clampStat(input.attributes.wisdom) * 19 + equipmentPower(input as BattleParticipantSnapshot) * 7 + effects * 8);
}
export function isWithinMatchmakingRange(power: number, candidatePower: number, ratio = battleBalanceConfig.matchmakingRangeRatio): boolean {
  const range = Math.max(25, Math.round(Math.max(0, power) * Math.max(0, ratio)));
  return Math.abs(power - candidatePower) <= range;
}
export function calculateDamage(attacker: BattleParticipantSnapshot, defender: BattleParticipantSnapshot, modifiers: { multiplier?: number; defending?: boolean; fortified?: boolean; armored?: boolean } = {}): number {
  const offensive = battleBalanceConfig.baseDamage + clampStat(attacker.attributes.strength) * battleBalanceConfig.strengthDamageMultiplier + equipmentPower(attacker) * battleBalanceConfig.equipmentPowerDamageMultiplier;
  const reduction = clampStat(defender.attributes.defense) * battleBalanceConfig.defenseReductionMultiplier;
  let damage = Math.max(battleBalanceConfig.minimumDamage, Math.round((offensive - reduction) * (modifiers.multiplier ?? 1)));
  if (modifiers.defending) damage = Math.max(battleBalanceConfig.minimumDamage, Math.ceil(damage * (modifiers.fortified ? battleBalanceConfig.fortifiedDefendDamageMultiplier : battleBalanceConfig.defendDamageMultiplier)));
  if (modifiers.defending && modifiers.armored) damage = Math.max(battleBalanceConfig.minimumDamage, Math.ceil(damage * battleBalanceConfig.armorDefendDamageMultiplier));
  return damage;
}
function seededUnit(seed: number, round: number, salt: string): number {
  let value = (seed ^ (round * 2654435761)) >>> 0;
  for (let i = 0; i < salt.length; i += 1) value = Math.imul(value ^ salt.charCodeAt(i), 2246822519) >>> 0;
  value ^= value >>> 13;
  return (value >>> 0) / 4294967295;
}
export function calculateInitiative(snapshot: BattleParticipantSnapshot, seed: number, round: number): number {
  const helmet = snapshot.equipment.some((item) => item.effectIds.includes('traveler-helmet')) ? 1 : 0;
  const variation = Math.floor(seededUnit(seed, round, snapshot.id) * (battleBalanceConfig.initiativeVariance * 2 + 1)) - battleBalanceConfig.initiativeVariance;
  return clampStat(snapshot.attributes.wisdom) * 2 + helmet + variation;
}
function makeFighter(snapshot: BattleParticipantSnapshot): BattleFighterState {
  const maxHp = calculateMaxHp(snapshot.attributes);
  return { snapshot, hp: maxHp, maxHp, focusMultiplier: 1, defendedLastRound: false, usedEffects: [], cooldowns: {}, damageDealt: 0, damageTaken: 0, abilitiesUsed: 0 };
}
export function createBattle(player: BattleParticipantSnapshot, opponent: BattleParticipantSnapshot, seed: number, id = `battle-${seed}`): BattleState {
  return { id, seed: seed >>> 0, status: 'in_progress', round: 1, player: makeFighter(player), opponent: makeFighter(opponent), winnerId: null, loserId: null, log: [{ round: 0, actorId: player.id, kind: 'action', message: `${player.name} entrou na Arena contra ${opponent.name}.` }] };
}
export function availableEquipmentAbility(fighter: BattleFighterState) {
  const priority: BattleEffectId[] = ['path-sword', 'steadfast-shield', 'prudence-amulet'];
  return priority.map((id) => equipmentEffects[id]).find((effect) => hasEffect(fighter, effect.id) && fighter.usedEffects.filter((id) => id === effect.id).length < effect.usesPerBattle && (fighter.cooldowns[effect.id] ?? 0) <= 0) ?? null;
}
function chooseOpponentAction(state: BattleState): BattleAction {
  if (availableEquipmentAbility(state.opponent) && seededUnit(state.seed, state.round, 'ability') > 0.74) return 'equipment';
  if (state.opponent.hp / state.opponent.maxHp < 0.42 && state.round % 3 === 0) return 'defend';
  if (state.round % 4 === 0) return 'focus';
  return 'attack';
}
type MutableFighter = { -readonly [K in keyof BattleFighterState]: K extends 'usedEffects' ? BattleEffectId[] : K extends 'cooldowns' ? Partial<Record<BattleEffectId, number>> : BattleFighterState[K] };
const mutable = (fighter: BattleFighterState): MutableFighter => ({ ...fighter, usedEffects: [...fighter.usedEffects], cooldowns: { ...fighter.cooldowns } });
const actionLabel = (action: BattleAction) => action === 'attack' ? 'Atacar' : action === 'defend' ? 'Defender' : action === 'focus' ? 'Focar' : 'Habilidade';

export function resolveRound(state: BattleState, playerAction: BattleAction): BattleState {
  if (state.status !== 'in_progress' || !['attack', 'defend', 'focus', 'equipment'].includes(playerAction)) return state;
  if (playerAction === 'equipment' && !availableEquipmentAbility(state.player)) return state;
  const opponentAction = chooseOpponentAction(state);
  const player = mutable(state.player), opponent = mutable(state.opponent);
  const logs: BattleLogEntry[] = [...state.log];
  const actions = new Map([[player.snapshot.id, playerAction], [opponent.snapshot.id, opponentAction]]);
  const playerInitiative = calculateInitiative(player.snapshot, state.seed, state.round);
  const opponentInitiative = calculateInitiative(opponent.snapshot, state.seed, state.round);
  const order = playerInitiative >= opponentInitiative ? [player, opponent] : [opponent, player];
  logs.push({ round: state.round, actorId: player.snapshot.id, kind: 'action', message: `${player.snapshot.name} escolheu ${actionLabel(playerAction)}.` });
  logs.push({ round: state.round, actorId: opponent.snapshot.id, kind: 'action', message: `${opponent.snapshot.name} preparou ${actionLabel(opponentAction)}.` });
  const defending = (fighter: MutableFighter) => actions.get(fighter.snapshot.id) === 'defend';
  const fortified = new Set<string>();
  if (playerAction === 'equipment' && availableEquipmentAbility(player)?.id === 'steadfast-shield') fortified.add(player.snapshot.id);
  if (opponentAction === 'equipment' && availableEquipmentAbility(opponent)?.id === 'steadfast-shield') fortified.add(opponent.snapshot.id);
  for (const actor of order) {
    const target = actor.snapshot.id === player.snapshot.id ? opponent : player;
    if (actor.hp <= 0 || target.hp <= 0) continue;
    const action = actions.get(actor.snapshot.id)!;
    if (action === 'defend') { logs.push({ round: state.round, actorId: actor.snapshot.id, kind: 'action', message: `${actor.snapshot.name} assumiu uma postura defensiva.` }); continue; }
    if (action === 'focus') {
      actor.focusMultiplier = Math.min(battleBalanceConfig.focusMaximumMultiplier, battleBalanceConfig.focusBaseMultiplier + actor.snapshot.attributes.wisdom * battleBalanceConfig.focusPerWisdom);
      logs.push({ round: state.round, actorId: actor.snapshot.id, kind: 'effect', message: `${actor.snapshot.name} concentrou-se para fortalecer a próxima ação.` }); continue;
    }
    let attackMultiplier = actor.focusMultiplier;
    actor.focusMultiplier = 1;
    if (actor.defendedLastRound && hasEffect(actor, 'path-sword')) { attackMultiplier *= battleBalanceConfig.swordAfterDefendMultiplier; logs.push({ round: state.round, actorId: actor.snapshot.id, kind: 'effect', message: 'Espada do Caminho respondeu à defesa anterior.' }); }
    if (action === 'equipment') {
      const ability = availableEquipmentAbility(actor);
      if (!ability) continue;
      actor.usedEffects.push(ability.id); actor.abilitiesUsed += 1; actor.cooldowns[ability.id] = ability.cooldown + 1;
      logs.push({ round: state.round, actorId: actor.snapshot.id, kind: 'effect', message: `${actor.snapshot.name} usou ${ability.name}.` });
      if (ability.id === 'steadfast-shield') { fortified.add(actor.snapshot.id); continue; }
      if (ability.id === 'prudence-amulet') { actor.focusMultiplier = Math.min(battleBalanceConfig.focusMaximumMultiplier, battleBalanceConfig.focusBaseMultiplier + 0.15 + actor.snapshot.attributes.wisdom * battleBalanceConfig.focusPerWisdom); continue; }
      if (ability.id === 'path-sword') attackMultiplier *= battleBalanceConfig.swordAttackMultiplier;
    }
    let damage = calculateDamage(actor.snapshot, target.snapshot, { multiplier: attackMultiplier, defending: defending(target) || fortified.has(target.snapshot.id), fortified: fortified.has(target.snapshot.id), armored: hasEffect(target, 'traveler-armor') });
    const bootsThresholdReached = target.hp / target.maxHp <= battleBalanceConfig.lowHealthThreshold ||
      (target.hp - damage) / target.maxHp <= battleBalanceConfig.lowHealthThreshold;
    if (hasEffect(target, 'pilgrim-boots') && !target.usedEffects.includes('pilgrim-boots') && bootsThresholdReached) {
      target.usedEffects.push('pilgrim-boots'); damage = 0;
      logs.push({ round: state.round, actorId: target.snapshot.id, kind: 'effect', message: `Passo do Peregrino permitiu que ${target.snapshot.name} evitasse o golpe.` });
    }
    target.hp = Math.max(0, target.hp - damage); actor.damageDealt += damage; target.damageTaken += damage;
    logs.push({ round: state.round, actorId: actor.snapshot.id, kind: 'damage', amount: damage, message: damage ? `${actor.snapshot.name} causou ${damage} de dano.` : 'O golpe foi evitado.' });
  }
  player.defendedLastRound = playerAction === 'defend'; opponent.defendedLastRound = opponentAction === 'defend';
  for (const fighter of [player, opponent]) for (const effect of Object.keys(fighter.cooldowns) as BattleEffectId[]) fighter.cooldowns[effect] = Math.max(0, (fighter.cooldowns[effect] ?? 0) - 1);
  const forcedFinish = state.round >= battleBalanceConfig.maximumRounds;
  const finished = player.hp <= 0 || opponent.hp <= 0 || forcedFinish;
  let winnerId: string | null = null, loserId: string | null = null;
  if (finished) {
    const playerWins = opponent.hp <= 0 || (forcedFinish && player.hp / player.maxHp >= opponent.hp / opponent.maxHp);
    winnerId = playerWins ? player.snapshot.id : opponent.snapshot.id; loserId = playerWins ? opponent.snapshot.id : player.snapshot.id;
    logs.push({ round: state.round, actorId: winnerId, kind: 'result', message: `${playerWins ? player.snapshot.name : opponent.snapshot.name} venceu o treino com respeito.` });
  }
  return { ...state, status: finished ? 'finished' : 'in_progress', round: finished ? state.round : state.round + 1, player, opponent, winnerId, loserId, log: logs };
}

export type TrainingReward = Readonly<{ xp: number; coins: number; rewarded: boolean; reason: 'victory' | 'daily-limit' | 'defeat' }>;
export function calculateTrainingReward(won: boolean, rewardedBattlesToday: number): TrainingReward {
  if (!won) return { xp: 0, coins: 0, rewarded: false, reason: 'defeat' };
  if (rewardedBattlesToday >= battleBalanceConfig.rewardedBattlesPerOpponentPerDay) return { xp: 0, coins: 0, rewarded: false, reason: 'daily-limit' };
  return { xp: battleBalanceConfig.trainingRewardXp, coins: battleBalanceConfig.trainingRewardCoins, rewarded: true, reason: 'victory' };
}
export function getEngineStatus(): { readonly gameplayAvailable: true } { return { gameplayAvailable: true }; }
