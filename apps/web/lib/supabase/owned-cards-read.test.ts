import { beforeEach, expect, it, vi } from 'vitest';
import { getArenaCardCatalog } from '@rpg/game-engine';
import { readOwnedCards } from './owned-cards-read';
const m = vi.hoisted(() => ({ rpc: vi.fn(), owner: 'owner', revision: 1, usable: true }));
vi.mock('./client', () => ({ getSupabaseBrowserClient: () => ({ rpc: m.rpc }) }));
vi.mock('./online-sync', () => ({ getCurrentOnlineUserId: () => m.owner, getOnlineSessionRevision: () => m.revision, canUseTravelerInCurrentSession: () => m.usable }));
const row = () => ({ card: getArenaCardCatalog()[0], version: 'isolated-fixture', receiptId: '11111111-1111-4111-8111-111111111111' });
beforeEach(() => { vi.clearAllMocks(); m.owner = 'owner'; m.revision = 1; m.usable = true; m.rpc.mockResolvedValue({ data: [], error: null }); });
it('uses only the ownership-bound read endpoint and preserves an empty collection', async () => {
  await expect(readOwnedCards('hero')).resolves.toEqual([]);
  expect(m.rpc).toHaveBeenCalledExactlyOnceWith('get_owned_cards', { p_traveler_id: 'hero' });
});
it('keeps server-provided definitions instead of granting the proposed local catalog', async () => {
  m.rpc.mockResolvedValue({ data: [row()], error: null });
  await expect(readOwnedCards('hero')).resolves.toEqual([row()]);
});
it.each(['anonymous', 'foreign'])('denies %s context before a request', async kind => {
  if (kind === 'anonymous') m.owner = ''; else m.usable = false;
  await expect(readOwnedCards('hero')).rejects.toThrow(); expect(m.rpc).not.toHaveBeenCalled();
});
it.each(['session', 'owner', 'selection'])('rejects a delayed response after %s changes', async kind => {
  m.rpc.mockImplementation(async () => { if (kind === 'session') m.revision++; else if (kind === 'owner') m.owner = 'other'; else m.usable = false; return { data: [row()], error: null }; });
  await expect(readOwnedCards('hero')).rejects.toThrow();
});
it.each([null, {}, [{ ...row(), receiptId: 'forged' }], [{ ...row(), card: { id: 'invented' } }]])('fails closed for malformed data %#', async data => {
  m.rpc.mockResolvedValue({ data, error: null }); await expect(readOwnedCards('hero')).rejects.toThrow();
});
it('does not turn a denied RPC into an empty success', async () => {
  m.rpc.mockResolvedValue({ data: null, error: { code: '42501' } }); await expect(readOwnedCards('hero')).rejects.toThrow();
});
