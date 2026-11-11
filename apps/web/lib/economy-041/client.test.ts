// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest';
import { readResaleAccess, sellRepeated, claimProgressReward } from './client';
const m = vi.hoisted(() => ({
  rpc: vi.fn(),
  reload: vi.fn(),
  owner: 'owner',
  revision: 1,
  training: false,
  usable: true,
}));
vi.mock('../supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: m.rpc }),
}));
vi.mock('../supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => m.owner,
  getOnlineSessionRevision: () => m.revision,
  canUseTravelerInCurrentSession: () => m.usable,
  reloadOnlineTraveler: m.reload,
}));
vi.mock('../training-qa/client', () => ({ activeTraining: () => m.training }));
vi.mock('../release-scope', () => ({ isShopRelease: () => true }));
const item = 'equipment-apprentice-sword';
const sale = () => ({
  version: 1,
  catalogVersion: 'economy041-chest-v1',
  receiptId: '00000000-0000-4000-8000-000000000011',
  itemId: item,
  quantity: 1,
  coins: 10,
});
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  m.owner = 'owner';
  m.revision = 1;
  m.training = false;
  m.usable = true;
  m.reload.mockResolvedValue(true);
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: async (
        _k: unknown,
        _o: unknown,
        fn: (lock: object) => unknown,
      ) => fn({}),
    },
  });
});
test('a sale sends only identity, expected quantity and one nonce; server decides value and refreshes inventory', async () => {
  m.rpc.mockResolvedValue({ data: sale(), error: null });
  expect(await sellRepeated('actor', item, 2)).toEqual({
    quantity: 1,
    coins: 10,
  });
  expect(m.rpc).toHaveBeenCalledExactlyOnceWith('sell_repeated_item', {
    p_actor: 'actor',
    p_item: item,
    p_operation_id: expect.any(String),
    p_expected_quantity: 2,
  });
  expect(m.reload).toHaveBeenCalledExactlyOnceWith('actor');
  expect(localStorage.length).toBe(0);
});
test('an ambiguous failure retains the same ID and expected quantity, avoiding a second economic sale', async () => {
  m.rpc
    .mockResolvedValueOnce({ data: null, error: { code: 'network' } })
    .mockResolvedValueOnce({ data: sale(), error: null });
  await expect(sellRepeated('actor', item, 2)).rejects.toThrow(
    /não confirmada/,
  );
  await sellRepeated('actor', item, 9);
  expect(m.rpc.mock.calls[1][1]).toEqual(m.rpc.mock.calls[0][1]);
});
test('last-copy rejection clears only the rejected intent and never updates local economic state', async () => {
  m.rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
  await expect(sellRepeated('actor', item, 2)).rejects.toThrow(/preservada/);
  expect(m.reload).not.toHaveBeenCalled();
  expect(localStorage.length).toBe(0);
});
test('training and foreign contexts cannot route QA possessions to official resale', async () => {
  m.training = true;
  await expect(sellRepeated('actor', item, 2)).rejects.toThrow();
  m.training = false;
  m.usable = false;
  await expect(readResaleAccess('actor', item)).rejects.toThrow();
  expect(m.rpc).not.toHaveBeenCalled();
});
test('late results after session change are rejected and a successful reward must match the event', async () => {
  m.rpc.mockImplementationOnce(async () => {
    m.revision++;
    return { data: sale(), error: null };
  });
  await expect(sellRepeated('actor', item, 2)).rejects.toThrow(/Retome/);
  expect(m.reload).not.toHaveBeenCalled();
  m.rpc.mockResolvedValue({
    data: { ...sale(), eventKind: 'mission', eventId: 'foreign' },
    error: null,
  });
  await expect(claimProgressReward('actor', 'mission', 'own')).rejects.toThrow(
    /indisponível/,
  );
});
