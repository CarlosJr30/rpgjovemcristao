import { levelForXp } from '../../features/journey/data/progression';
import { EQUIPMENT_CATALOG } from '../../features/journey/data/equipmentCatalog';
import {
  createTraveler,
  parseTraveler,
  type Appearance,
  type EquipmentSlot,
  type Traveler,
} from '../../features/journey/domain/traveler';
import { journeyRepository } from '../../features/journey/persistence/journey-storage';
import type {
  EquippedItemRow,
  InventoryRow,
  TravelerRow,
  TravelerStatsRow,
  WalletRow,
} from './database.types';
import { equipmentRepository } from './repositories/equipment-repository';
import { inventoryRepository } from './repositories/inventory-repository';
import { statsRepository } from './repositories/stats-repository';
import { travelerRepository } from './repositories/traveler-repository';
import { walletRepository } from './repositories/wallet-repository';
import { OnlinePersistenceError } from './repositories/errors';

export const ONLINE_CACHE_EVENT = 'rpg-jovem-cristao:online-cache-change';
const ONLINE_OWNERS_KEY = 'rpg-jovem-cristao:online-owner:v1';

type SyncStatus = Readonly<{
  state: 'idle' | 'syncing' | 'synced' | 'fallback' | 'error';
  message: string | null;
}>;

let currentOnlineUserId: string | null = null;
// A user ID alone cannot distinguish logout/login of the same account.
let onlineSessionRevision = 0;
let hydrationRevision = 0;
let selectionRevision = 0;
let nextTravelerReadRevision = 0;
const travelerReadRevisions = new Map<string, number>();
let currentRemoteTravelerIds: ReadonlySet<string> | null = null;
let currentRemoteActiveTravelerId: string | null = null;
let syncStatus: SyncStatus = { state: 'idle', message: null };
const syncListeners = new Set<() => void>();
const queues = new Map<string, Promise<void>>();

const readOwners = (): Record<string, string> => {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(ONLINE_OWNERS_KEY) ?? '{}',
    );
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([travelerId, userId]) =>
          /^[\da-f-]{36}$/i.test(travelerId) &&
          typeof userId === 'string' &&
          /^[\da-f-]{36}$/i.test(userId),
      ),
    );
  } catch {
    return {};
  }
};

const writeOwners = (owners: Record<string, string>) => {
  try {
    localStorage.setItem(ONLINE_OWNERS_KEY, JSON.stringify(owners));
  } catch {
    // O save principal continua preservado pelo repositório local existente.
  }
};

const markOwned = (travelerId: string, userId: string) => {
  writeOwners({ ...readOwners(), [travelerId]: userId });
};

const setSyncStatus = (next: SyncStatus) => {
  syncStatus = next;
  syncListeners.forEach((listener) => listener());
};

const notifyCacheChanged = () =>
  window.dispatchEvent(new Event(ONLINE_CACHE_EVENT));

export const getOnlineSyncStatus = () => syncStatus;
export const subscribeOnlineSync = (listener: () => void) => {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
};

export const setCurrentOnlineUser = (userId: string | null) => {
  onlineSessionRevision++;
  travelerReadRevisions.clear();
  currentOnlineUserId = userId;
  currentRemoteTravelerIds = null;
  currentRemoteActiveTravelerId = null;
};

export const getCurrentOnlineUserId = () => currentOnlineUserId;
export const getOnlineSessionRevision = () => onlineSessionRevision;
export const getCurrentRemoteActiveTravelerId = () =>
  currentRemoteActiveTravelerId;

export type OnlineTravelerCreationResult =
  | Readonly<{ status: 'created'; travelerId: string }>
  | Readonly<{ status: 'error'; message: string }>;

export const listTravelersForCurrentSession = (): Traveler[] => {
  const owners = readOwners();
  const saved = journeyRepository.listSaved();
  if (currentOnlineUserId) {
    const allowed = currentRemoteTravelerIds;
    return saved.filter(
      (traveler) =>
        owners[traveler.id] === currentOnlineUserId &&
        (allowed === null || allowed.has(traveler.id)),
    );
  }
  return saved.filter((traveler) => !owners[traveler.id]);
};

export const canUseTravelerInCurrentSession = (travelerId: string): boolean =>
  listTravelersForCurrentSession().some(
    (traveler) => traveler.id === travelerId,
  );

