import { getArenaCardCatalog, type ArenaCard } from '@rpg/game-engine';
import { readOwnedCards } from '../../lib/supabase/owned-cards-read';
import { getCurrentOnlineUserId } from '../../lib/supabase/online-sync';
import type { CollectionSource } from './collection';

/** Own server receipts only. No grants, TEST catalog or QA authority. */
export const loadPlayerArenaCollection: CollectionSource = async (
  owner,
  traveler,
) => {
  if (!owner || getCurrentOnlineUserId() !== owner)
    throw new Error('Viajante indisponível nesta conta.');
  const rows = await readOwnedCards(traveler, true);
  if (getCurrentOnlineUserId() !== owner) throw new Error('A conta mudou.');
  const catalog = getArenaCardCatalog(),
    seen = new Set<string>();
  const cards: ArenaCard[] = [];
  for (const row of rows) {
    const definition = catalog.find((c) => c.id === row.card.id);
    if (
      !definition ||
      seen.has(row.card.id) ||
      ['id', 'name', 'type', 'rarity', 'action'].some(
        (k) =>
          definition[k as keyof ArenaCard] !== row.card[k as keyof ArenaCard],
      )
    )
      throw new Error('Carta indisponível para este combate.');
    seen.add(row.card.id);
    cards.push(Object.freeze({ ...row.card }));
  }
  return Object.freeze(cards);
};
