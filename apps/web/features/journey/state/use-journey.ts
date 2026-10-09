'use client';
import { useSyncExternalStore } from 'react';
import {
  createTraveler,
  type Appearance,
  type SpecialChallenge,
  type SpecialChallengeRewardTier,
  type Traveler,
} from '../domain/traveler';
import {
  PHASE_GUILD_REWARD,
  specialChallengeRewardTables,
} from '../data/guildRewards';
import { addGameplayReward } from '../data/progression';
import type { ChestType } from '@rpg/game-engine';
import {
  grantChest,
  openChestLocal,
  purchaseChestLocal,
  type ChestReward,
} from '../data/chests';
import { purchaseFromShop, type PurchaseResult } from '../data/shop';
import {
  guildContentRepository,
  GUILD_REWARDS,
  type GuildContent,
} from '../data/guildContent';
import { localGuildRepository, normalizeGuildCode } from '../data/localGuilds';
import {
  journeyRepository,
  SESSION_KEY,
  ACTIVE_TRAVELER_ID_KEY,
  STORAGE_KEY,
  type LoadResult,
} from '../persistence/journey-storage';
import {
  getAuthenticatedUser,
  getSession,
  signOut as signOutOnline,
} from '../../../lib/supabase/auth';
import {
  ONLINE_CACHE_EVENT,
  canUseTravelerInCurrentSession,
  createOnlineTraveler,
  getCurrentOnlineUserId,
  queueOnlineTravelerSync,
  selectOnlineTraveler,
} from '../../../lib/supabase/online-sync';

type Snapshot =
  | LoadResult
  | { status: 'logged-out'; traveler: Traveler }
  | { status: 'loading' };
const initial: Snapshot = { status: 'loading' };
let snapshot: Snapshot = initial;
const listeners = new Set<() => void>();
function refresh() {
  const saved = journeyRepository.load();
  snapshot =
    saved.status === 'ready' &&
    (!journeyRepository.isSessionActive() ||
      journeyRepository.activeTravelerId() !== saved.traveler.id)
      ? { status: 'logged-out', traveler: saved.traveler }
      : saved;
  listeners.forEach((listener) => listener());
}
function onStorage(event: StorageEvent) {
  if (
    event.key === STORAGE_KEY ||
    event.key === SESSION_KEY ||
    event.key === ACTIVE_TRAVELER_ID_KEY ||
    event.key === null
  )
    refresh();
}
function onOnlineCacheChange() {
  refresh();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);
    window.addEventListener(ONLINE_CACHE_EVENT, onOnlineCacheChange);
    refresh();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(ONLINE_CACHE_EVENT, onOnlineCacheChange);
    }
  };
}
export function useJourney() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initial,
  );
}