export const getLocalTravelerSnapshot = (
  travelerId: string,
): Traveler | null => {
  const traveler = journeyRepository
    .listSaved()
    .find((candidate) => candidate.id === travelerId);
  if (!traveler) return null;
  return parseTraveler(JSON.parse(JSON.stringify(traveler)) as unknown);
};

const appearanceValue = <T extends readonly string[]>(
  value: string | null,
  allowed: T,
  fallback: T[number],
): T[number] => (allowed.includes(value ?? '') ? value : fallback) as T[number];

const toLocalTraveler = (
  row: TravelerRow,
  stats: TravelerStatsRow,
  wallet: WalletRow,
  inventory: InventoryRow[],
  equipped: EquippedItemRow[],
  cached: Traveler | null,
): Traveler => {
  const appearance: Appearance = {
    hair: appearanceValue(
      row.hair_style,
      ['curto', 'longo', 'cacheado'] as const,
      'curto',
    ),
    outfit: appearanceValue(
      row.avatar_variant,
      ['musgo', 'ocre', 'azul'] as const,
      'musgo',
    ),
    skin: appearanceValue(
      row.skin_tone,
      ['claro', 'medio', 'escuro'] as const,
      'medio',
    ),
  };
  const base = createTraveler(
    row.name,
    appearance,
    row.id,
    new Date(row.created_at).toISOString(),
  );
  // Legacy rows keep their browser progress until their next normal save.
  // Remote progress is validated as game data; it never grants server permissions.
  const remoteProgress =
    row.journey_progress &&
    typeof row.journey_progress === 'object' &&
    !Array.isArray(row.journey_progress)
      ? parseTraveler({
          ...base,
          progress: { ...base.progress, ...row.journey_progress },
        })?.progress
      : null;
  const ownedItems = inventory.flatMap((entry) => {
    const catalogItem = EQUIPMENT_CATALOG.find(
      (item) => item.id === entry.item_id,
    );
    return catalogItem
      ? [
          {
            ...catalogItem,
            stats: { ...catalogItem.stats },
            quantity: entry.quantity,
            isNew: false,
          },
        ]
      : [];
  });
  const equippedSlots = Object.fromEntries(
    equipped.flatMap((entry) => {
      const item = ownedItems.find(
        (candidate) =>
          candidate.id === entry.item_id && candidate.slot === entry.slot,
      );
      return item ? [[entry.slot as EquipmentSlot, entry.item_id]] : [];
    }),
  ) as Partial<Record<EquipmentSlot, string>>;

  return {
    ...(cached ?? base),
    progress: remoteProgress ?? cached?.progress ?? base.progress,
    id: row.id,
    name: row.name,
    level: levelForXp(row.xp),
    xp: row.xp,
    coins: wallet.coins,
    attributes: {
      life: stats.base_life,
      strength: stats.base_strength,
      defense: stats.base_defense,
      wisdom: stats.base_wisdom,
    },
    inventory: ownedItems,
    equipped: equippedSlots,
    appearance,
    avatar: {
      ...(cached?.avatar ?? base.avatar),
      gender: row.body_type === 'female' ? 'female' : 'male',
      hairColor: row.hair_color ?? base.avatar.hairColor,
      cloakColor: appearance.outfit,
      clothing: appearance.outfit,
      equippedItems: equippedSlots,
    },
    createdAt: new Date(row.created_at).toISOString(),
  };
};

export type ArchiveSnapshot = {
  traveler: Traveler;
  inventory: InventoryRow[];
  persistedProgress: boolean;
};

// A fresh read for the archive: never saves, marks active, or uses browser history.
export async function readOnlineArchive(
  travelerId: string,
): Promise<ArchiveSnapshot> {
  const userId = currentOnlineUserId;
  const session = onlineSessionRevision;
  if (!userId || !canUseTravelerInCurrentSession(travelerId))
    throw new Error('Viajante indisponível nesta conta.');
  const row = await travelerRepository.getTravelerById(travelerId, userId);
  if (!row) throw new Error('Viajante indisponível nesta conta.');
  const [stats, wallet, inventory, equipped] = await Promise.all([
    statsRepository.getTravelerStats(row.id),
    walletRepository.getWallet(row.id),
    inventoryRepository.getInventory(row.id),
    equipmentRepository.getEquippedItems(row.id),
  ]);
  if (
    !stats ||
    !wallet ||
    currentOnlineUserId !== userId ||
    onlineSessionRevision !== session ||
    !canUseTravelerInCurrentSession(travelerId)
  )
    throw new Error('A sessão mudou. Entre novamente.');
  const traveler = toLocalTraveler(
    row,
    stats,
    wallet,
    inventory,
    equipped,
    null,
  );
  const base = createTraveler(
    row.name,
    traveler.appearance,
    row.id,
    traveler.createdAt,
  );
  const progress = row.journey_progress;
  const persistedProgress =
    !!progress &&
    typeof progress === 'object' &&
    !Array.isArray(progress) &&
    !!parseTraveler({ ...base, progress: { ...base.progress, ...progress } });
  return { traveler, inventory, persistedProgress };
}

