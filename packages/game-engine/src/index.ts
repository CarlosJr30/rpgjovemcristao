export type BattleAttributes = Readonly<{ life: number; strength: number; defense: number; wisdom: number }>;
export type GuildRewardTier = 'normal' | 'great' | 'epic' | 'extraordinary';
export type ChestType = 'common' | 'uncommon' | 'rare' | 'epic' | 'extraordinary';
export type ChestReward = Readonly<{
  coins: number;
  itemId: string | null;
  itemName: string | null;
}>;
export type ChestDefinition = Readonly<{
  type: ChestType;
  name: string;
  rarityLabel: string;
  description: string;
  image: string;
  price: number | null;
  minimumLevel: number;
  availability: 'always' | 'level' | 'event' | 'guild';
  possibleRewards: readonly string[];
}>;

export const chestCatalog: Readonly<Record<ChestType, ChestDefinition>> = Object.freeze({
  common: Object.freeze({ type: 'common', name: 'Baú Comum', rarityLabel: 'Comum', description: 'Suprimentos simples para continuar a jornada.', image: '/assets/items/reward_chest.png', price: 40, minimumLevel: 1, availability: 'always', possibleRewards: ['Moedas', 'Equipamento comum'] }),
  uncommon: Object.freeze({ type: 'uncommon', name: 'Baú Incomum', rarityLabel: 'Incomum', description: 'Uma seleção melhor de moedas e equipamentos.', image: '/assets/items/reward_chest.png', price: 90, minimumLevel: 1, availability: 'always', possibleRewards: ['Moedas', 'Equipamento incomum'] }),
  rare: Object.freeze({ type: 'rare', name: 'Baú Raro', rarityLabel: 'Raro', description: 'Recompensas raras para Viajantes experientes.', image: '/assets/items/reward_chest.png', price: 180, minimumLevel: 3, availability: 'level', possibleRewards: ['Moedas', 'Equipamento raro'] }),
  epic: Object.freeze({ type: 'epic', name: 'Baú Épico', rarityLabel: 'Épico', description: 'Tesouro reservado a eventos e grandes desafios.', image: '/assets/items/reward_chest.png', price: null, minimumLevel: 5, availability: 'event', possibleRewards: ['Muitas moedas', 'Equipamento raro'] }),
  extraordinary: Object.freeze({ type: 'extraordinary', name: 'Baú Extraordinário', rarityLabel: 'Extraordinário', description: 'A recompensa mais especial da Célula.', image: '/assets/items/reward_chest.png', price: null, minimumLevel: 10, availability: 'guild', possibleRewards: ['Grande quantidade de moedas', 'Equipamento especial'] }),
});

const chestLootTables: Readonly<Record<ChestType, readonly Readonly<{ weight: number; reward: ChestReward }>[]>> = Object.freeze({
  common: Object.freeze([
    Object.freeze({ weight: 80, reward: Object.freeze({ coins: 25, itemId: null, itemName: null }) }),
    Object.freeze({ weight: 20, reward: Object.freeze({ coins: 10, itemId: 'traveler-sword-common', itemName: 'Espada do Caminho' }) }),
  ]),
  uncommon: Object.freeze([
    Object.freeze({ weight: 70, reward: Object.freeze({ coins: 55, itemId: null, itemName: null }) }),
    Object.freeze({ weight: 30, reward: Object.freeze({ coins: 20, itemId: 'traveler-armor-uncommon', itemName: 'Couraça do Viajante' }) }),
  ]),
  rare: Object.freeze([
    Object.freeze({ weight: 65, reward: Object.freeze({ coins: 105, itemId: null, itemName: null }) }),
    Object.freeze({ weight: 35, reward: Object.freeze({ coins: 35, itemId: 'traveler-shield-rare', itemName: 'Escudo da Perseverança' }) }),
  ]),
  epic: Object.freeze([
    Object.freeze({ weight: 55, reward: Object.freeze({ coins: 190, itemId: null, itemName: null }) }),
    Object.freeze({ weight: 45, reward: Object.freeze({ coins: 70, itemId: 'traveler-helmet-rare', itemName: 'Elmo do Viajante' }) }),
  ]),
  extraordinary: Object.freeze([
    Object.freeze({ weight: 50, reward: Object.freeze({ coins: 360, itemId: null, itemName: null }) }),
    Object.freeze({ weight: 50, reward: Object.freeze({ coins: 120, itemId: 'wisdom-amulet', itemName: 'Medalhão do Caminho' }) }),
  ]),
});