export async function registerTraveler(
  name: string,
  appearance: Appearance,
  bodyType: 'male' | 'female' = 'male',
  authenticatedUserId: string | null | undefined = undefined,
): Promise<string | null> {
  try {
    if (authenticatedUserId === undefined)
      return 'Entre em sua conta ou escolha continuar somente neste navegador.';

    const session = await getSession();
    const verifiedUser = session ? await getAuthenticatedUser() : null;
    if (process.env.NODE_ENV === 'development') {
      console.info('[AUTH] user present:', Boolean(verifiedUser?.id));
      console.info('[AUTH] user id:', verifiedUser?.id ?? null);
    }

    const requiresOnlineCreation =
      authenticatedUserId !== null || session !== null;
    if (requiresOnlineCreation) {
      if (
        !session?.user.id ||
        !verifiedUser?.id ||
        session.user.id !== verifiedUser.id ||
        (authenticatedUserId !== null &&
          authenticatedUserId !== verifiedUser.id)
      ) {
        return 'Não foi possível validar sua sessão do Supabase. Entre novamente e tente de novo.';
      }
    }

    const traveler = createTraveler(
      name,
      appearance,
      crypto.randomUUID(),
      new Date().toISOString(),
    );
    traveler.avatar.gender = bodyType;

    if (verifiedUser) {
      const result = await createOnlineTraveler(verifiedUser.id, traveler);
      refresh();
      return result.status === 'created' ? null : result.message;
    }

    if (!journeyRepository.saveNew(traveler))
      return 'Não foi possível salvar. Permita o armazenamento deste site e tente novamente.';
    journeyRepository.startSession(traveler.id);
    refresh();
    return null;
  } catch {
    return 'Não foi possível criar o Viajante. Confira o nome e tente novamente.';
  }
}
export async function resumeJourney(travelerId?: string): Promise<boolean> {
  const loaded = journeyRepository.load();
  const saved = travelerId
    ? journeyRepository
        .listSaved()
        .find((traveler) => traveler.id === travelerId)
    : loaded.status === 'ready'
      ? loaded.traveler
      : undefined;
  if (!saved) {
    refresh();
    return false;
  }
  if (getCurrentOnlineUserId() && !canUseTravelerInCurrentSession(saved.id)) {
    refresh();
    return false;
  }
  if (getCurrentOnlineUserId() && !(await selectOnlineTraveler(saved.id))) {
    refresh();
    return false;
  }
  if (!journeyRepository.startSession(saved.id)) return false;
  refresh();
  return snapshot.status === 'ready';
}
export function switchTraveler(): boolean {
  const cleared = journeyRepository.clearActiveTraveler();
  if (cleared) refresh();
  return cleared;
}

export async function signOutAccount(): Promise<boolean> {
  const result = await signOutOnline();
  if (result.error) return false;
  const cleared = journeyRepository.clearActiveTraveler();
  if (cleared) refresh();
  return cleared;
}
export function finishIntroduction(): boolean {
  const current = journeyRepository.load();
  if (current.status !== 'ready') {
    refresh();
    return false;
  }
  const saved = journeyRepository.save({
    ...current.traveler,
    progress: { ...current.traveler.progress, introCompleted: true },
  });
  if (saved) refresh();
  return saved;
}

export function updateTraveler(
  mutator: (traveler: Traveler) => Traveler,
): boolean {
  const current = journeyRepository.load();
  if (current.status !== 'ready') return false;
  const next = mutator(current.traveler);
  const saved = journeyRepository.save(next);
  if (saved) {
    queueOnlineTravelerSync(current.traveler, next);
    refresh();
  }
  return saved;
}

export function buyEquipment(
  equipmentId: string,
): PurchaseResult['status'] | 'save-failed' {
  const current = journeyRepository.load();
  if (current.status !== 'ready') return 'unavailable';
  const result = purchaseFromShop(current.traveler, equipmentId);
  if (result.status !== 'purchased') return result.status;
  if (!journeyRepository.save(result.traveler)) return 'save-failed';
  queueOnlineTravelerSync(current.traveler, result.traveler);
  refresh();
  return 'purchased';
}

export function buyChest(
  type: ChestType,
  operationId: string,
): 'purchased' | 'duplicate' | 'unavailable' | 'level-required' | 'insufficient' | 'save-failed' {
  const current = journeyRepository.load();
  if (current.status !== 'ready') return 'unavailable';
  const result = purchaseChestLocal(current.traveler, type, operationId);
  if (result.status !== 'purchased' && result.status !== 'duplicate') return result.status;
  if (result.status === 'duplicate') return 'duplicate';
  if (!journeyRepository.save(result.traveler)) return 'save-failed';
  refresh();
  return 'purchased';
}

export function openOwnedChest(
  type: ChestType,
  operationId: string,
): { status: 'opened' | 'duplicate'; reward: ChestReward } | { status: 'empty' | 'save-failed' } {
  const current = journeyRepository.load();
  if (current.status !== 'ready') return { status: 'empty' };
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const result = openChestLocal(current.traveler, type, operationId, random[0] / 2 ** 32, new Date().toISOString());
  if (result.status === 'empty') return result;
  if (result.status === 'duplicate') return { status: result.status, reward: result.reward };
  if (!journeyRepository.save(result.traveler)) return { status: 'save-failed' };
  refresh();
  return { status: 'opened', reward: result.reward };
}

