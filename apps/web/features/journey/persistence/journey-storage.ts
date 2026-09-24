import { DEFAULT_AVATAR, PATH_AMULET, parseTraveler, type Traveler } from '../domain/traveler';
import { levelForXp } from '../data/progression';
import { GUILD_CONTENT_KEY } from '../data/guildContent';
import { EQUIPMENT_CATALOG } from '../data/equipmentCatalog';
import { ARENA_STORAGE_KEY } from './arena-storage';
export const STORAGE_KEY = 'rpg-jovem-cristao:journey:v1';
export const SESSION_KEY = 'rpg-jovem-cristao:active-traveler:v1';
export const ACTIVE_TRAVELER_ID_KEY = 'rpg-jovem-cristao:active-traveler-id:v1';
export type LoadResult =
  | { status: 'ready'; traveler: Traveler }
  | { status: 'empty' | 'corrupt' | 'unavailable' };
export interface JourneyRepository {
  load(): LoadResult;
  listSaved(): Traveler[];
  save(traveler: Traveler): boolean;
  saveNew(traveler: Traveler): boolean;
  clear(): boolean;
  isSessionActive(): boolean;
  startSession(travelerId: string): boolean;
  activeTravelerId(): string | null;
  logout(): boolean;
}
type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const MAX_STORAGE_LENGTH = 4 * 1024 * 1024;
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function migrateBaseAttributes(value: unknown): unknown {
  if (!record(value)) return value;
  if (['life', 'strength', 'defense', 'wisdom'].every((key) => Object.hasOwn(value, key))) return value;
  if (['vigor', 'dexterity', 'perception', 'wisdom'].every((key) => Object.hasOwn(value, key))) {
    return {
      life: value.vigor,
      strength: value.dexterity,
      defense: value.perception,
      wisdom: value.wisdom,
    };
  }
  return value;
}
function migrateTravelerCandidate(candidate: unknown): unknown {
  if (!record(candidate)) return candidate;
  const currentProgress = record(candidate.progress) ? candidate.progress : {};
  const currentAvatar = record(candidate.avatar) ? candidate.avatar : {};
  const currentBibleReading = record(currentProgress.bibleReading) ? currentProgress.bibleReading : {};
  const legacyStatus = String(currentProgress.guildChallengeStatus ?? 'locked');
  const guildChallengeStatus = legacyStatus === 'pending'
    ? 'awaiting-validation'
    : legacyStatus === 'approved'
      ? 'reward-available'
      : legacyStatus === 'available' && currentProgress.guildId == null
        ? 'locked'
        : legacyStatus;
  const preservedLegacyGuild = ['in-progress', 'pending', 'approved'].includes(legacyStatus)
    ? 'guild-local-migrated'
    : null;
  return {
    ...candidate,
    attributes: migrateBaseAttributes(candidate.attributes),
    level: typeof candidate.xp === 'number' && Number.isSafeInteger(candidate.xp) && candidate.xp >= 0 ? levelForXp(candidate.xp) : candidate.level,
    inventory: Array.isArray(candidate.inventory) ? candidate.inventory.map((item) => {
      if (!record(item)) return item;
      const canonical = EQUIPMENT_CATALOG.find((entry) => entry.id === item.id);
      return {
        ...item,
        ...(item.id === PATH_AMULET.id ? { name: PATH_AMULET.name } : {}),
        ...(canonical ? { stats: { ...canonical.stats } } : {}),
      };
    }) : candidate.inventory,
    avatar: {
      ...DEFAULT_AVATAR,
      ...currentAvatar,
      equippedItems: record(currentAvatar.equippedItems) ? currentAvatar.equippedItems : {},
    },
    progress: {
      ...currentProgress,
      guildId: typeof currentProgress.guildId === 'string' ? currentProgress.guildId : preservedLegacyGuild,
      guildChallengeStatus,
      guildChallengeSubmittedAt: typeof currentProgress.guildChallengeSubmittedAt === 'string' ? currentProgress.guildChallengeSubmittedAt : null,
      guildChallengeValidatedAt: typeof currentProgress.guildChallengeValidatedAt === 'string' ? currentProgress.guildChallengeValidatedAt : null,
      guildRewardClaimed: typeof currentProgress.guildRewardClaimed === 'boolean' ? currentProgress.guildRewardClaimed : false,
      nextPhaseUnlocked: typeof currentProgress.nextPhaseUnlocked === 'boolean' ? currentProgress.nextPhaseUnlocked : false,
      specialChallenges: Array.isArray(currentProgress.specialChallenges) ? currentProgress.specialChallenges : [],
      guildActivities: record(currentProgress.guildActivities) ? currentProgress.guildActivities : {},
      gardenExploredPoints: Array.isArray(currentProgress.gardenExploredPoints) ? currentProgress.gardenExploredPoints : [],
      gardenFragments: typeof currentProgress.gardenFragments === 'number' ? currentProgress.gardenFragments : 0,
      gardenStep: typeof currentProgress.gardenStep === 'string' ? currentProgress.gardenStep : 'opening',
      gardenOpenedChests: Array.isArray(currentProgress.gardenOpenedChests) ? currentProgress.gardenOpenedChests : [],
      gardenCollectedLoot: Array.isArray(currentProgress.gardenCollectedLoot) ? currentProgress.gardenCollectedLoot : [],
      gardenSecrets: Array.isArray(currentProgress.gardenSecrets) ? currentProgress.gardenSecrets : [],
      gardenEvents: Array.isArray(currentProgress.gardenEvents) ? currentProgress.gardenEvents : [],
      bibleReading: {
        genesis2Opened: typeof currentBibleReading.genesis2Opened === 'string' ? currentBibleReading.genesis2Opened : null,
        genesis2Confirmed: typeof currentBibleReading.genesis2Confirmed === 'boolean' ? currentBibleReading.genesis2Confirmed : false,
        genesis3Opened: typeof currentBibleReading.genesis3Opened === 'string' ? currentBibleReading.genesis3Opened : null,
        genesis3Confirmed: typeof currentBibleReading.genesis3Confirmed === 'boolean' ? currentBibleReading.genesis3Confirmed : false,
        comprehensionCompleted: typeof currentBibleReading.comprehensionCompleted === 'boolean' ? currentBibleReading.comprehensionCompleted : false,
      },
      devotionalCompleted: typeof currentProgress.devotionalCompleted === 'boolean' ? currentProgress.devotionalCompleted : false,
      devotionalReflection: typeof currentProgress.devotionalReflection === 'string' ? currentProgress.devotionalReflection.slice(0, 800) : '',
      explorationObjectives: Array.isArray(currentProgress.explorationObjectives) ? currentProgress.explorationObjectives.filter((id) => typeof id === 'string') : [],
      quizAttemptId: typeof currentProgress.quizAttemptId === 'number' && Number.isInteger(currentProgress.quizAttemptId) && currentProgress.quizAttemptId >= 0 ? currentProgress.quizAttemptId : 0,
    },
  };
}

