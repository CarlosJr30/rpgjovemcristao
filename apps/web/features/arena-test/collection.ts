import { getArenaCardCatalog, type ArenaCard } from '@rpg/game-engine';
import { isArenaTestAvailable } from '../../lib/arena-test-scope';
import { readOwnedCards } from '../../lib/supabase/owned-cards-read';
import { getCurrentOnlineUserId } from '../../lib/supabase/online-sync';
import type { CollectionSource } from '../arena-deck/collection';

const TEST_VERSION = 'arena-cards-2026-10-20.2-fixprod003-test';

/** Existing TEST ownership only; no starter, loan, fixture or inventory write. */
export const loadTestArenaCollection: CollectionSource = async (
  owner,
  traveler,
) => {
  if (!isArenaTestAvailable() || !owner || getCurrentOnlineUserId() !== owner)
    throw new Error('Treino disponível somente na conta TEST autorizada.');
  const rows = await readOwnedCards(traveler);
  if (getCurrentOnlineUserId() !== owner) throw new Error('A conta mudou.');
  const catalog = getArenaCardCatalog();
  const seen = new Set<string>();
  const cards: ArenaCard[] = [];
  for (const row of rows) {
    const definition = catalog.find((c) => c.id === row.card.id);
    if (
      row.version !== TEST_VERSION ||
      !definition ||
      seen.has(row.card.id) ||
      definition.action !== row.card.action ||
      definition.name !== row.card.name ||
      definition.type !== row.card.type ||
      definition.rarity !== row.card.rarity
    )
      throw new Error('Carta fora do catálogo TEST homologado.');
    seen.add(row.card.id);
    cards.push(Object.freeze({ ...row.card }));
  }
  return Object.freeze(cards);
};