export function publishGuildContent(
  input: Omit<GuildContent, 'id' | 'guildId' | 'createdAt' | 'status'>,
): boolean {
  const current = journeyRepository.load();
  if (current.status !== 'ready' || !current.traveler.progress.guildId)
    return false;
  return guildContentRepository.add({
    ...input,
    id: crypto.randomUUID(),
    guildId: current.traveler.progress.guildId,
    createdAt: new Date().toISOString(),
    status: 'active',
  });
}

export function submitGuildActivity(contentId: string): boolean {
  const current = journeyRepository.load();
  if (current.status !== 'ready' || !current.traveler.progress.guildId)
    return false;
  const content = guildContentRepository
    .list(current.traveler.progress.guildId)
    .find((item) => item.id === contentId);
  const currentStatus = current.traveler.progress.guildActivities[contentId];
  if (
    !content ||
    content.status !== 'active' ||
    content.kind === 'lesson' ||
    (currentStatus && currentStatus !== 'revision-requested')
  )
    return false;
  return updateTraveler((traveler) => ({
    ...traveler,
    progress: {
      ...traveler.progress,
      guildActivities: {
        ...traveler.progress.guildActivities,
        [contentId]: 'submitted',
      },
      guildActivitySubmittedAt: {
        ...traveler.progress.guildActivitySubmittedAt,
        [contentId]: new Date().toISOString(),
      },
    },
  }));
}

export function approveGuildActivity(
  travelerId: string,
  contentId: string,
): boolean {
  return reviewGuildActivity(travelerId, contentId, 'approved');
}

export function requestGuildActivityRevision(
  travelerId: string,
  contentId: string,
): boolean {
  return reviewGuildActivity(travelerId, contentId, 'revision-requested');
}

function reviewGuildActivity(
  travelerId: string,
  contentId: string,
  decision: 'approved' | 'revision-requested',
): boolean {
  const current = journeyRepository.load();
  if (current.status !== 'ready' || !current.traveler.progress.guildId)
    return false;
  const guildId = current.traveler.progress.guildId;
  const content = guildContentRepository
    .list(guildId)
    .find((item) => item.id === contentId);
  if (!content) return false;
  const member = journeyRepository
    .listSaved()
    .find(
      (item) => item.id === travelerId && item.progress.guildId === guildId,
    );
  if (!member || member.progress.guildActivities[contentId] !== 'submitted')
    return false;
  const reward = GUILD_REWARDS[content.tier];
  const reviewed = decision === 'approved'
    ? grantChest(
        addGameplayReward(member, reward.xp, reward.coins),
        reward.chestType,
        'guild_activity',
        `guild_activity:${contentId}`,
      )
    : member;
  const saved = journeyRepository.save({
    ...reviewed,
    progress: {
      ...reviewed.progress,
      guildActivities: {
        ...reviewed.progress.guildActivities,
        [contentId]: decision === 'approved' ? 'claimed' : decision,
      },
    },
  });
  if (saved) refresh();
  return saved;
}

export function claimGuildActivity(contentId: string): boolean {
  const current = journeyRepository.load();
  if (current.status !== 'ready' || !current.traveler.progress.guildId)
    return false;
  const content = guildContentRepository
    .list(current.traveler.progress.guildId)
    .find((item) => item.id === contentId);
  if (
    !content ||
    current.traveler.progress.guildActivities[contentId] !== 'approved'
  )
    return false;
  const reward = GUILD_REWARDS[content.tier];
  return updateTraveler((traveler) => ({
    ...grantChest(addGameplayReward(traveler, reward.xp, reward.coins), reward.chestType, 'guild_activity', `guild_activity:${contentId}`),
    progress: {
      ...traveler.progress,
      guildActivities: {
        ...traveler.progress.guildActivities,
        [contentId]: 'claimed',
      },
    },
  }));
}