export function selectChestReward(type: ChestType, roll: number): ChestReward {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new Error('Chest roll must be between 0 and 1.');
  const table = chestLootTables[type];
  const target = roll * table.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = 0;
  for (const entry of table) {
    cursor += entry.weight;
    if (target < cursor) return entry.reward;
  }
  return table[table.length - 1].reward;
}

export type GuildMissionRewardDefinition = Readonly<{
  xp: number;
  coins: number;
  chestType: ChestType;
  chestQuantity: 1;
  chestLabel: string;
}>;
export const guildMissionRewards: Readonly<Record<GuildRewardTier, GuildMissionRewardDefinition>> = Object.freeze({
  normal: Object.freeze({ xp: 80, coins: 25, chestType: 'common', chestQuantity: 1, chestLabel: 'Baú Comum' }),
  great: Object.freeze({ xp: 240, coins: 100, chestType: 'uncommon', chestQuantity: 1, chestLabel: 'Baú Incomum' }),
  epic: Object.freeze({ xp: 480, coins: 220, chestType: 'rare', chestQuantity: 1, chestLabel: 'Baú Raro' }),
  extraordinary: Object.freeze({ xp: 720, coins: 360, chestType: 'epic', chestQuantity: 1, chestLabel: 'Baú Épico' }),
});
export const guildTierChest: Readonly<Record<GuildRewardTier, ChestType>> = Object.freeze({
  normal: guildMissionRewards.normal.chestType,
  great: guildMissionRewards.great.chestType,
  epic: guildMissionRewards.epic.chestType,
  extraordinary: guildMissionRewards.extraordinary.chestType,
});
export type BattleAction = 'attack' | 'defend' | 'focus' | 'equipment';
export type ArenaSpecialId = 'path-strike' | 'steadfast-guard' | 'discernment' | 'pilgrim-step';
export type ArenaProfile = 'agile' | 'offensive' | 'guardian' | 'tactical';
export type BattleStatus = 'pending' | 'ready' | 'in_progress' | 'finished' | 'cancelled';
export type BattleEffectTrigger = 'onBattleStart' | 'onRoundStart' | 'onAttack' | 'onDefend' | 'onDamageTaken' | 'onLowHealth' | 'onFocus' | 'onVictory';
export type BattleEffectId = 'path-sword' | 'steadfast-shield' | 'pilgrim-boots' | 'prudence-amulet' | 'traveler-helmet' | 'traveler-armor';
export type BattleEquipmentSnapshot = Readonly<{ id: string; name: string; power: number; effectIds: readonly BattleEffectId[] }>;
export type BattleParticipantSnapshot = Readonly<{
  id: string; name: string; level: number; attributes: BattleAttributes;
  equipment: readonly BattleEquipmentSnapshot[]; combatPower: number; avatarKey?: string;
  arenaProfile?: ArenaProfile;
  specialLoadout?: readonly ArenaSpecialId[];
  specialModifiers?: Readonly<Partial<Record<ArenaSpecialId, Readonly<{ focusDiscount?: number; powerMultiplier?: number }>>>>;
}>;
export type BattleChallengeContract = Readonly<{
  id: string; challengerId: string; challengedId: string; status: BattleStatus; seed: number;
  challengerSnapshot: BattleParticipantSnapshot; challengedSnapshot: BattleParticipantSnapshot; createdAt: string;
}>;
export type EquipmentEffectType = 'ACTIVE' | 'PASSIVE' | 'TRIGGERED';
export type BattlePresentationState = Readonly<{ focusPoints: number; guard: 'basic' | 'fortified' | null; tacticalMultiplier: number; mobilityReady: boolean }>;
export type BattleLogEntry = Readonly<{ round: number; actorId: string; kind: 'action' | 'damage' | 'effect' | 'result'; message: string; amount?: number; effectType?: EquipmentEffectType; targetId?: string; specialId?: ArenaSpecialId; presentation?: 'attack' | 'defend' | 'focus' | 'dodge' | 'effect'; defended?: boolean; focusAfter?: number; focusDelta?: number; fighterState?: BattlePresentationState; targetState?: BattlePresentationState }>;
export type BattleFighterState = Readonly<{
  snapshot: BattleParticipantSnapshot; hp: number; maxHp: number; focusMultiplier: number;
  defendedLastRound: boolean; usedEffects: readonly BattleEffectId[];
  cooldowns: Readonly<Partial<Record<BattleEffectId, number>>>;
  damageDealt: number; damageTaken: number; abilitiesUsed: number;
  focusPoints?: number; guard?: 'basic' | 'fortified' | null;
  tacticalMultiplier?: number; mobilityReady?: boolean; lastSpecial?: ArenaSpecialId | null;
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

export const combatPowerConfig = Object.freeze({
  level: 20,
  attributes: Object.freeze({ life: 12, strength: 12, defense: 11, wisdom: 10 }),
  equipmentPower: 6,
  specialEffect: 6,
});

export const equipmentEffects: Readonly<Record<BattleEffectId, Readonly<{
  id: BattleEffectId; name: string; trigger: BattleEffectTrigger; description: string;
  cooldown: number; usesPerBattle: number; type: EquipmentEffectType;
}>>> = Object.freeze({
  'path-sword': { id: 'path-sword', name: 'Golpe do Caminho', trigger: 'onAttack', description: 'Um golpe fortalecido; após Defender, o próximo ataque também recebe bônus.', cooldown: 0, usesPerBattle: 1, type: 'ACTIVE' },
  'steadfast-shield': { id: 'steadfast-shield', name: 'Guarda Perseverante', trigger: 'onDefend', description: 'Reduz fortemente o dano recebido nesta rodada.', cooldown: 0, usesPerBattle: 1, type: 'ACTIVE' },
  'pilgrim-boots': { id: 'pilgrim-boots', name: 'Passo do Peregrino', trigger: 'onLowHealth', description: 'Ativa automaticamente e evita um ataque quando a vida ficaria baixa.', cooldown: 0, usesPerBattle: 1, type: 'TRIGGERED' },
  'prudence-amulet': { id: 'prudence-amulet', name: 'Discernimento', trigger: 'onFocus', description: 'Amplia o próximo Foco. Pode ser usado novamente após duas rodadas.', cooldown: 2, usesPerBattle: 2, type: 'ACTIVE' },
  'traveler-helmet': { id: 'traveler-helmet', name: 'Prontidão', trigger: 'onRoundStart', description: 'Concede +1 à iniciativa em todas as rodadas.', cooldown: 0, usesPerBattle: 0, type: 'PASSIVE' },
  'traveler-armor': { id: 'traveler-armor', name: 'Postura Firme', trigger: 'onDefend', description: 'Melhora levemente a proteção sempre que Defender.', cooldown: 0, usesPerBattle: 0, type: 'PASSIVE' },
});

const clampStat = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(999, value)) : 0;
const equipmentPower = (snapshot: BattleParticipantSnapshot) => snapshot.equipment.reduce((sum, item) => sum + clampStat(item.power), 0);
const hasEffect = (fighter: BattleFighterState, effect: BattleEffectId) => fighter.snapshot.equipment.some((item) => item.effectIds.includes(effect));

