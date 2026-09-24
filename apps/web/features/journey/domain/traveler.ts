export const HAIR = ['curto', 'longo', 'cacheado'] as const;
import { levelForXp } from '../data/progression';
export const OUTFITS = ['musgo', 'ocre', 'azul'] as const;
export const SKIN = ['claro', 'medio', 'escuro'] as const;
export type Appearance = {
  hair: (typeof HAIR)[number];
  outfit: (typeof OUTFITS)[number];
  skin: (typeof SKIN)[number];
};
export type AvatarConfig = {
  gender: 'male' | 'female';
  face: number;
  hair: number;
  hairColor: string;
  cloakColor: string;
  clothing: string;
  equippedItems: Partial<Record<EquipmentSlot, string>>;
  portraitConfig: { state: 'idle' };
};
export const DEFAULT_AVATAR: AvatarConfig = {
  gender: 'male', face: 1, hair: 1, hairColor: 'castanho', cloakColor: 'musgo', clothing: 'musgo',
  equippedItems: {}, portraitConfig: { state: 'idle' },
};
export type EquipmentSlot =
  'helmet' | 'armor' | 'weapon' | 'shield' | 'boots' | 'amulet';
export const ATTRIBUTE_KEYS = ['life', 'strength', 'defense', 'wisdom'] as const;
export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];
export type AttributeValues = Record<AttributeKey, number>;
export type EquipmentStats = Partial<AttributeValues>;
export type Equipment = {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: 'comum' | 'incomum' | 'raro' | 'épico' | 'lendário';
  power: number;
  stats: EquipmentStats;
  isNew?: boolean;
};
const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = ['helmet', 'armor', 'weapon', 'shield', 'boots', 'amulet'];
function isEquipmentStats(value: unknown): value is EquipmentStats {
  return record(value) && Object.keys(value).every((key) => ATTRIBUTE_KEYS.includes(key as AttributeKey)) &&
    Object.values(value).every((bonus) => typeof bonus === 'number' && Number.isInteger(bonus) && bonus >= 0 && bonus <= 100);
}
function isEquipment(value: unknown): value is Equipment {
  return record(value) && typeof value.id === 'string' && value.id.length > 0 && value.id.length <= 64 &&
    typeof value.name === 'string' && value.name.length > 0 && value.name.length <= 80 &&
    EQUIPMENT_SLOTS.includes(value.slot as EquipmentSlot) &&
    ['comum', 'incomum', 'raro', 'épico', 'lendário'].includes(String(value.rarity)) &&
    typeof value.power === 'number' && Number.isInteger(value.power) && value.power >= 0 && value.power <= 1000 &&
    isEquipmentStats(value.stats) &&
    (value.isNew === undefined || typeof value.isNew === 'boolean');
}
export type GuildChallengeStatus =
  | 'locked'
  | 'available'
  | 'in-progress'
  | 'submitted'
  | 'awaiting-validation'
  | 'revision-requested'
  | 'approved'
  | 'reward-available'
  | 'completed';
