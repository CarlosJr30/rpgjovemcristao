import { beforeEach, expect, it, vi } from 'vitest';
import { getArenaCardCatalog } from '@rpg/game-engine';
import { loadPlayerArenaCollection } from './player-collection';
const m = vi.hoisted(() => ({
  owner: 'owner',
  usable: true,
  revision: 1,
  rpc: vi.fn(),
}));
vi.mock('../../lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: m.rpc }),
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => m.owner,
  canUseTravelerInCurrentSession: () => m.usable,
  getOnlineSessionRevision: () => m.revision,
}));
const row = () => ({
  card: { ...getArenaCardCatalog()[0] },
  version: 'isolated-production-fixture',
  receiptId: '11111111-1111-4111-8111-111111111111',
});
beforeEach(() => {
  vi.clearAllMocks();
  m.owner = 'owner';
  m.usable = true;
  m.revision = 1;
  m.rpc.mockResolvedValue({ data: [], error: null });
});
it('preserves an empty official collection and only calls the own read RPC', async () => {
  await expect(loadPlayerArenaCollection('owner', 'hero')).resolves.toEqual([]);
  expect(m.rpc).toHaveBeenCalledExactlyOnceWith('get_owned_cards', {
    p_traveler_id: 'hero',
  });
});
it('does not fill a partial collection with local definitions', async () => {
  m.rpc.mockResolvedValue({ data: [row()], error: null });
  await expect(loadPlayerArenaCollection('owner', 'hero')).resolves.toEqual([
    row().card,
  ]);
});
it.each(['qa-training', 'unknown'])(
  'rejects marked %s provenance even with a valid receipt',
  async (provenance) => {
    m.rpc.mockResolvedValue({ data: [{ ...row(), provenance }], error: null });
    await expect(loadPlayerArenaCollection('owner', 'hero')).rejects.toThrow();
  },
);
it('rejects the TEST catalog version without a provenance marker', async () => {
  m.rpc.mockResolvedValue({
    data: [{ ...row(), version: 'arena-cards-2026-10-20.2-fixprod003-test' }],
    error: null,
  });
  await expect(loadPlayerArenaCollection('owner', 'hero')).rejects.toThrow();
});
it.each(['owner', 'avatar'])(
  'denies foreign %s before reading',
  async (kind) => {
    if (kind === 'owner') m.owner = 'other';
    else m.usable = false;
    await expect(loadPlayerArenaCollection('owner', 'hero')).rejects.toThrow();
    expect(m.rpc).not.toHaveBeenCalled();
  },
);
it('rejects a delayed result after changing session', async () => {
  m.rpc.mockImplementation(async () => {
    m.revision++;
    return { data: [row()], error: null };
  });
  await expect(loadPlayerArenaCollection('owner', 'hero')).rejects.toThrow();
});
it('rejects duplicate cards instead of counting them toward seven', async () => {
  m.rpc.mockResolvedValue({ data: [row(), row()], error: null });
  await expect(loadPlayerArenaCollection('owner', 'hero')).rejects.toThrow();
});
it('rejects an altered definition', async () => {
  const v = row();
  v.card.name = 'altered';
  m.rpc.mockResolvedValue({ data: [v], error: null });
  await expect(loadPlayerArenaCollection('owner', 'hero')).rejects.toThrow();
});
it('keeps a denied RPC as an error', async () => {
  m.rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
  await expect(loadPlayerArenaCollection('owner', 'hero')).rejects.toThrow();
});