export function calculateMaxHp(attributes: BattleAttributes): number {
  return Math.round(battleBalanceConfig.hpBase + clampStat(attributes.life) * battleBalanceConfig.hpPerLife);
}
export function calculateCombatPower(input: Pick<BattleParticipantSnapshot, 'level' | 'attributes' | 'equipment'>): number {
  return calculateCombatPowerBreakdown(input).total;
}
export function calculateCombatPowerBreakdown(input: Pick<BattleParticipantSnapshot, 'level' | 'attributes' | 'equipment'>) {
  const effects = new Set(input.equipment.flatMap((item) => item.effectIds)).size;
  const level = Math.round(clampStat(input.level) * combatPowerConfig.level);
  const attributes = Math.round(clampStat(input.attributes.life) * combatPowerConfig.attributes.life + clampStat(input.attributes.strength) * combatPowerConfig.attributes.strength + clampStat(input.attributes.defense) * combatPowerConfig.attributes.defense + clampStat(input.attributes.wisdom) * combatPowerConfig.attributes.wisdom);
  const equipment = Math.round(input.equipment.reduce((sum, item) => sum + clampStat(item.power), 0) * combatPowerConfig.equipmentPower);
  const specialEffects = effects * combatPowerConfig.specialEffect;
  return { level, attributes, equipment, specialEffects, total: level + attributes + equipment + specialEffects } as const;
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
export function seededUnit(seed: number, round: number, salt: string): number {
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
  return priority.map((id) => equipmentEffects[id]).find((effect) => effect.type === 'ACTIVE' && hasEffect(fighter, effect.id) && fighter.usedEffects.filter((id) => id === effect.id).length < effect.usesPerBattle && (fighter.cooldowns[effect.id] ?? 0) <= 0) ?? null;
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
    if (actor.defendedLastRound && hasEffect(actor, 'path-sword')) { attackMultiplier *= battleBalanceConfig.swordAfterDefendMultiplier; logs.push({ round: state.round, actorId: actor.snapshot.id, kind: 'effect', effectType: 'TRIGGERED', message: 'Espada do Caminho respondeu à defesa anterior.' }); }
    if (action === 'equipment') {
      const ability = availableEquipmentAbility(actor);
      if (!ability) continue;
      actor.usedEffects.push(ability.id); actor.abilitiesUsed += 1; actor.cooldowns[ability.id] = ability.cooldown + 1;
      logs.push({ round: state.round, actorId: actor.snapshot.id, kind: 'effect', effectType: 'ACTIVE', message: `${actor.snapshot.name} usou ${ability.name}.` });
      if (ability.id === 'steadfast-shield') { fortified.add(actor.snapshot.id); continue; }
      if (ability.id === 'prudence-amulet') { actor.focusMultiplier = Math.min(battleBalanceConfig.focusMaximumMultiplier, battleBalanceConfig.focusBaseMultiplier + 0.15 + actor.snapshot.attributes.wisdom * battleBalanceConfig.focusPerWisdom); continue; }
      if (ability.id === 'path-sword') attackMultiplier *= battleBalanceConfig.swordAttackMultiplier;
    }
    let damage = calculateDamage(actor.snapshot, target.snapshot, { multiplier: attackMultiplier, defending: defending(target) || fortified.has(target.snapshot.id), fortified: fortified.has(target.snapshot.id), armored: hasEffect(target, 'traveler-armor') });
    const bootsThresholdReached = target.hp / target.maxHp <= battleBalanceConfig.lowHealthThreshold ||
      (target.hp - damage) / target.maxHp <= battleBalanceConfig.lowHealthThreshold;
    if (hasEffect(target, 'pilgrim-boots') && !target.usedEffects.includes('pilgrim-boots') && bootsThresholdReached) {
      target.usedEffects.push('pilgrim-boots'); damage = 0;
      logs.push({ round: state.round, actorId: target.snapshot.id, kind: 'effect', effectType: 'TRIGGERED', message: `Passo do Peregrino foi ativado automaticamente e permitiu que ${target.snapshot.name} evitasse o golpe.` });
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
export * from './arena-combat-v2';
