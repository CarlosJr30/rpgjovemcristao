import { expect, test } from 'vitest';
import {
  createArenaDeckBattle,
  resolveArenaCommand,
  resolveArenaRound,
  validateArenaDeck,
  arenaCardDescription,
  createArenaBattle,
} from './index';
import {
  cards,
  ids,
  player,
  opponent,
} from '../../../tests/fixtures/arena-deck';
const start = () =>
  createArenaDeckBattle(player, opponent, 42, 'battle', ids, cards);
test('40 owned cards allow exactly seven distinct functional cards, with a frozen snapshot', () => {
  expect(cards).toHaveLength(40);
  expect(validateArenaDeck(ids, cards)).toBeNull();
  expect(validateArenaDeck(ids.slice(0, 6), cards)).toBe('count');
  expect(validateArenaDeck([...ids, 'extra'], cards)).toBe('count');
  expect(validateArenaDeck([...ids.slice(0, 6), ids[0]], cards)).toBe(
    'duplicate',
  );
  expect(validateArenaDeck([...ids.slice(0, 6), 'foreign'], cards)).toBe(
    'ownership',
  );
  expect(validateArenaDeck([...ids.slice(0, 6), cards[39].id], cards)).toBe(
    'unavailable',
  );
  const battle = start();
  expect(battle.deck?.cards[0]).not.toBe(cards[0]);
  expect(() =>
    createArenaDeckBattle(player, opponent, 42, 'bad', [], cards),
  ).toThrow();
});
test('used card cannot execute again, foreign card cannot execute, inventory is untouched', () => {
  const before = start();
  const next = resolveArenaRound(before, `card:${ids[0]}`);
  expect(next.round).toBe(before.round + 1);
  expect(next.deck?.usedIds).toEqual([ids[0]]);
  expect(resolveArenaRound(next, `card:${ids[0]}`)).toBe(next);
  expect(resolveArenaRound(before, 'card:foreign')).toBe(before);
  expect(cards).toHaveLength(40);
  expect(before.deck?.usedIds).toEqual([]);
});
test('optimistic identity/round reject rapid duplicates, including different-card stale commands', () => {
  const before = start();
  const after = resolveArenaCommand(
    before,
    before.id,
    before.round,
    `card:${ids[0]}`,
  );
  expect(
    resolveArenaCommand(after, before.id, before.round, `card:${ids[1]}`),
  ).toBe(after);
  expect(resolveArenaCommand(before, 'other', before.round, 'attack')).toBe(
    before,
  );
});
test('all seven cards can be consumed once; basic actions continue and finished battles reject everything', () => {
  let state = start();
  for (const id of ids) state = resolveArenaRound(state, `card:${id}`);
  expect(state.deck?.usedIds).toEqual(ids);
  while (state.status === 'in_progress')
    state = resolveArenaRound(state, 'attack');
  expect(resolveArenaRound(state, 'defend')).toBe(state);
  expect(resolveArenaRound(state, `card:${ids[0]}`)).toBe(state);
  expect(
    createArenaDeckBattle(player, opponent, 42, 'rematch', ids, cards).deck
      ?.usedIds,
  ).toEqual([]);
});
test('equipment/attributes and actual action calculations match the original resolver', () => {
  const before = start();
  const ordinary = createArenaBattle(player, opponent, 42, 'battle');
  const card = resolveArenaRound(before, `card:${ids[0]}`);
  const basic = resolveArenaRound(ordinary, 'attack');
  expect(card.player).toEqual(basic.player);
  expect(card.opponent).toEqual(basic.opponent);
  expect(card.log).toEqual(basic.log);
  expect(arenaCardDescription(cards[39])).toMatch(/indisponível/);
});
test('card-backed specials keep level/Foco validation; rejected action does not consume the card', () => {
  const special = { ...cards[0], action: 'special:path-strike' as const };
  const owned = [special, ...cards.slice(1)];
  const before = createArenaDeckBattle(player, opponent, 42, 'b', ids, owned);
  expect(resolveArenaRound(before, `card:${ids[0]}`)).toBe(before);
  const charged = { ...before, player: { ...before.player, focusPoints: 3 } };
  expect(resolveArenaRound(charged, `card:${ids[0]}`).deck?.usedIds).toContain(
    ids[0],
  );
  expect(
    resolveArenaRound(
      {
        ...charged,
        player: { ...charged.player, snapshot: { ...player, level: 1 } },
      },
      `card:${ids[0]}`,
    ),
  ).toMatchObject({ deck: { usedIds: [] } });
});
test('malformed or mismatched deck state fails closed', () => {
  const before = start();
  expect(
    resolveArenaRound(
      { ...before, deck: { ...before.deck!, ownerId: 'other' } },
      'attack',
    ).round,
  ).toBe(before.round);
  expect(
    resolveArenaRound(
      { ...before, deck: { ...before.deck!, usedIds: ['foreign'] } },
      'attack',
    ).round,
  ).toBe(before.round);
  expect(resolveArenaRound(before, null as never)).toBe(before);
});
