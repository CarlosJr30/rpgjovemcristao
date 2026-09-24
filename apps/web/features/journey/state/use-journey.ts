'use client';
import { useSyncExternalStore } from 'react';
import {
  createTraveler,
  type Appearance,
  type SpecialChallenge,
  type SpecialChallengeRewardTier,
  type Traveler,
} from '../domain/traveler';
import { PHASE_GUILD_REWARD, specialChallengeRewardTables } from '../data/guildRewards';
import { addGameplayReward } from '../data/progression';
import { purchaseFromShop, type PurchaseResult } from '../data/shop';
import { guildContentRepository, GUILD_REWARDS, type GuildContent } from '../data/guildContent';
import {
  journeyRepository,
  SESSION_KEY,
  ACTIVE_TRAVELER_ID_KEY,
  STORAGE_KEY,
  type LoadResult,
} from '../persistence/journey-storage';

type Snapshot = LoadResult | { status: 'logged-out'; traveler: Traveler } | { status: 'loading' };
const initial: Snapshot = { status: 'loading' };
let snapshot: Snapshot = initial;
const listeners = new Set<() => void>();
function refresh() {
  const saved = journeyRepository.load();
  snapshot = saved.status === 'ready' && (!journeyRepository.isSessionActive() || journeyRepository.activeTravelerId() !== saved.traveler.id)
    ? { status: 'logged-out', traveler: saved.traveler }
    : saved;
  listeners.forEach((listener) => listener());
}
function onStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === SESSION_KEY || event.key === ACTIVE_TRAVELER_ID_KEY || event.key === null) refresh();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);
    refresh();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refresh);
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

export function registerTraveler(
  name: string,
  appearance: Appearance,
  bodyType: 'male' | 'female' = 'male',
): string | null {
  try {
    const traveler = createTraveler(
      name,
      appearance,
      crypto.randomUUID(),
      new Date().toISOString(),
    );
    traveler.avatar.gender = bodyType;
    if (!journeyRepository.saveNew(traveler))
      return 'Não foi possível salvar. Permita o armazenamento deste site e tente novamente.';
    journeyRepository.startSession(traveler.id);
    refresh();
    return null;
  } catch {
    return 'Não foi possível criar o Viajante. Confira o nome e tente novamente.';
  }
}
export function resumeJourney(travelerId?: string): boolean {
  const loaded = journeyRepository.load();
  const saved = travelerId
    ? journeyRepository.listSaved().find((traveler) => traveler.id === travelerId)
    : loaded.status === 'ready' ? loaded.traveler : undefined;
  if (!saved) {
    refresh();
    return false;
  }
  if (!journeyRepository.startSession(saved.id)) return false;
  refresh();
  return snapshot.status === 'ready';
}
export function logout(): boolean {
  const loggedOut = journeyRepository.logout();
  if (loggedOut) refresh();
  return loggedOut;
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
  const saved = journeyRepository.save(mutator(current.traveler));
  if (saved) refresh();
  return saved;
}

export function buyEquipment(equipmentId: string): PurchaseResult['status'] | 'save-failed' {
  const current = journeyRepository.load();
  if (current.status !== 'ready') return 'unavailable';
  const result = purchaseFromShop(current.traveler, equipmentId);
  if (result.status !== 'purchased') return result.status;
  if (!journeyRepository.save(result.traveler)) return 'save-failed';
  refresh();
  return 'purchased';
}

export function publishGuildContent(input: Omit<GuildContent, 'id' | 'guildId' | 'createdAt'>): boolean {
  const current = journeyRepository.load();
  if (current.status !== 'ready' || !current.traveler.progress.guildId) return false;
  return guildContentRepository.add({
    ...input,
    id: crypto.randomUUID(),
    guildId: current.traveler.progress.guildId,
    createdAt: new Date().toISOString(),
  });
}

export function submitGuildActivity(contentId: string): boolean {
  const current = journeyRepository.load();
  if (current.status !== 'ready' || !current.traveler.progress.guildId) return false;
  const content = guildContentRepository.list(current.traveler.progress.guildId).find((item) => item.id === contentId);
  if (!content || content.kind === 'lesson' || current.traveler.progress.guildActivities[contentId]) return false;
  return updateTraveler((traveler) => ({ ...traveler, progress: {
    ...traveler.progress, guildActivities: { ...traveler.progress.guildActivities, [contentId]: 'submitted' },
  } }));
}

export function approveGuildActivity(travelerId: string, contentId: string): boolean {
  const current = journeyRepository.load();
  if (current.status !== 'ready' || !current.traveler.progress.guildId) return false;
  const guildId = current.traveler.progress.guildId;
  if (!guildContentRepository.list(guildId).some((item) => item.id === contentId)) return false;
  const member = journeyRepository.listSaved().find((item) => item.id === travelerId && item.progress.guildId === guildId);
  if (!member || member.progress.guildActivities[contentId] !== 'submitted') return false;
  const saved = journeyRepository.save({ ...member, progress: { ...member.progress,
    guildActivities: { ...member.progress.guildActivities, [contentId]: 'approved' },
  } });
  if (saved) refresh();
  return saved;
}