export type SpecialChallengeRewardTier = 'great' | 'epic' | 'extraordinary';
export type SpecialChallenge = {
  id: string;
  title: string;
  description: string;
  category: string;
  audience: 'guild' | 'group' | 'player';
  rewardTier: SpecialChallengeRewardTier;
  createdAt: string;
  expiresAt: string | null;
  createdBy: string;
  status: Exclude<GuildChallengeStatus, 'locked' | 'approved'>;
  submittedAt: string | null;
  validatedAt: string | null;
  rewardClaimed: boolean;
  collectiveTarget: number | null;
};
export type BibleReadingProgress = {
  genesis2Opened: string | null;
  genesis2Confirmed: boolean;
  genesis3Opened: string | null;
  genesis3Confirmed: boolean;
  comprehensionCompleted: boolean;
};
export const STARTER_EQUIPMENT: readonly Equipment[] = [
  {
    id: 'traveler-boots',
    name: 'Botas do Viajante',
    slot: 'boots',
    rarity: 'comum',
    power: 1,
    stats: { life: 1 },
  },
];
export const PATH_AMULET: Equipment = {
  id: 'wisdom-amulet',
  name: 'Medalhão do Caminho',
  slot: 'amulet',
  rarity: 'raro',
  power: 2,
  stats: { wisdom: 2 },
};
export const GARDEN_HELMET: Equipment = {
  id: 'traveler-helmet-rare',
  name: 'Elmo do Viajante',
  slot: 'helmet',
  rarity: 'raro',
  power: 2,
  stats: { defense: 1 },
};
export const DEFAULT_APPEARANCE: Appearance = {
  hair: 'curto',
  outfit: 'musgo',
  skin: 'medio',
};
// TASK-0008: apenas valores de protótipo; não constituem balanceamento aprovado.
export const BASE_ATTRIBUTES: Readonly<AttributeValues> = Object.freeze({
  life: 1,
  strength: 1,
  defense: 1,
  wisdom: 1,
});
export const PROTOTYPE_BASE_STATS = BASE_ATTRIBUTES;
export type Traveler = {
  id: string;
  name: string;
  level: number;
  xp: number;
  coins: number;
  attributes: AttributeValues;
  inventory: Equipment[];
  equipped: Partial<Record<EquipmentSlot, string>>;
  appearance: Appearance;
  avatar: AvatarConfig;
  progress: {
    introCompleted: boolean;
    currentPhase: 'garden-choice';
    gardenCompleted: boolean;
    gardenRewardGranted: boolean;
    gardenDiscoveryFound: boolean;
    guildId: string | null;
    guildChallengeStatus: GuildChallengeStatus;
    guildChallengeId: 'share-learning';
    guildChallengeSubmittedAt: string | null;
    guildChallengeValidatedAt: string | null;
    guildRewardClaimed: boolean;
    nextPhaseUnlocked: boolean;
    specialChallenges: SpecialChallenge[];
    guildActivities: Record<string, 'submitted' | 'approved' | 'claimed'>;
    diaryEntries: number;
    gardenExploredPoints: string[];
    gardenFragments: number;
    gardenStep: string;
    gardenOpenedChests: string[];
    gardenCollectedLoot: string[];
    gardenSecrets: string[];
    gardenEvents: string[];
    bibleReading: BibleReadingProgress;
    devotionalCompleted: boolean;
    devotionalReflection: string;
    explorationObjectives: string[];
    quizAttemptId: number;
  };
  createdAt: string;
};

