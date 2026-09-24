import { beforeEach, describe, expect, test } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
import { journeyRepository } from './persistence/journey-storage';
import {
  claimPhaseGuildReward,
  claimSpecialChallengeReward,
  createSpecialChallenge,
  joinGuild,
  updateGuildChallenge,
  updateSpecialChallenge,
} from './state/use-journey';
import { PHASE_GUILD_REWARD, specialChallengeRewardTables } from './data/guildRewards';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

const storage = new MemoryStorage();
const travelerId = '12345678-1234-4321-8234-123456789abc';
const createdAt = '2026-09-23T12:00:00.000Z';

function phaseCompletedTraveler() {
  const traveler = createTraveler('Ana Clara', DEFAULT_APPEARANCE, travelerId, createdAt);
  traveler.progress.gardenCompleted = true;
  return traveler;
}

describe('gate obrigatório da Guilda', () => {
  beforeEach(() => {
    storage.clear();
    Object.assign(globalThis, { window: { localStorage: storage } });
    expect(journeyRepository.saveNew(phaseCompletedTraveler())).toBe(true);
  });

  test('bloqueia sem Guilda e libera somente após validação e recompensa', () => {
    expect(journeyRepository.load()).toMatchObject({ status: 'ready', traveler: { progress: { guildId: null, nextPhaseUnlocked: false } } });
    expect(joinGuild('CELULA01')).toBe(true);
    expect(updateGuildChallenge('accept')).toBe(true);
    expect(updateGuildChallenge('complete')).toBe(true);
    expect(updateGuildChallenge('submit')).toBe(true);
    expect(journeyRepository.load()).toMatchObject({ status: 'ready', traveler: { progress: { guildChallengeStatus: 'awaiting-validation', nextPhaseUnlocked: false } } });
    expect(updateGuildChallenge('approve')).toBe(true);
    expect(journeyRepository.load()).toMatchObject({ status: 'ready', traveler: { progress: { guildChallengeStatus: 'reward-available', nextPhaseUnlocked: false } } });
    expect(claimPhaseGuildReward()).toBe(true);
    const approved = journeyRepository.load();
    expect(approved).toMatchObject({ status: 'ready', traveler: { xp: PHASE_GUILD_REWARD.xp, coins: PHASE_GUILD_REWARD.coins, progress: { guildChallengeStatus: 'completed', guildRewardClaimed: true, nextPhaseUnlocked: true } } });
    expect(claimPhaseGuildReward()).toBe(true);
    expect(journeyRepository.load()).toEqual(approved);
  });

  test('ajuste mantém gate fechado e permite reenvio', () => {
    joinGuild('CELULA01');
    updateGuildChallenge('accept');
    updateGuildChallenge('complete');
    updateGuildChallenge('submit');
    updateGuildChallenge('return');
    expect(journeyRepository.load()).toMatchObject({ status: 'ready', traveler: { progress: { guildChallengeStatus: 'revision-requested', nextPhaseUnlocked: false } } });
    updateGuildChallenge('accept');
    updateGuildChallenge('complete');
    updateGuildChallenge('submit');
    updateGuildChallenge('approve');
    expect(journeyRepository.load()).toMatchObject({ status: 'ready', traveler: { progress: { guildChallengeStatus: 'reward-available', nextPhaseUnlocked: false } } });
  });

  test('desafio especial épico concede recompensa uma única vez', () => {
    joinGuild('CELULA01');
    createSpecialChallenge({ title: 'Servindo em Comunidade', description: 'Atividade objetiva.', category: 'comunidade', audience: 'guild', rewardTier: 'epic', expiresAt: null });
    const created = journeyRepository.load();
    if (created.status !== 'ready') throw new Error('save indisponível');
    const challengeId = created.traveler.progress.specialChallenges[0].id;
    updateSpecialChallenge(challengeId, 'accept');
    updateSpecialChallenge(challengeId, 'submit');
    updateSpecialChallenge(challengeId, 'approve');
    claimSpecialChallengeReward(challengeId);
    const rewarded = journeyRepository.load();
    expect(rewarded).toMatchObject({ status: 'ready', traveler: { xp: specialChallengeRewardTables.epic.xp, coins: specialChallengeRewardTables.epic.coins + 10, progress: { specialChallenges: [{ id: challengeId, status: 'completed', rewardClaimed: true }] } } });
    claimSpecialChallengeReward(challengeId);
    expect(journeyRepository.load()).toEqual(rewarded);
  });
});