export function updateGuildChallenge(
  action: 'accept' | 'complete' | 'submit' | 'approve' | 'return',
): boolean {
  return updateTraveler((traveler) => {
    const current = traveler.progress.guildChallengeStatus;
    const status =
      action === 'accept' &&
      ['available', 'revision-requested'].includes(current)
        ? 'in-progress'
        : action === 'complete' && current === 'in-progress'
          ? 'submitted'
          : action === 'submit' && current === 'submitted'
            ? 'awaiting-validation'
            : action === 'approve' && current === 'awaiting-validation'
              ? 'reward-available'
              : action === 'return' && current === 'awaiting-validation'
                ? 'revision-requested'
                : current;
    const now = new Date().toISOString();
    return {
      ...traveler,
      progress: {
        ...traveler.progress,
        guildChallengeStatus: status,
        guildChallengeSubmittedAt:
          status === 'awaiting-validation'
            ? now
            : traveler.progress.guildChallengeSubmittedAt,
        guildChallengeValidatedAt:
          status === 'reward-available'
            ? now
            : traveler.progress.guildChallengeValidatedAt,
      },
    };
  });
}

export function joinGuild(inviteCode: string): boolean {
  const normalized = normalizeGuildCode(inviteCode);
  const guild = localGuildRepository.findByCode(normalized);
  if (!guild) return false;
  return updateTraveler((traveler) => ({
    ...traveler,
    progress: {
      ...traveler.progress,
      guildId: guild.id,
      guildChallengeStatus:
        traveler.progress.gardenCompleted &&
        traveler.progress.guildChallengeStatus === 'locked'
          ? 'available'
          : traveler.progress.guildChallengeStatus,
    },
  }));
}

export function createTestGuild(): string | null {
  const current = journeyRepository.load();
  if (current.status !== 'ready' || current.traveler.progress.guildId)
    return null;
  const code = `TESTE-${current.traveler.id.replaceAll('-', '').slice(0, 6).toUpperCase()}`;
  const guild = {
    id: `guild-${current.traveler.id}`,
    code,
    name: `Guilda de ${current.traveler.name}`,
    leaderId: current.traveler.id,
    createdAt: new Date().toISOString(),
  };
  if (!localGuildRepository.add(guild)) return null;
  return updateTraveler((traveler) => ({
    ...traveler,
    progress: {
      ...traveler.progress,
      guildId: guild.id,
      guildChallengeStatus:
        traveler.progress.gardenCompleted &&
        traveler.progress.guildChallengeStatus === 'locked'
          ? 'available'
          : traveler.progress.guildChallengeStatus,
    },
  }))
    ? code
    : null;
}

export function updateGuildContent(item: GuildContent): boolean {
  const current = journeyRepository.load();
  if (
    current.status !== 'ready' ||
    !current.traveler.progress.guildId ||
    item.guildId !== current.traveler.progress.guildId
  )
    return false;
  return guildContentRepository.update(item.guildId, item.id, item);
}

export function claimPhaseGuildReward(): boolean {
  return updateTraveler((traveler) => {
    if (
      traveler.progress.guildChallengeStatus !== 'reward-available' ||
      traveler.progress.guildRewardClaimed
    )
      return traveler;
    return {
      ...grantChest(addGameplayReward(
        traveler,
        PHASE_GUILD_REWARD.xp,
        PHASE_GUILD_REWARD.coins,
      ), 'epic', 'guild_phase', 'guild_phase:share-learning'),
      progress: {
        ...traveler.progress,
        guildChallengeStatus: 'completed',
        guildRewardClaimed: true,
        nextPhaseUnlocked: true,
      },
    };
  });
}

export type NewSpecialChallenge = Pick<
  SpecialChallenge,
  'title' | 'description' | 'category' | 'audience' | 'rewardTier' | 'expiresAt'
