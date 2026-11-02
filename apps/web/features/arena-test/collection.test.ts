import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getArenaCardCatalog } from '@rpg/game-engine';
const m = vi.hoisted(() => ({ read: vi.fn(), owner: 'owner' }));
vi.mock('../../lib/supabase/owned-cards-read', () => ({
  readOwnedCards: m.read,
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => m.owner,
}));
import { loadTestArenaCollection } from './collection';
const rows = () =>
  getArenaCardCatalog().map(({ id, name, rarity, type, action }) => ({
    card: { id, name, rarity, type, action },
    receiptId: '00000000-0000-4000-8000-000000000001',
    version: 'arena-cards-2026-10-20.2-fixprod003-test',
  }));
beforeEach(() => {
  m.owner = 'owner';
  m.read.mockReset();
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wkdvdzfkbwvhyjmamrsg.supabase.co',
  );
  vi.stubEnv('NEXT_PUBLIC_ARENA_TEST_PRACTICE', '1');
});
afterEach(() => vi.unstubAllEnvs());
test('returns only real read rows; empty or partial collections are never filled', async () => {
  m.read.mockResolvedValue([]);
  expect(await loadTestArenaCollection('owner', 'hero')).toEqual([]);
  m.read.mockResolvedValue(rows().slice(0, 2));
  const result = await loadTestArenaCollection('owner', 'hero');
  expect(result).toHaveLength(2);
  expect(Object.isFrozen(result)).toBe(true);
  expect(m.read).toHaveBeenLastCalledWith('hero');
});
test('wrong owner and production environment are rejected before reading', async () => {
  await expect(loadTestArenaCollection('another', 'hero')).rejects.toThrow();
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wspafhlbtlpabypzymjo.supabase.co',
  );
  await expect(loadTestArenaCollection('owner', 'hero')).rejects.toThrow();
  expect(m.read).not.toHaveBeenCalled();
});
test.each(['version', 'action', 'id', 'duplicate'] as const)(
  'rejects incompatible %s without converting a proposal to ownership',
  async (kind) => {
    const value = rows();
    if (kind === 'version') value[0].version = 'unapproved';
    if (kind === 'action') value[0].card.action = 'defend';
    if (kind === 'id') value[0].card.id = 'invented';
    if (kind === 'duplicate') value.push(value[0]);
    m.read.mockResolvedValue(value);
    await expect(loadTestArenaCollection('owner', 'hero')).rejects.toThrow(
      'catálogo TEST',
    );
  },
);
test('discarded account response cannot expose the former collection', async () => {
  m.read.mockImplementation(async () => {
    m.owner = 'other';
    return rows();
  });
  await expect(loadTestArenaCollection('owner', 'hero')).rejects.toThrow(
    'conta mudou',
  );
});