export function validateName(value: string): string | null {
  const name = value.trim();
  if (name.length < 2 || name.length > 24)
    return 'Use entre 2 e 24 caracteres para o nome.';
  if (!/^[\p{L}][\p{L}\p{M}]*(?:[ '\-][\p{L}][\p{L}\p{M}]*)*$/u.test(name))
    return 'Use letras, espaços simples, hífen ou apóstrofo.';
  return null;
}

export function createTraveler(
  name: string,
  appearance: Appearance,
  id: string,
  createdAt: string,
): Traveler {
  const error = validateName(name);
  if (error) throw new Error(error);
  return {
    id,
    name: name.trim(),
    level: 1,
    xp: 0,
    coins: 0,
    attributes: { ...BASE_ATTRIBUTES },
    inventory: STARTER_EQUIPMENT.map((item) => ({ ...item })),
    equipped: { boots: 'traveler-boots' },
    appearance: { ...appearance },
    avatar: {
      ...DEFAULT_AVATAR,
      hair: appearance.hair === 'longo' ? 2 : appearance.hair === 'cacheado' ? 3 : 1,
      cloakColor: appearance.outfit,
      clothing: appearance.outfit,
      equippedItems: { boots: 'traveler-boots' },
    },
    progress: {
      introCompleted: false,
      currentPhase: 'garden-choice',
      gardenCompleted: false,
      gardenRewardGranted: false,
      gardenDiscoveryFound: false,
      guildId: null,
      guildChallengeStatus: 'locked',
      guildChallengeId: 'share-learning',
      guildChallengeSubmittedAt: null,
      guildChallengeValidatedAt: null,
      guildRewardClaimed: false,
      nextPhaseUnlocked: false,
      specialChallenges: [],
      guildActivities: {},
      diaryEntries: 0,
      gardenExploredPoints: [],
      gardenFragments: 0,
      gardenStep: 'opening',
      gardenOpenedChests: [],
      gardenCollectedLoot: [],
      gardenSecrets: [],
      gardenEvents: [],
      bibleReading: {
        genesis2Opened: null,
        genesis2Confirmed: false,
        genesis3Opened: null,
        genesis3Confirmed: false,
        comprehensionCompleted: false,
      },
      devotionalCompleted: false,
      devotionalReflection: '',
      explorationObjectives: [],
      quizAttemptId: 0,
    },
    createdAt,
  };
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));
const isSpecialChallenge = (value: unknown): value is SpecialChallenge =>
  record(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.description === 'string' &&
  typeof value.category === 'string' &&
  ['guild', 'group', 'player'].includes(String(value.audience)) &&
  ['great', 'epic', 'extraordinary'].includes(String(value.rewardTier)) &&
  typeof value.createdAt === 'string' &&
  (value.expiresAt === null || typeof value.expiresAt === 'string') &&
  typeof value.createdBy === 'string' &&
  ['available', 'in-progress', 'submitted', 'awaiting-validation', 'revision-requested', 'reward-available', 'completed'].includes(String(value.status)) &&
  (value.submittedAt === null || typeof value.submittedAt === 'string') &&
  (value.validatedAt === null || typeof value.validatedAt === 'string') &&
  typeof value.rewardClaimed === 'boolean' &&
  (value.collectiveTarget === null || typeof value.collectiveTarget === 'number');

/** Validação estrita da versão local: dados alterados nunca liberam atos ou recompensas. */
export function parseTraveler(value: unknown): Traveler | null {
  if (
    !record(value) ||
    !exactKeys(value, [
      'id',
      'name',
      'level',
      'xp',
      'coins',
      'attributes',
      'appearance',
      'avatar',
      'progress',
      'createdAt',
      'inventory',
      'equipped',
    ])
  )
    return null;
  if (
    typeof value.id !== 'string' ||
    !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value.id)
  )
    return null;
  if (!record(value.avatar) || !['male', 'female'].includes(String(value.avatar.gender)) ||
    typeof value.avatar.face !== 'number' || typeof value.avatar.hair !== 'number' ||
    typeof value.avatar.hairColor !== 'string' || typeof value.avatar.cloakColor !== 'string' ||
    typeof value.avatar.clothing !== 'string' ||
    !record(value.avatar.equippedItems) || !record(value.avatar.portraitConfig) ||
    value.avatar.portraitConfig.state !== 'idle') return null;
  const inventory = value.inventory;
  if (!Array.isArray(inventory) || !inventory.every(isEquipment) || !record(value.equipped) ||
    !Object.entries(value.equipped).every(([slot, id]) => EQUIPMENT_SLOTS.includes(slot as EquipmentSlot) &&
      typeof id === 'string' && inventory.some((item: Equipment) => item.id === id && item.slot === slot)) ||
    !Object.entries(value.avatar.equippedItems).every(([slot, id]) => EQUIPMENT_SLOTS.includes(slot as EquipmentSlot) && typeof id === 'string')) return null;
  if (
    typeof value.name !== 'string' ||
    validateName(value.name) ||
    value.name !== value.name.trim()
  )
    return null;
  if (
    typeof value.level !== 'number' ||
    value.level !== levelForXp(value.xp as number) ||
    typeof value.xp !== 'number' ||
    value.xp < 0 ||
    typeof value.coins !== 'number' ||
    value.coins < 0 ||
    !Number.isInteger(value.level) ||
    !Number.isInteger(value.xp) ||
    !Number.isInteger(value.coins)
  )
    return null;
  if (
    typeof value.createdAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.createdAt) ||
    !Number.isFinite(Date.parse(value.createdAt))
  )
    return null;
  const { attributes, appearance, progress } = value;
  if (
    !record(attributes) ||
    !exactKeys(attributes, [...ATTRIBUTE_KEYS]) ||
    !ATTRIBUTE_KEYS.every((key) => attributes[key] === BASE_ATTRIBUTES[key])
  )
    return null;
  if (
    !record(appearance) ||
    !exactKeys(appearance, ['hair', 'outfit', 'skin']) ||
    !HAIR.some((x) => x === appearance.hair) ||
    !OUTFITS.some((x) => x === appearance.outfit) ||
    !SKIN.some((x) => x === appearance.skin)
  )
    return null;
  if (
    !record(progress) ||
    !exactKeys(progress, [
      'introCompleted',
      'currentPhase',
      'gardenCompleted',
      'gardenRewardGranted',
      'gardenDiscoveryFound',
      'guildId',
      'guildChallengeStatus',
      'guildChallengeId',
      'guildChallengeSubmittedAt',
      'guildChallengeValidatedAt',
      'guildRewardClaimed',
      'nextPhaseUnlocked',
      'specialChallenges',
      'guildActivities',
      'diaryEntries',
      'gardenExploredPoints',
      'gardenFragments',
      'gardenStep',
      'gardenOpenedChests',
      'gardenCollectedLoot',
      'gardenSecrets',
      'gardenEvents',
      'bibleReading',
      'devotionalCompleted',
      'devotionalReflection',
      'explorationObjectives',
      'quizAttemptId',
    ]) ||
    typeof progress.introCompleted !== 'boolean' ||
    progress.currentPhase !== 'garden-choice' ||
    typeof progress.gardenCompleted !== 'boolean' ||
    typeof progress.gardenRewardGranted !== 'boolean' ||
    typeof progress.gardenDiscoveryFound !== 'boolean' ||
    !(progress.guildId === null || typeof progress.guildId === 'string') ||
    !['locked', 'available', 'in-progress', 'submitted', 'awaiting-validation', 'revision-requested', 'approved', 'reward-available', 'completed'].includes(
      String(progress.guildChallengeStatus),
    ) ||
    progress.guildChallengeId !== 'share-learning' ||
    !(progress.guildChallengeSubmittedAt === null || typeof progress.guildChallengeSubmittedAt === 'string') ||
    !(progress.guildChallengeValidatedAt === null || typeof progress.guildChallengeValidatedAt === 'string') ||
    typeof progress.guildRewardClaimed !== 'boolean' ||
    typeof progress.nextPhaseUnlocked !== 'boolean' ||
    !Array.isArray(progress.specialChallenges) ||
    !progress.specialChallenges.every(isSpecialChallenge) ||
    !record(progress.guildActivities) ||
    !Object.entries(progress.guildActivities).every(([id, status]) => id.length > 0 && id.length <= 64 && ['submitted', 'approved', 'claimed'].includes(String(status))) ||
    typeof progress.diaryEntries !== 'number' ||
    !Number.isInteger(progress.diaryEntries) ||
    progress.diaryEntries < 0
    || !Array.isArray(progress.gardenExploredPoints) ||
    !progress.gardenExploredPoints.every((point) => typeof point === 'string') ||
    typeof progress.gardenFragments !== 'number' ||
    !Number.isInteger(progress.gardenFragments) || progress.gardenFragments < 0 ||
    progress.gardenFragments > 3 || typeof progress.gardenStep !== 'string' ||
    !Array.isArray(progress.gardenOpenedChests) ||
    !progress.gardenOpenedChests.every((id) => typeof id === 'string') ||
    !Array.isArray(progress.gardenCollectedLoot) ||
    !progress.gardenCollectedLoot.every((id) => typeof id === 'string') ||
    !Array.isArray(progress.gardenSecrets) ||
    !progress.gardenSecrets.every((id) => typeof id === 'string') ||
    !Array.isArray(progress.gardenEvents) ||
    !progress.gardenEvents.every((id) => typeof id === 'string') ||
    !record(progress.bibleReading) ||
    !exactKeys(progress.bibleReading, ['genesis2Opened', 'genesis2Confirmed', 'genesis3Opened', 'genesis3Confirmed', 'comprehensionCompleted']) ||
    !(progress.bibleReading.genesis2Opened === null || typeof progress.bibleReading.genesis2Opened === 'string') ||
    typeof progress.bibleReading.genesis2Confirmed !== 'boolean' ||
    !(progress.bibleReading.genesis3Opened === null || typeof progress.bibleReading.genesis3Opened === 'string') ||
    typeof progress.bibleReading.genesis3Confirmed !== 'boolean' ||
    typeof progress.bibleReading.comprehensionCompleted !== 'boolean' ||
    typeof progress.devotionalCompleted !== 'boolean' ||
    typeof progress.devotionalReflection !== 'string' ||
    progress.devotionalReflection.length > 800 ||
    !Array.isArray(progress.explorationObjectives) ||
    !progress.explorationObjectives.every((id) => typeof id === 'string') ||
    typeof progress.quizAttemptId !== 'number' ||
    !Number.isInteger(progress.quizAttemptId) || progress.quizAttemptId < 0
  )
    return null;
  return value as Traveler;
}
