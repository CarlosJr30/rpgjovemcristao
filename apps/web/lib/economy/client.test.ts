import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ auth: { getSession } }),
}));
import { economyClient } from './client';
beforeEach(() => {
  getSession.mockReset();
  getSession.mockResolvedValue({
    data: { session: { access_token: 'synthetic-session' } },
    error: null,
  });
});
afterEach(() => vi.unstubAllGlobals());
test('sends an item identity with session authentication and no economic values', async () => {
  const network = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ status: 'purchased' }));
  vi.stubGlobal('fetch', network);
  await economyClient.purchase('traveler', 'traveler-sword-common');
  const init = network.mock.calls[0][1]!;
  expect(JSON.parse(String(init.body))).toEqual({
    operation: 'purchase-equipment',
    travelerId: 'traveler',
    itemId: 'traveler-sword-common',
  });
  expect(init.headers).toMatchObject({
    Authorization: 'Bearer synthetic-session',
  });
});
test('does not use a local credit fallback after a server failure', async () => {
  const network = vi.fn(async () => new Response('', { status: 503 }));
  vi.stubGlobal('fetch', network);
  await expect(
    economyClient.start('traveler', 'training-apprentice'),
  ).rejects.toThrow('servidor');
  expect(network).toHaveBeenCalledTimes(1);
});
test('does not issue requests without an authenticated session', async () => {
  getSession.mockResolvedValue({ data: { session: null }, error: null });
  const network = vi.fn();
  vi.stubGlobal('fetch', network);
  await expect(
    economyClient.purchase('traveler', 'traveler-sword-common'),
  ).rejects.toThrow('Entre novamente');
  expect(network).not.toHaveBeenCalled();
});

test('serializes the legacy and journey contracts without amounts, stats or a claimed winner', async () => {
  const network = vi.fn<typeof fetch>().mockImplementation(async()=>Response.json({}));
  vi.stubGlobal('fetch', network);
  await economyClient.startClassic('traveler', 'training-apprentice');
  await economyClient.settleClassic('traveler', 'issued-battle', [
    'attack',
    'defend',
  ]);
  await economyClient.journey('traveler', 'request-id', {
    type: 'fragment',
    id: 'wind',
    answers: ['folhas'],
  });
  expect(
    network.mock.calls.map(([, init]) => JSON.parse(String(init!.body))),
  ).toEqual([
    {
      operation: 'start-classic-battle',
      travelerId: 'traveler',
      opponentId: 'training-apprentice',
    },
    {
      operation: 'settle-classic-battle',
      travelerId: 'traveler',
      battleId: 'issued-battle',
      commands: ['attack', 'defend'],
    },
    {
      operation: 'journey-action',
      travelerId: 'traveler',
      operationId: 'request-id',
      action: { type: 'fragment', id: 'wind', answers: ['folhas'] },
    },
  ]);
});
