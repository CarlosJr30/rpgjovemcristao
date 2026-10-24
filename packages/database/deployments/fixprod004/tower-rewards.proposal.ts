/** Offline review model for FIX-PROD-004. Not imported by any runtime or RPC.
 * Inputs model a server-validated event; this module does not authenticate it.
 * There is no grant operation, approval switch or persistence adapter here.
 */
export const towerRewardProposal = {
  version: 'fix-prod-004-tower-rewards-proposed-v1',
  towerVersion: 'permanent-v1',
  homologation: 'pending',
  creditsEnabled: false,
  scope: 'account-owner/traveler/tower-version/floor',
  floors: [
    { floor: 1, xp: 20, coins: 10, epicChests: 0 },
    { floor: 2, xp: 30, coins: 15, epicChests: 0 },
    { floor: 3, xp: 40, coins: 20, epicChests: 0 },
    { floor: 4, xp: 50, coins: 25, epicChests: 0 },
    { floor: 5, xp: 60, coins: 30, epicChests: 0 },
    { floor: 6, xp: 80, coins: 40, epicChests: 0 },
    { floor: 7, xp: 150, coins: 75, epicChests: 1 },
  ],
} as const;

type ReviewEvent = {
  accountId: string;
  travelerId: string;
  battleId: string;
  floor: number;
  outcome: 'victory' | 'defeat';
  settled: boolean;
  // Persisted canonical progress before the event, not a browser checkpoint.
  nextFloor: number;
  previousPaidFirstWinReceipt: string | null;
};
const uuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export function reviewTowerReward(event: ReviewEvent) {
  if (
    ![event.accountId, event.travelerId, event.battleId].every(uuid) ||
    !Number.isInteger(event.floor) ||
    event.floor < 1 ||
    event.floor > 7 ||
    !Number.isInteger(event.nextFloor) ||
    event.nextFloor < 1 ||
    event.nextFloor > 8 ||
    !['victory', 'defeat'].includes(event.outcome)
  )
    throw new Error('Invalid review event');
  const eligible =
    event.settled &&
    event.outcome === 'victory' &&
    event.previousPaidFirstWinReceipt === null &&
    event.floor === event.nextFloor;
  const proposed = towerRewardProposal.floors[event.floor - 1];
  return {
    status: 'blocked-pending-homologation' as const,
    grant: { xp: 0, coins: 0, epicChests: 0 },
    eligibleForReview: eligible,
    hypothetical: eligible
      ? {
          xp: proposed.xp,
          coins: proposed.coins,
          epicChests: proposed.epicChests,
        }
      : { xp: 0, coins: 0, epicChests: 0 },
    // Battle ID binds the audit event; it must not make a second battle at the
    // same floor a new first-win entitlement. Version is the Tower version,
    // not the price-table version, so a table revision cannot reset rewards.
    firstWinIdentity: `tower-first-win:${event.accountId}:${event.travelerId}:${towerRewardProposal.towerVersion}:${event.floor}`,
    battleId: event.battleId,
  };
}
