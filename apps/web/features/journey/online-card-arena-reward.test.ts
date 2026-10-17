import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createCardBattle, playCombatCard, combatCard } from '@rpg/game-engine';
const { settle, reload, identity } = vi.hoisted(() => ({
  settle: vi.fn(),
  reload: vi.fn(),
  identity: vi.fn(),
}));
vi.mock('../../lib/economy/client', () => ({ economyClient: { settle } }));
vi.mock('../../lib/supabase/online-sync', () => ({
  reloadOnlineTraveler: reload,
  getCurrentOnlineUserId: identity,
}));
import { cardArenaStorage } from './persistence/card-arena-storage';
import { settleOnlineCardArenaReward } from './data/online-card-arena-reward';
import { travelerBattleSnapshot, TRAINING_OPPONENTS } from './data/arena';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';

const scope = {
  ownerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  travelerId: '11111111-1111-4111-8111-111111111111',
};
let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  identity.mockReset();
  identity.mockReturnValue(scope.ownerId);
  settle.mockReset();
  settle.mockResolvedValue({
    xp: 8,
    coins: 3,
    rewarded: true,
    reason: 'victory',
  });
  reload.mockReset();
  reload.mockResolvedValue(true);
  const traveler = createTraveler(
    'Sintetico',
    DEFAULT_APPEARANCE,
    scope.travelerId,
    '2026-10-16T00:00:00.000Z',
  );
  const battle = createCardBattle(
    {
      ...travelerBattleSnapshot(traveler),
      attributes: { life: 3, strength: 30, defense: 3, wisdom: 1 },
    },
    TRAINING_OPPONENTS[0],
    1,
    '33333333-3333-4333-8333-333333333333',
  );
  const attack = battle.hand.find(
    (item) =>
      combatCard(item.cardId)?.damage && !combatCard(item.cardId)?.focusCost,
  )!;
  const finished = playCombatCard(battle, attack.id);
  expect(finished.winner).toBe('player');
  expect(cardArenaStorage.start(scope, finished)).toBe(true);
});
afterEach(() => vi.unstubAllGlobals());
test('records only the server result, refreshes authoritative resources and avoids repeat calls', async () => {
  expect((await settleOnlineCardArenaReward(scope))?.status).toBe('applied');
  expect((await settleOnlineCardArenaReward(scope))?.status).toBe('applied');
  expect(settle).toHaveBeenCalledTimes(1);
  expect(reload).toHaveBeenCalledWith(scope.travelerId);
  expect([...values.keys()].some((key) => key.includes('journey:v1'))).toBe(
    false,
  );
});
test('a lost response does not apply local credit; a retry uses the same server-issued battle', async () => {
  settle.mockRejectedValueOnce(Error('connection lost'));
  await expect(settleOnlineCardArenaReward(scope)).rejects.toThrow(
    'connection lost',
  );
  expect(cardArenaStorage.load(scope)?.settlement).toBeNull();
  expect(reload).not.toHaveBeenCalled();
  await settleOnlineCardArenaReward(scope);
  expect(settle.mock.calls[0][1].id).toBe(settle.mock.calls[1][1].id);
});
test('does not alter a new session cache if the user switches during the request', async () => {
  identity
    .mockReturnValueOnce(scope.ownerId)
    .mockReturnValue('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  expect(await settleOnlineCardArenaReward(scope)).toBeNull();
  expect(cardArenaStorage.load(scope)?.settlement).toBeNull();
  expect(reload).not.toHaveBeenCalled();
});
test('local-only play never reaches the online reward endpoint', async () => {
  expect(
    await settleOnlineCardArenaReward({ ...scope, ownerId: 'local' }),
  ).toBeNull();
  expect(settle).not.toHaveBeenCalled();
});
