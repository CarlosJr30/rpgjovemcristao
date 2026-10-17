import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createCardBattle,
  playCombatCard,
  endCardTurn,
  resolveCardEnemyTurn,
  combatCard,
  type CardBattle,
  type TrainingReward,
} from '@rpg/game-engine';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../features/journey/domain/traveler';
import {
  TRAINING_OPPONENTS,
  travelerBattleSnapshot,
} from '../../features/journey/data/arena';
import {
  EconomyError,
  handleEconomy,
  type EconomyPort,
  type RegisteredBattle,
} from './authority';

const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const travelerId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
const battleId = '33333333-3333-4333-8333-333333333333';
const traveler = {
  ...createTraveler(
    'Sintético',
    DEFAULT_APPEARANCE,
    travelerId,
    '2026-10-16T00:00:00.000Z',
  ),
  attributes: { life: 20, strength: 20, defense: 5, wisdom: 5 },
};
const registered: RegisteredBattle = {
  id: battleId,
  travelerId,
  seed: 123,
  player: travelerBattleSnapshot(traveler),
  opponent: TRAINING_OPPONENTS[0],
};
function winningBattle(): CardBattle {
  let battle = createCardBattle(
    registered.player,
    registered.opponent,
    registered.seed,
    registered.id,
  );
  for (let i = 0; i < 100 && battle.phase !== 'finished'; i++) {
    if (battle.phase === 'enemy')
      battle = resolveCardEnemyTurn(battle, battle.revision);
    else {
      const choice = battle.hand.find((instance) => {
        const card = combatCard(instance.cardId)!;
        return (
          card.damage &&
          card.cost <= battle.energy &&
          card.focusCost <= battle.player.focus
        );
      });
      battle = choice
        ? playCombatCard(battle, choice.id, battle.revision)
        : endCardTurn(battle, battle.revision);
    }
  }
  if (battle.winner !== 'player') throw Error('Winning fixture did not win');
  return battle;
}
let port: EconomyPort;
beforeEach(() => {
  port = {
    authenticate: vi.fn(async () => ({ id: userId, anonymous: false })),
    loadTraveler: vi.fn(async (_userId, id) => {
      if (id !== travelerId) throw new EconomyError(403);
      return traveler;
    }),
    start: vi.fn(async () => registered),
    battle: vi.fn(async (_userId, id) => {
      if (id !== travelerId) throw new EconomyError(403);
      return registered;
    }),
    settle: vi.fn(async (): Promise<TrainingReward> => ({
      xp: 8,
      coins: 3,
      rewarded: true,
      reason: 'victory',
    })),
    purchase: vi.fn(async () => ({
      status: 'purchased',
      pricePaid: 35,
      coins: 65,
    })),
  };
});
const request = (body: unknown, token = 'synthetic-token') =>
  new Request('http://localhost/api/economy', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(body),
  });
const start = {
  operation: 'start-card-battle',
  travelerId,
  opponentId: 'training-apprentice',
};