const loadRemoteTraveler = async (
  userId: string,
  row: TravelerRow,
): Promise<Traveler> => {
  const [stats, wallet, inventory, equipped] = await Promise.all([
    statsRepository.getTravelerStats(row.id),
    walletRepository.getWallet(row.id),
    inventoryRepository.getInventory(row.id),
    equipmentRepository.getEquippedItems(row.id),
  ]);
  if (!stats || !wallet)
    throw new Error('Dados essenciais do Viajante estão incompletos.');
  const cached =
    readOwners()[row.id] === userId ? getLocalTravelerSnapshot(row.id) : null;
  return toLocalTraveler(row, stats, wallet, inventory, equipped, cached);
};

export const hydrateOnlineTravelers = async (userId: string): Promise<void> => {
  if (currentOnlineUserId !== userId) return;
  const session = onlineSessionRevision;
  const hydration = ++hydrationRevision;
  const selection = selectionRevision;
  const read = ++nextTravelerReadRevision;
  const isCurrent = () =>
    onlineSessionRevision === session &&
    currentOnlineUserId === userId &&
    hydrationRevision === hydration &&
    selectionRevision === selection;
  setSyncStatus({ state: 'syncing', message: null });
  try {
    const rows = await travelerRepository.getTravelersByUser(userId);
    const travelers = await Promise.all(
      rows.map((row) => loadRemoteTraveler(userId, row)),
    );
    if (!isCurrent()) return;
    // An equipment/authority refresh started later owns the newer snapshot.
    if (travelers.some((t) => (travelerReadRevisions.get(t.id) ?? 0) > read))
      return;
    currentRemoteTravelerIds = new Set(
      travelers.map((traveler) => traveler.id),
    );
    for (const traveler of travelers) {
      travelerReadRevisions.set(traveler.id, read);
      markOwned(traveler.id, userId);
      if (!journeyRepository.save(traveler))
        throw new Error('Cache local indisponível.');
    }
    const active = travelers.find(
      (traveler) => rows.find((row) => row.id === traveler.id)?.is_active,
    );
    currentRemoteActiveTravelerId = active?.id ?? null;
    journeyRepository.clearActiveTraveler();
    const resumed = active ?? travelers[0];
    if (resumed && !journeyRepository.startSession(resumed.id))
      throw new Error('Não foi possível retomar seu herói.');
    setSyncStatus({ state: 'synced', message: null });
    notifyCacheChanged();
  } catch {
    if (!isCurrent()) return;
    currentRemoteTravelerIds = null;
    currentRemoteActiveTravelerId = null;
    journeyRepository.clearActiveTraveler();
    setSyncStatus({
      state: 'fallback',
      message: 'Usando dados locais temporariamente.',
    });
    notifyCacheChanged();
  }
};

export const reloadOnlineTraveler = async (
  travelerId: string,
): Promise<boolean> => {
  const userId = currentOnlineUserId;
  if (!userId) return false;
  const session = onlineSessionRevision;
  const revision = ++nextTravelerReadRevision;
  travelerReadRevisions.set(travelerId, revision);
  const isCurrent = () =>
    onlineSessionRevision === session &&
    currentOnlineUserId === userId &&
    travelerReadRevisions.get(travelerId) === revision;
  try {
    const row = await travelerRepository.getTravelerById(travelerId, userId);
    if (!row || !isCurrent()) return false;
    const traveler = await loadRemoteTraveler(userId, row);
    if (!isCurrent()) return false;
    if (!journeyRepository.save(traveler)) return false;
    notifyCacheChanged();
    return true;
  } catch {
    return false;
  }
};

// Legacy snapshots carry no economic authority. Only cosmetic fields are sent.
const synchronizeTravelerSnapshot = async (
  userId: string,
  _previous: Traveler | null,
  traveler: Traveler,
) => {
  const existing = await travelerRepository.getTravelerById(
    traveler.id,
    userId,
  );
  if (!existing) throw new Error('Viajante online indisponivel.');
  await travelerRepository.updateTraveler(traveler.id, userId, traveler);
};

