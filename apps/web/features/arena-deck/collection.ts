import { isArenaCard, type ArenaCard } from '@rpg/game-engine';
import { inventoryRepository } from '../../lib/supabase/repositories/inventory-repository';
import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
} from '../../lib/supabase/online-sync';
// No collectible combat-card catalog exists in the audited baseline. Approval and
// acquisition are dependencies, never inferred from item metadata or equipment art.
export const APPROVED_ARENA_CARDS: readonly ArenaCard[] = Object.freeze([]);
export type CollectionSource = (
  owner: string,
  traveler: string,
) => Promise<readonly ArenaCard[]>;
export function cardsFromInventory(
  traveler: string,
  rows: readonly { traveler_id: string; item_id: string; quantity: number }[],
  catalog: readonly ArenaCard[],
): readonly ArenaCard[] {
  const owned = new Set(
    rows
      .filter(
        (r) =>
          r.traveler_id === traveler &&
          Number.isSafeInteger(r.quantity) &&
          r.quantity > 0,
      )
      .map((r) => r.item_id),
  );
  return catalog.filter((c) => isArenaCard(c) && owned.has(c.id));
}
export const loadArenaCollection: CollectionSource = async (
  owner,
  traveler,
) => {
  if (
    !owner ||
    getCurrentOnlineUserId() !== owner ||
    !canUseTravelerInCurrentSession(traveler)
  )
    throw new Error('Viajante indisponível nesta conta.');
  const inventory = await inventoryRepository.getInventory(traveler);
  if (
    getCurrentOnlineUserId() !== owner ||
    !canUseTravelerInCurrentSession(traveler)
  )
    throw new Error('A sessão mudou.');
  return cardsFromInventory(traveler, inventory, APPROVED_ARENA_CARDS);
};