describe('authenticated economy boundary', () => {
  test.each([
    'coins',
    'xp',
    'inventory',
    'cards',
    'amount',
    'userId',
    'player',
    'opponent',
    'seed',
    'battleId',
  ])('rejects browser-controlled %s at issuance', async (key) => {
    const response = await handleEconomy(
      request({ ...start, [key]: 999999 }),
      port,
    );
    expect(response.status).toBe(400);
    expect(port.start).not.toHaveBeenCalled();
  });
  test.each(['credit', 'set-xp', 'grant-card', 'admin'])(
    'rejects arbitrary %s operations',
    async (operation) => {
      expect(
        (await handleEconomy(request({ operation, travelerId }), port)).status,
      ).toBe(400);
      expect(port.settle).not.toHaveBeenCalled();
      expect(port.purchase).not.toHaveBeenCalled();
    },
  );
  test('does not consult economy data without a bearer token', async () => {
    expect((await handleEconomy(request(start, ''), port)).status).toBe(401);
    expect(port.authenticate).not.toHaveBeenCalled();
    expect(port.loadTraveler).not.toHaveBeenCalled();
  });
  test.each([null, { id: userId, anonymous: true }])(
    'rejects invalid or anonymous sessions',
    async (identity) => {
      vi.mocked(port.authenticate).mockResolvedValue(identity);
      expect((await handleEconomy(request(start), port)).status).toBe(401);
      expect(port.start).not.toHaveBeenCalled();
    },
  );
  test('checks another player before issuing a battle', async () => {
    expect(
      (await handleEconomy(request({ ...start, travelerId: otherId }), port))
        .status,
    ).toBe(403);
    expect(port.start).not.toHaveBeenCalled();
  });
  test('issues only a canonical server snapshot and database seed/ID', async () => {
    const response = await handleEconomy(request(start), port);
    expect(response.status).toBe(200);
    expect(port.start).toHaveBeenCalledWith(
      userId,
      travelerId,
      registered.player,
      TRAINING_OPPONENTS[0],
    );
    expect(await response.json()).toMatchObject({
      id: battleId,
      seed: 123,
      player: { snapshot: registered.player },
    });
  });
  test('replays a genuine victory using immutable server actors', async () => {
    const battle = winningBattle();
    const response = await handleEconomy(
      request({
        operation: 'settle-card-battle',
        travelerId,
        battleId,
        commands: battle.commands,
      }),
      port,
    );
    expect(response.status).toBe(200);
    expect(port.settle).toHaveBeenCalledWith(
      userId,
      travelerId,
      battleId,
      true,
    );
    expect(await response.json()).toEqual({
      xp: 8,
      coins: 3,
      rewarded: true,
      reason: 'victory',
    });
  });
  test('does not credit an unfinished or invalid transcript', async () => {
    for (const commands of [
      [],
      [{ kind: 'play', revision: 0, instanceId: 'invented' }],
      [{ kind: 'enemy', revision: 999 }],
    ]) {
      expect(
        (
          await handleEconomy(
            request({
              operation: 'settle-card-battle',
              travelerId,
              battleId,
              commands,
            }),
            port,
          )
        ).status,
      ).toBe(422);
    }
    expect(port.settle).not.toHaveBeenCalled();
  });
  test('cannot settle another traveler or substitute a receipt', async () => {
    const commands = winningBattle().commands;
    expect(
      (
        await handleEconomy(
          request({
            operation: 'settle-card-battle',
            travelerId: otherId,
            battleId,
            commands,
          }),
          port,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await handleEconomy(
          request({
            operation: 'settle-card-battle',
            travelerId,
            battleId: otherId,
            commands,
          }),
          port,
        )
      ).status,
    ).toBe(403);
    expect(port.settle).not.toHaveBeenCalled();
  });
  test('passes only a known item identity, never a client price', async () => {
    const body = {
      operation: 'purchase-equipment',
      travelerId,
      itemId: 'traveler-sword-common',
    };
    expect(
      (await handleEconomy(request({ ...body, price: 0 }), port)).status,
    ).toBe(400);
    expect(port.purchase).not.toHaveBeenCalled();
    expect((await handleEconomy(request(body), port)).status).toBe(200);
    expect(port.purchase).toHaveBeenCalledWith(
      userId,
      travelerId,
      'traveler-sword-common',
    );
  });
  test('rejects oversized chunked payloads before any mutation', async () => {
    const response = await handleEconomy(
      request({ ...start, padding: 'x'.repeat(262145) }),
      port,
    );
    expect(response.status).toBe(413);
    expect(port.start).not.toHaveBeenCalled();
  });
  test('redacts provider failures and disables response caching', async () => {
    vi.mocked(port.purchase).mockRejectedValue(
      Error('private database details'),
    );
    const response = await handleEconomy(
      request({
        operation: 'purchase-equipment',
        travelerId,
        itemId: 'traveler-sword-common',
      }),
      port,
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