const enqueue = (travelerId: string, operation: () => Promise<void>) => {
  const previous = queues.get(travelerId) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(operation)
    .then(() => setSyncStatus({ state: 'synced', message: null }))
    .catch(() => {
      setSyncStatus({
        state: 'fallback',
        message:
          'Não foi possível salvar online. Seus dados locais foram preservados.',
      });
    })
    .finally(() => {
      if (queues.get(travelerId) === next) queues.delete(travelerId);
    });
  queues.set(travelerId, next);
};

export const createOnlineTraveler = async (
  userId: string,
  traveler: Traveler,
): Promise<OnlineTravelerCreationResult> => {
  setSyncStatus({ state: 'syncing', message: null });
  try {
    const returnedId = await travelerRepository.createTraveler(traveler);
    if (returnedId !== traveler.id)
      throw new Error('A criação remota retornou um Viajante inesperado.');

    await travelerRepository.setActiveTraveler(returnedId);
    const row = await travelerRepository.getTravelerById(returnedId, userId);
    if (!row)
      throw new Error('O Viajante criado não foi encontrado no Supabase.');
    const remoteTraveler = await loadRemoteTraveler(userId, row);

    if (!journeyRepository.save(remoteTraveler))
      throw new Error('Cache local indisponível.');
    if (!journeyRepository.startSession(remoteTraveler.id))
      throw new Error('Sessão local indisponível.');

    markOwned(remoteTraveler.id, userId);
    currentRemoteTravelerIds = new Set([
      ...(currentRemoteTravelerIds ?? []),
      remoteTraveler.id,
    ]);
    currentRemoteActiveTravelerId = remoteTraveler.id;
    setSyncStatus({ state: 'synced', message: null });
    notifyCacheChanged();
    return { status: 'created', travelerId: remoteTraveler.id };
  } catch (error) {
    const baseMessage =
      'Não conseguimos salvar seu Viajante online. Tente novamente.';
    const developmentDetails =
      error instanceof OnlinePersistenceError
        ? (error.developmentDetails ?? error.message)
        : error instanceof Error
          ? error.message
          : 'Erro remoto desconhecido.';
    const message =
      process.env.NODE_ENV === 'development'
        ? `${baseMessage} ${developmentDetails}`
        : baseMessage;
    setSyncStatus({ state: 'error', message });
    return { status: 'error', message };
  }
};

export const queueOnlineTravelerSync = (
  previous: Traveler,
  traveler: Traveler,
) => {
  if (!currentOnlineUserId || readOwners()[traveler.id] !== currentOnlineUserId)
    return;
  const essential = (value: Traveler) => ({
    name: value.name,
    level: value.level,
    xp: value.xp,
    coins: value.coins,
    attributes: value.attributes,
    inventory: value.inventory.map((item) => item.id).sort(),
    equipped: value.equipped,
    appearance: value.appearance,
    gender: value.avatar.gender,
    hairColor: value.avatar.hairColor,
    progress: value.progress,
  });
  if (
    JSON.stringify(essential(previous)) === JSON.stringify(essential(traveler))
  )
    return;
  const userId = currentOnlineUserId;
  setSyncStatus({ state: 'syncing', message: null });
  enqueue(traveler.id, () =>
    synchronizeTravelerSnapshot(userId, previous, traveler),
  );
};

export const selectOnlineTraveler = async (
  travelerId: string,
): Promise<boolean> => {
  if (!currentOnlineUserId || readOwners()[travelerId] !== currentOnlineUserId)
    return false;
  const session = onlineSessionRevision;
  const selection = ++selectionRevision;
  const isCurrent = () =>
    onlineSessionRevision === session && selectionRevision === selection;
  setSyncStatus({ state: 'syncing', message: null });
  try {
    await travelerRepository.setActiveTraveler(travelerId);
    if (!isCurrent()) return false;
    currentRemoteActiveTravelerId = travelerId;
    setSyncStatus({ state: 'synced', message: null });
    return true;
  } catch {
    if (!isCurrent()) return false;
    setSyncStatus({
      state: 'error',
      message: 'Não foi possível selecionar o Viajante online.',
    });
    return false;
  }
};

export const protectSignedOutCache = () => {
  const activeId = journeyRepository.activeTravelerId();
  if (activeId && readOwners()[activeId])
    journeyRepository.clearActiveTraveler();
  notifyCacheChanged();
};
