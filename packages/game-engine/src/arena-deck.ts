import type { ArenaSpecialId } from './index';
export const ARENA_DECK_SIZE = 7;
export type ArenaBaseAction = 'attack' | 'defend' | `special:${ArenaSpecialId}`;
export type ArenaCard = Readonly<{
  id: string;
  name: string;
  rarity: string;
  type: 'OFFENSIVE' | 'DEFENSIVE' | 'TACTICAL';
  // null means displayed but unavailable; never invent an effect for it.
  action: ArenaBaseAction | null;
}>;
export type ArenaBattleDeck = Readonly<{
  ownerId: string;
  cards: readonly ArenaCard[];
  usedIds: readonly string[];
}>;
export const ARENA_CARD_ACTIONS: readonly ArenaBaseAction[] = Object.freeze([
  'attack',
  'defend',
  'special:path-strike',
  'special:steadfast-guard',
  'special:discernment',
  'special:pilgrim-step',
  'special:measured-strike',
]);
const actions = new Set<string>(ARENA_CARD_ACTIONS);
export function isArenaCard(value: unknown): value is ArenaCard {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    ['id', 'name', 'rarity'].every(
      (k) =>
        typeof v[k] === 'string' &&
        (v[k] as string).trim().length > 0 &&
        (v[k] as string).length <= 100,
    ) &&
    ['OFFENSIVE', 'DEFENSIVE', 'TACTICAL'].includes(String(v.type)) &&
    (v.action === null || actions.has(String(v.action)))
  );
}
export function validateArenaDeck(
  ids: readonly string[],
  owned: readonly ArenaCard[],
): 'count' | 'duplicate' | 'ownership' | 'unavailable' | null {
  if (ids.length !== ARENA_DECK_SIZE) return 'count';
  if (new Set(ids).size !== ids.length) return 'duplicate';
  for (const id of ids) {
    const matches = owned.filter((c) => c.id === id);
    if (matches.length !== 1) return 'ownership';
    if (!isArenaCard(matches[0]) || !matches[0].action) return 'unavailable';
  }
  return null;
}
export function freezeArenaDeck(
  ownerId: string,
  ids: readonly string[],
  owned: readonly ArenaCard[],
): ArenaBattleDeck {
  const error = validateArenaDeck(ids, owned);
  if (error) throw new Error(`Invalid arena deck: ${error}`);
  return {
    ownerId,
    cards: ids.map((id) => ({ ...owned.find((c) => c.id === id)! })),
    usedIds: [],
  };
}