>;
export function createSpecialChallenge(input: NewSpecialChallenge): boolean {
  if (!input.title.trim() || !input.description.trim()) return false;
  return updateTraveler((traveler) => {
    if (!traveler.progress.guildId) return traveler;
    const challenge: SpecialChallenge = {
      ...input,
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim() || 'comunidade',
      createdAt: new Date().toISOString(),
      createdBy: 'leader-local-simulation',
      status: 'available',
      submittedAt: null,
      validatedAt: null,
      rewardClaimed: false,
      collectiveTarget: null,
    };
    return {
      ...traveler,
      progress: {
        ...traveler.progress,
        specialChallenges: [...traveler.progress.specialChallenges, challenge],
      },
    };
  });
}

export function updateSpecialChallenge(
  challengeId: string,
  action: 'accept' | 'submit' | 'approve' | 'return',
): boolean {
  return updateTraveler((traveler) => ({
    ...traveler,
    progress: {
      ...traveler.progress,
      specialChallenges: traveler.progress.specialChallenges.map(
        (challenge) => {
          if (challenge.id !== challengeId) return challenge;
          const now = new Date().toISOString();
          if (
            action === 'accept' &&
            ['available', 'revision-requested'].includes(challenge.status)
          )
            return { ...challenge, status: 'in-progress' };
          if (action === 'submit' && challenge.status === 'in-progress')
            return {
              ...challenge,
              status: 'awaiting-validation',
              submittedAt: now,
            };
          if (
            action === 'approve' &&
            challenge.status === 'awaiting-validation'
          )
            return {
              ...challenge,
              status: 'reward-available',
              validatedAt: now,
            };
          if (action === 'return' && challenge.status === 'awaiting-validation')
            return { ...challenge, status: 'revision-requested' };
          return challenge;
        },
      ),
    },
  }));
}

export function claimSpecialChallengeReward(challengeId: string): boolean {
  return updateTraveler((traveler) => {
    const challenge = traveler.progress.specialChallenges.find(
      (item) => item.id === challengeId,
    );
    if (
      !challenge ||
      challenge.status !== 'reward-available' ||
      challenge.rewardClaimed
    )
      return traveler;
    const reward =
      specialChallengeRewardTables[
        challenge.rewardTier as SpecialChallengeRewardTier
      ];
    return {
      ...grantChest(addGameplayReward(traveler, reward.xp, reward.coins), reward.chestType, 'guild_special_challenge', `guild_special:${challengeId}`),
      progress: {
        ...traveler.progress,
        specialChallenges: traveler.progress.specialChallenges.map((item) =>
          item.id === challengeId
            ? { ...item, status: 'completed', rewardClaimed: true }
            : item,
        ),
      },
    };
  });
}

export function saveDiaryEntry(): boolean {
  return updateTraveler((traveler) => ({
    ...traveler,
    progress: {
      ...traveler.progress,
      diaryEntries: traveler.progress.diaryEntries + 1,
    },
  }));
}
export function equipItem(
  item: import('../domain/traveler').Equipment,
): boolean {
  const current = journeyRepository.load();
  if (current.status !== 'ready') return false;
  const owned = current.traveler.inventory.find(
    (entry) => entry.id === item.id && entry.slot === item.slot,
  );
  if (!owned) return false;
  return updateTraveler((traveler) => ({
    ...traveler,
    equipped: { ...traveler.equipped, [owned.slot]: owned.id },
    avatar: {
      ...traveler.avatar,
      equippedItems: {
        ...traveler.avatar.equippedItems,
        [owned.slot]: owned.id,
      },
    },
    inventory: traveler.inventory.map((entry) =>
      entry.id === owned.id ? { ...entry, isNew: false } : entry,
    ),
  }));
}
export function unequipSlot(
  slot: import('../domain/traveler').EquipmentSlot,
): boolean {
  return updateTraveler((traveler) => {
    const equipped = { ...traveler.equipped };
    const equippedItems = { ...traveler.avatar.equippedItems };
    delete equipped[slot];
    delete equippedItems[slot];
    return {
      ...traveler,
      equipped,
      avatar: { ...traveler.avatar, equippedItems },
    };
  });
}
