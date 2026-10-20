import { expect, test } from 'vitest';
import {
  arenaCardAvailability,
  arenaFocus,
  arenaSpecials,
  createArenaBattle,
  createArenaDeckBattle,
  resolveArenaCommand,
  resolveArenaRound,
  type BattleParticipantSnapshot,
  type BattleState,
} from './index';
import { player, opponent } from '../../../tests/fixtures/arena-deck';
import {
  specialCards,
  specialIds,
} from '../../../tests/fixtures/arena-special-cards';
const start = (p: BattleParticipantSnapshot = player) =>
  createArenaDeckBattle(p, opponent, 42, 'product', specialIds, specialCards);
const charge = (b: BattleState, focusPoints = 3): BattleState => ({
  ...b,
  player: { ...b.player, focusPoints },
});
const command = (
  b: BattleState,
  action: Parameters<typeof resolveArenaCommand>[3],
) => resolveArenaCommand(b, b.id, b.round, action);

test('product requires seven and denies every direct special, including via legacy export on a deck', () => {
  const b = charge(start());
  for (const s of arenaSpecials) {
    expect(command(b, `special:${s.id}` as never)).toBe(b);
    expect(resolveArenaRound(b, `special:${s.id}`)).toBe(b);
  }
  const lab = charge(createArenaBattle(player, opponent, 42));
  expect(command(lab, 'attack')).toBe(lab);
  expect(command(lab, 'defend')).toBe(lab);
  expect(command(lab, `card:${specialIds[0]}`)).toBe(lab);
  expect(resolveArenaRound(lab, 'special:path-strike')).not.toBe(lab);
  for (const a of [null, {}, 'special:unknown', 'equipment', 'card:foreign'])
    expect(command(b, a as never)).toBe(b);
});
test('basic actions generate existing Foco without consuming cards; own card consumes only its ID', () => {
  const b = start();
  const attacked = command(b, 'attack');
  expect(arenaFocus(attacked.player)).toBe(1);
  const defended = command(attacked, 'defend');
  expect(arenaFocus(defended.player)).toBe(2);
  expect(defended.deck?.usedIds).toEqual([]);
  const used = command(defended, `card:${specialIds[0]}`);
  expect(used.deck?.usedIds).toEqual([specialIds[0]]);
  expect(arenaFocus(used.player)).toBe(0);
  expect(used.deck?.cards).toEqual(b.deck?.cards);
  expect(used.deck?.cards).toHaveLength(7);
  expect(command(charge(used), `card:${specialIds[0]}`).round).toBe(used.round);
  expect(
    resolveArenaCommand(used, b.id, defended.round, `card:${specialIds[1]}`),
  ).toBe(used);
  expect(resolveArenaCommand(b, 'other', b.round, 'attack')).toBe(b);
});
test.each(arenaSpecials)(
  '$name: level/Foco reject without usage, card works without parallel legacy loadout',
  (s) => {
    const id = `fixture-special-${s.id}`;
    const b = start({ ...player, level: s.minimumLevel, specialLoadout: [] });
    expect(arenaCardAvailability(b, id)).toMatchObject({
      status: 'focus',
      focusCost: s.focusCost,
      missingFocus: s.focusCost,
    });
    expect(command(b, `card:${id}`)).toBe(b);
    const low = charge(start({ ...player, level: s.minimumLevel - 1 }));
    expect(arenaCardAvailability(low, id).status).toBe('level');
    expect(command(low, `card:${id}`)).toBe(low);
    expect(low.deck?.usedIds).toEqual([]);
    const ready = charge(b);
    const used = command(ready, `card:${id}`);
    expect(used.round).toBe(ready.round + 1);
    expect(used.deck?.usedIds).toEqual([id]);
    expect(arenaFocus(used.player)).toBe(3 - s.focusCost);
    expect(arenaCardAvailability(used, id).status).toBe('used');
    const legacy = charge(
      createArenaBattle(
        { ...player, level: s.minimumLevel },
        opponent,
        42,
        'product',
      ),
    );
    const expected = resolveArenaRound(legacy, `special:${s.id}`);
    // The different legacy loadout is intentional; combat fields must match.
    expect(used.player).toEqual({
      ...expected.player,
      snapshot: { ...expected.player.snapshot, specialLoadout: [] },
    });
    expect(used.opponent).toEqual(expected.opponent);
    expect(used.log).toEqual(expected.log);
  },
);
test('equipment discount/power and automatic reinforcement remain identical to legacy; no extra activation', () => {
  const p: BattleParticipantSnapshot = {
    ...player,
    attributes: { ...player.attributes, strength: 20 },
    specialModifiers: {
      'path-strike': { focusDiscount: 1, powerMultiplier: 1.25 },
    },
    equipment: [
      {
        id: 'sword',
        name: 'Espada teste',
        power: 4,
        effectIds: ['path-sword'],
      },
    ],
  };
  const b = charge(start(p), 1);
  expect(arenaCardAvailability(b, specialIds[0])).toMatchObject({
    status: 'available',
    focusCost: 1,
  });
  const used = command(b, `card:${specialIds[0]}`);
  const legacy = charge(createArenaBattle(p, opponent, 42, 'product'), 1);
  expect(used.player).toEqual(
    resolveArenaRound(legacy, 'special:path-strike').player,
  );
  expect(used.player.usedEffects).toEqual(['path-sword']);
  expect(arenaFocus(used.player)).toBe(0);
  const plain = start({ ...p, equipment: [], specialModifiers: undefined });
  expect(used.player.damageDealt).toBeGreaterThan(
    command(charge(plain), `card:${specialIds[0]}`).player.damageDealt,
  );
});
test('all seven IDs survive the battle and a new identity restores uses; closed rejects commands', () => {
  let b = start();
  for (const id of specialIds) b = command(charge(b), `card:${id}`);
  expect(b.deck?.usedIds).toEqual(specialIds);
  while (b.status === 'in_progress') b = command(b, 'attack');
  expect(command(b, 'defend')).toBe(b);
  expect(command(b, `card:${specialIds[0]}`)).toBe(b);
  expect(
    createArenaDeckBattle(player, opponent, 42, 'new', specialIds, specialCards)
      .deck?.usedIds,
  ).toEqual([]);
});