export function claimGuildActivity(contentId: string): boolean {
  const current = journeyRepository.load();
  if (current.status !== 'ready' || !current.traveler.progress.guildId) return false;
  const content = guildContentRepository.list(current.traveler.progress.guildId).find((item) => item.id === contentId);
  if (!content || current.traveler.progress.guildActivities[contentId] !== 'approved') return false;
  const reward = GUILD_REWARDS[content.tier];
  return updateTraveler((traveler) => ({
    ...addGameplayReward(traveler, reward.xp, reward.coins),
    progress: { ...traveler.progress, guildActivities: { ...traveler.progress.guildActivities, [contentId]: 'claimed' } },
  }));
}

export function updateGuildChallenge(
  action: 'accept' | 'complete' | 'submit' | 'approve' | 'return',
): boolean {
  return updateTraveler((traveler) => {
    const current = traveler.progress.guildChallengeStatus;
    const status = action === 'accept' && ['available', 'revision-requested'].includes(current)
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
        guildChallengeSubmittedAt: status === 'awaiting-validation' ? now : traveler.progress.guildChallengeSubmittedAt,
        guildChallengeValidatedAt: status === 'reward-available' ? now : traveler.progress.guildChallengeValidatedAt,
      },
    };
  });
}

export function joinGuild(inviteCode: string): boolean {
  const normalized = inviteCode.trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,24}$/.test(normalized)) return false;
  return updateTraveler((traveler) => ({
    ...traveler,
    progress: {
      ...traveler.progress,
      guildId: `guild-${normalized.toLowerCase()}`,
      guildChallengeStatus: traveler.progress.gardenCompleted && traveler.progress.guildChallengeStatus === 'locked'
        ? 'available'
        : traveler.progress.guildChallengeStatus,
    },
  }));
}

export function claimPhaseGuildReward(): boolean {
  return updateTraveler((traveler) => {
    if (traveler.progress.guildChallengeStatus !== 'reward-available' || traveler.progress.guildRewardClaimed)
      return traveler;
    return {
      ...addGameplayReward(traveler, PHASE_GUILD_REWARD.xp, PHASE_GUILD_REWARD.coins),
      progress: {
        ...traveler.progress,
        guildChallengeStatus: 'completed',
        guildRewardClaimed: true,
        nextPhaseUnlocked: true,
      },
    };
  });
}

export type NewSpecialChallenge = Pick<SpecialChallenge, 'title' | 'description' | 'category' | 'audience' | 'rewardTier' | 'expiresAt'>;
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
    return { ...traveler, progress: { ...traveler.progress, specialChallenges: [...traveler.progress.specialChallenges, challenge] } };
  });
}

export function updateSpecialChallenge(challengeId: string, action: 'accept' | 'submit' | 'approve' | 'return'): boolean {
  return updateTraveler((traveler) => ({
    ...traveler,
    progress: {
      ...traveler.progress,
      specialChallenges: traveler.progress.specialChallenges.map((challenge) => {
        if (challenge.id !== challengeId) return challenge;
        const now = new Date().toISOString();
        if (action === 'accept' && ['available', 'revision-requested'].includes(challenge.status))
          return { ...challenge, status: 'in-progress' };
        if (action === 'submit' && challenge.status === 'in-progress')
          return { ...challenge, status: 'awaiting-validation', submittedAt: now };
        if (action === 'approve' && challenge.status === 'awaiting-validation')
          return { ...challenge, status: 'reward-available', validatedAt: now };
        if (action === 'return' && challenge.status === 'awaiting-validation')
          return { ...challenge, status: 'revision-requested' };
        return challenge;
      }),
    },
  }));
}

export function claimSpecialChallengeReward(challengeId: string): boolean {
  return updateTraveler((traveler) => {
    const challenge = traveler.progress.specialChallenges.find((item) => item.id === challengeId);
    if (!challenge || challenge.status !== 'reward-available' || challenge.rewardClaimed) return traveler;
    const reward = specialChallengeRewardTables[challenge.rewardTier as SpecialChallengeRewardTier];
    return {
      ...addGameplayReward(traveler, reward.xp, reward.coins),
      progress: {
        ...traveler.progress,
        specialChallenges: traveler.progress.specialChallenges.map((item) => item.id === challengeId
          ? { ...item, status: 'completed', rewardClaimed: true }
          : item),
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
  const owned = current.traveler.inventory.find((entry) => entry.id === item.id && entry.slot === item.slot);
  if (!owned) return false;
  return updateTraveler((traveler) => ({
    ...traveler,
    equipped: { ...traveler.equipped, [owned.slot]: owned.id },
    avatar: { ...traveler.avatar, equippedItems: { ...traveler.avatar.equippedItems, [owned.slot]: owned.id } },
    inventory: traveler.inventory.map((entry) => entry.id === owned.id ? { ...entry, isNew: false } : entry),
  }));
}
export function unequipSlot(slot: import('../domain/traveler').EquipmentSlot): boolean {
  return updateTraveler((traveler) => {
    const equipped = { ...traveler.equipped };
    const equippedItems = { ...traveler.avatar.equippedItems };
    delete equipped[slot];
    delete equippedItems[slot];
    return { ...traveler, equipped, avatar: { ...traveler.avatar, equippedItems } };
  });
}
