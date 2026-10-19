import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  createArenaBattle,
  resolveArenaRound,
  type ArenaAction,
} from '@rpg/game-engine';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../features/journey/domain/traveler';
import {
  travelerBattleSnapshot,
  TRAINING_OPPONENTS,
} from '../../features/journey/data/arena';
import { initialJourneyState } from './journey-authority';
const { createClient, getUser, rpc } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@supabase/supabase-js', () => ({ createClient }));
vi.mock('../supabase/env', () => ({
  getSupabasePublicConfig: () => ({
    url: 'https://synthetic.invalid',
    publishableKey: 'synthetic-public',
  }),
}));
import { POST } from '../../app/api/economy/route';
const subject = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const attacker = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const travelerId = '11111111-1111-4111-8111-111111111111';
const operationId = '22222222-2222-4222-8222-222222222222';
const battleId = '33333333-3333-4333-8333-333333333333';
const request = (body: object) =>
  new Request('http://localhost/api/economy', {
    method: 'POST',
    headers: { Authorization: 'Bearer synthetic-token' },
    body: JSON.stringify(body),
  });
const journey = {
  operation: 'journey-action',
  travelerId,
  operationId,
  action: { type: 'collect', id: 'coins-grove' },
};
beforeEach(() => {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'synthetic-server-secret');
  createClient.mockReset();
  getUser.mockReset();
  rpc.mockReset();
  createClient.mockImplementation((_url, key) =>
    key === 'synthetic-public' ? { auth: { getUser } } : { rpc },
  );
  getUser.mockResolvedValue({
    data: {
      user: {
        id: subject,
        is_anonymous: false,
        user_metadata: {
          sub: attacker,
          userId: attacker,
          role: 'service_role',
        },
      },
    },
    error: null,
  });
  rpc.mockImplementation(async (name, args) => {
    if (name === 'economy_protocol_version') return { data: 2, error: null };
    if (args.p_operation === 'journey-context') {
      const state = initialJourneyState();
      state.progress.gardenStep = 'explore';
      return { data: { state, revision: 7 }, error: null };
    }
    return { data: { ok: true }, error: null };
  });
});
afterEach(() => vi.unstubAllEnvs());
const writes = () =>
  rpc.mock.calls.filter(([, args]) =>
    ['journey-commit', 'settle', 'start', 'purchase'].includes(
      args?.p_operation,
    ),
  );

test('real POST rejects top-level state, rewardKey and identity before economy RPC', async () => {
  for (const [key, value] of Object.entries({
    state: { gardenCompleted: true },
    rewardKey: 'phase:garden-choice',
    userId: attacker,
    p_user_id: attacker,
  })) {
    expect((await POST(request({ ...journey, [key]: value }))).status).toBe(
      400,
    );
  }
  expect(rpc).not.toHaveBeenCalled();
});
test('real POST and transition reject authority fields hidden inside an action', async () => {
  for (const [key, value] of Object.entries({
    state: { gardenCompleted: true },
    rewardKey: 'phase:garden-choice',
    userId: attacker,
    coins: 999999,
  })) {
    expect(
      (
        await POST(
          request({ ...journey, action: { ...journey.action, [key]: value } }),
        )
      ).status,
    ).toBe(422);
  }
  expect(writes()).toEqual([]);
});
test('real POST derives identity, state, rewardKey and revision from backend context', async () => {
  const response = await POST(request(journey));
  expect(response.status).toBe(200);
  expect(getUser).toHaveBeenCalledWith('synthetic-token');
  const [[name, args]] = writes();
  expect(name).toBe('economy_authority');
  expect(args).toMatchObject({
    p_user_id: subject,
    p_traveler_id: travelerId,
    p_operation: 'journey-commit',
    p_payload: { operationId, revision: 7, rewardKey: 'coins-grove' },
  });
  expect(args.p_payload.state.progress.gardenCollectedLoot).toEqual([
    'coins-grove',
  ]);
  expect(args.p_payload.state.progress.gardenCompleted).toBe(false);
  expect(args.p_payload.digest).toMatch(/^[a-f0-9]{64}$/);
  expect(createClient.mock.calls.map((c) => c[1])).toEqual([
    'synthetic-public',
    'synthetic-server-secret',
  ]);
  expect(createClient.mock.calls[1][2].auth).toEqual({
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  });
  const serialized = JSON.stringify(await response.json());
  expect(serialized).not.toContain('synthetic-server-secret');
  expect(serialized).not.toContain('synthetic-token');
});
test('real POST refuses unproven completion rather than trusting client intent', async () => {
  expect(
    (await POST(request({ ...journey, action: { type: 'complete' } }))).status,
  ).toBe(422);
  expect(writes()).toEqual([]);
});
test('real POST does not call authority when getUser reports an error with user data', async () => {
  getUser.mockResolvedValue({
    data: { user: { id: subject } },
    error: { message: 'invalid' },
  });
  expect((await POST(request(journey))).status).toBe(401);
  expect(rpc).not.toHaveBeenCalled();
});
test.each(['card', 'classic'])(
  'real POST rejects browser winner/result in %s settlement',
  async (mode) => {
    const body = {
      operation: `settle-${mode}-battle`,
      travelerId,
      battleId,
      commands: [],
    };
    for (const key of ['won', 'winner', 'winnerId', 'result', 'xp'])
      expect((await POST(request({ ...body, [key]: true }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  },
);
test('real POST computes a classic victory from the stored battle, not a browser result', async () => {
  const traveler = createTraveler(
    'Synthetic',
    DEFAULT_APPEARANCE,
    travelerId,
    '2026-10-17T00:00:00.000Z',
  );
  traveler.attributes = { life: 20, strength: 30, defense: 5, wisdom: 5 };
  const record = {
    id: battleId,
    travelerId,
    mode: 'classic',
    seed: 123,
    player: travelerBattleSnapshot(traveler),
    opponent: TRAINING_OPPONENTS[0],
  };
  let battle = createArenaBattle(
    record.player,
    record.opponent,
    record.seed,
    record.id,
  );
  const commands: ArenaAction[] = [];
  while (battle.status !== 'finished' && commands.length < 30) {
    commands.push('attack');
    battle = resolveArenaRound(battle, 'attack');
  }
  expect(battle.winnerId).toBe(travelerId);
  rpc.mockImplementation(async (name, args) => ({
    data:
      name === 'economy_protocol_version'
        ? 2
        : args.p_operation === 'battle'
          ? record
          : { xp: 8, coins: 3 },
    error: null,
  }));
  const response = await POST(
    request({
      operation: 'settle-classic-battle',
      travelerId,
      battleId,
      commands,
    }),
  );
  expect(response.status).toBe(200);
  expect(writes()).toEqual([
    [
      'economy_authority',
      {
        p_user_id: subject,
        p_traveler_id: travelerId,
        p_operation: 'settle',
        p_payload: { battleId, won: true },
      },
    ],
  ]);
});
