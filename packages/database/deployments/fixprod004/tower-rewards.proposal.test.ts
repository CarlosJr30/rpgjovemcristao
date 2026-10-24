import { expect, it } from 'vitest';
import {
  reviewTowerReward,
  towerRewardProposal,
} from './tower-rewards.proposal';
const event = {
  accountId: '00000000-0000-4000-8000-000000000001',
  travelerId: '10000000-0000-4000-8000-000000000001',
  battleId: '20000000-0000-4000-8000-000000000001',
  floor: 1,
  nextFloor: 1,
  outcome: 'victory' as const,
  settled: true,
  previousPaidFirstWinReceipt: null,
};
it('preserves the user proposal, total budget and champion chest without enabling grants', () => {
  expect(towerRewardProposal.floors.map((f) => [f.xp, f.coins])).toEqual([
    [20, 10],
    [30, 15],
    [40, 20],
    [50, 25],
    [60, 30],
    [80, 40],
    [150, 75],
  ]);
  const totals = towerRewardProposal.floors.reduce(
    (sum, f) => ({
      xp: sum.xp + f.xp,
      coins: sum.coins + f.coins,
      epicChests: sum.epicChests + f.epicChests,
    }),
    { xp: 0, coins: 0, epicChests: 0 },
  );
  expect(totals).toEqual({ xp: 430, coins: 215, epicChests: 1 });
  expect(towerRewardProposal.creditsEnabled).toBe(false);
  expect(towerRewardProposal.homologation).toBe('pending');
});
it.each([1, 2, 3, 4, 5, 6, 7])(
  'keeps a first victory at floor %i review-only with zero actual credits',
  (floor) => {
    const result = reviewTowerReward({ ...event, floor, nextFloor: floor });
    expect(result.eligibleForReview).toBe(true);
    expect(result.grant).toEqual({ xp: 0, coins: 0, epicChests: 0 });
    expect(result.status).toBe('blocked-pending-homologation');
    expect(result.hypothetical.epicChests).toBe(floor === 7 ? 1 : 0);
  },
);
it('denies defeat, unclosed battle, future floor, old floor and repeated entitlement', () => {
  for (const change of [
    { outcome: 'defeat' as const },
    { settled: false },
    { floor: 7 },
    { nextFloor: 2 },
    { previousPaidFirstWinReceipt: 'already-paid' },
  ]) {
    const result = reviewTowerReward({ ...event, ...change });
    expect(result.eligibleForReview).toBe(false);
    expect(result.hypothetical).toEqual({ xp: 0, coins: 0, epicChests: 0 });
    expect(result.grant).toEqual({ xp: 0, coins: 0, epicChests: 0 });
  }
});
it('uses a stable first-win identity across retries and different battles', () => {
  const original = reviewTowerReward(event);
  const retry = reviewTowerReward({
    ...event,
    battleId: '20000000-0000-4000-8000-000000000002',
  });
  expect(retry.firstWinIdentity).toBe(original.firstWinIdentity);
  expect(
    reviewTowerReward({
      ...event,
      travelerId: '10000000-0000-4000-8000-000000000002',
    }).firstWinIdentity,
  ).not.toBe(original.firstWinIdentity);
});
it.each([0, 8, -1, 1.5, Number.NaN])('rejects invalid floor %s', (floor) => {
  expect(() => reviewTowerReward({ ...event, floor })).toThrow(
    'Invalid review event',
  );
});
it('rejects forged identity and invalid progress bounds in the review model', () => {
  expect(() => reviewTowerReward({ ...event, accountId: 'forged' })).toThrow();
  expect(() => reviewTowerReward({ ...event, nextFloor: 9 })).toThrow();
});
it('cannot enable real credits through caller-supplied approval or reward fields', () => {
  const result = reviewTowerReward(
    Object.assign({}, event, {
      homologation: 'approved',
      creditsEnabled: true,
      xp: 999999,
      coins: 999999,
    }),
  );
  expect(result.grant).toEqual({ xp: 0, coins: 0, epicChests: 0 });
  expect(result.status).toBe('blocked-pending-homologation');
});
