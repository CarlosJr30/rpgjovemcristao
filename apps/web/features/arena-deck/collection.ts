import {
  ARENA_CARD_ID_PREFIX,
  getApprovedArenaCards,
  getArenaCardReadiness,
  isArenaCard,
  type ArenaCard,
} from '@rpg/game-engine';
import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
} from '../../lib/supabase/online-sync';
import { requestAuthority } from '../../lib/authority/client';
import type { OwnedCard } from '../../lib/authority/service';
// Proposed definitions are separate from playable approvals and server ownership.
export const APPROVED_ARENA_CARDS: readonly ArenaCard[] =
  getApprovedArenaCards();
export type CollectionSource = (
  owner: string,
  traveler: string,
) => Promise<readonly ArenaCard[]>;
export function cardsFromInventory(
  traveler: string,
  rows: readonly { traveler_id: string; item_id: string; quantity: number }[],
  catalog: readonly ArenaCard[],
): readonly ArenaCard[] {
  // Legacy projection for isolated adapters/tests. Inventory rows are not proof
  // of an official grant; the production loader below never uses this shortcut.
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
  return catalog.filter(
    (c) =>
      isArenaCard(c) &&
      !c.id.startsWith(ARENA_CARD_ID_PREFIX) &&
      owned.has(c.id),
  );
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
  if (!getArenaCardReadiness().collectionAvailable) return [];
  const owned = await requestAuthority<OwnedCard[]>({operation:'collection',travelerId:traveler});
  return APPROVED_ARENA_CARDS.filter(c=>owned.some(e=>e.card.id===c.id&&e.card.action===c.action&&/^[\da-f-]{36}$/i.test(e.receiptId)));
};
