import { expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  getInventory: vi.fn(),
  getCurrentOnlineUserId: vi.fn(() => 'owner'),
  canUseTravelerInCurrentSession: vi.fn(() => true),
}));
vi.mock('../../lib/supabase/repositories/inventory-repository', () => ({
  inventoryRepository: mocks,
}));
vi.mock('../../lib/supabase/online-sync', () => mocks);
import {
  APPROVED_ARENA_CARDS,
  cardsFromInventory,
  loadArenaCollection,
} from './collection';
import { cards } from '../../../../tests/fixtures/arena-deck';
import { getArenaCardCatalog } from '@rpg/game-engine';
test('production catalog grants no cards and metadata/equipment cannot invent ownership', () => {
  expect(APPROVED_ARENA_CARDS).toEqual([]);
  expect(
    cardsFromInventory(
      'p',
      [{ traveler_id: 'p', item_id: 'equipment', quantity: 1 }],
      cards,
    ),
  ).toEqual([]);
  expect(
    cardsFromInventory(
      'p',
      [
        { traveler_id: 'other', item_id: cards[0].id, quantity: 1 },
        { traveler_id: 'p', item_id: cards[1].id, quantity: 0 },
        { traveler_id: 'p', item_id: cards[2].id, quantity: 3 },
      ],
      cards,
    ),
  ).toEqual([cards[2]]);
});
test('production denies inventory rows as official entitlement and enforces the current account/Traveler', async () => {
  mocks.getInventory.mockResolvedValue([
    {
      traveler_id: 'p',
      item_id: 'arena-card-path-strike',
      quantity: 99,
      metadata: { official: true },
    },
  ]);
  expect(await loadArenaCollection('owner', 'p')).toEqual([]);
  expect(mocks.getInventory).not.toHaveBeenCalled();
  await expect(loadArenaCollection('foreign', 'p')).rejects.toThrow();
  mocks.canUseTravelerInCurrentSession.mockReturnValueOnce(false);
  await expect(loadArenaCollection('owner', 'other')).rejects.toThrow();
});

test('the legacy inventory projection cannot promote official IDs even with proposed definitions and positive quantities', () => {
  const catalog = getArenaCardCatalog();
  const rows = catalog.map((card) => ({
    traveler_id: 'p',
    item_id: card.id,
    quantity: 1,
  }));
  expect(cardsFromInventory('p', rows, catalog)).toEqual([]);
  expect(cardsFromInventory('foreign', rows, catalog)).toEqual([]);
});