export function createJourneyRepository(
  storage: () => StoragePort,
): JourneyRepository {
  return {
    load() {
      let raw: string | null;
      try {
        raw = storage().getItem(STORAGE_KEY);
      } catch {
        return { status: 'unavailable' };
      }
      if (raw === null) return { status: 'empty' };
      if (raw.length > MAX_STORAGE_LENGTH) return { status: 'corrupt' };
      try {
        const parsed: unknown = JSON.parse(raw);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('version' in parsed) ||
          ![1, 2].includes(parsed.version as number) ||
          (!('traveler' in parsed) && !('travelers' in parsed))
        )
          return { status: 'corrupt' };
        const candidate = 'travelers' in parsed
          ? (Array.isArray(parsed.travelers) ? parsed.travelers.find((item) => item && typeof item === 'object' && item.id === storage().getItem(ACTIVE_TRAVELER_ID_KEY)) ?? parsed.travelers[0] : null)
          : parsed.traveler;
        // Migrate the previous full local schema, which had appearance but no
        // avatar registry fields. Existing progress and equipment are retained.
        const migrated = migrateTravelerCandidate(candidate);
        const traveler = parseTraveler(migrated);
        return traveler ? { status: 'ready', traveler } : { status: 'corrupt' };
      } catch {
        return { status: 'corrupt' };
      }
    },
    listSaved() {
      try {
        const raw = storage().getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!record(parsed)) return [];
        const candidates = 'travelers' in parsed ? parsed.travelers : 'traveler' in parsed ? [parsed.traveler] : [];
        return Array.isArray(candidates) ? candidates.map((candidate) => {
          const migrated = migrateTravelerCandidate(candidate);
          return parseTraveler(migrated);
        }).filter((traveler): traveler is Traveler => traveler !== null) : [];
      } catch { return []; }
    },
    save(traveler) {
      const valid = parseTraveler(traveler);
      if (!valid) return false;
      try {
        const travelers = this.listSaved().map((saved) => saved.id === valid.id ? valid : saved);
        if (!travelers.some((saved) => saved.id === valid.id)) travelers.push(valid);
        storage().setItem(STORAGE_KEY, JSON.stringify({ version: 2, travelers }));
        return true;
      } catch {
        return false;
      }
    },
    saveNew(traveler) {
      const valid = parseTraveler(traveler);
      if (!valid) return false;
      try {
        const travelers = this.listSaved();
        if (travelers.some((saved) => saved.id === valid.id)) return false;
        travelers.push(valid);
        storage().setItem(STORAGE_KEY, JSON.stringify({ version: 2, travelers }));
        return true;
      } catch { return false; }
    },
    clear() {
      try {
        storage().removeItem(STORAGE_KEY);
        storage().removeItem(SESSION_KEY);
        storage().removeItem(ACTIVE_TRAVELER_ID_KEY);
        storage().removeItem(GUILD_CONTENT_KEY);
        storage().removeItem(ARENA_STORAGE_KEY);
        return true;
      } catch {
        return false;
      }
    },
    isSessionActive() {
      try {
        return storage().getItem(SESSION_KEY) === 'active';
      } catch {
        return false;
      }
    },
    startSession(travelerId) {
      try {
        storage().setItem(SESSION_KEY, 'active');
        storage().setItem(ACTIVE_TRAVELER_ID_KEY, travelerId);
        return true;
      } catch {
        return false;
      }
    },
    logout() {
      try {
        storage().removeItem(SESSION_KEY);
        storage().removeItem(ACTIVE_TRAVELER_ID_KEY);
        return true;
      } catch {
        return false;
      }
    },
    activeTravelerId() {
      try {
        return storage().getItem(ACTIVE_TRAVELER_ID_KEY);
      } catch {
        return null;
      }
    },
  };
}

// Único acesso ao localStorage de produção, resolvido somente no browser.
export const journeyRepository = createJourneyRepository(
  () => window.localStorage,
);
