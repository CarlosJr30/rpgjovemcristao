import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import {
  legacyTrajectories,
  MEASURED_CARD_ID,
  measuredHero,
  measuredOpponent,
  syntheticSevenCards,
} from '../../../tests/fixtures/measured-strike';
import {
  arenaCardAvailability,
  arenaCombatConfig,
  arenaFocus,
  arenaSpecials,
  calculateDamage,
  createArenaBattle,
  createArenaDeckBattle,
  describeCatalogCard,
  getApprovedArenaCards,
  getArenaCardReadiness,
  resolveArenaCommand,
  resolveArenaRound,
  specialCost,
  specialLoadout,
  type BattleParticipantSnapshot,
  type BattleState,
} from './index';

const start = (
  p = measuredHero,
  o: BattleParticipantSnapshot = {
    ...measuredOpponent,
    arenaProfile: undefined,
  },
): BattleState => {
  const cards = syntheticSevenCards();
  return createArenaDeckBattle(
    p,
    o,
    42,
    '003a-math-fixture',
    cards.map((c) => c.id),
    cards,
  );
};
const charge = (b: BattleState, focusPoints = 1): BattleState => ({
  ...b,
  player: { ...b.player, focusPoints },
});
const play = (b: BattleState) =>
  resolveArenaCommand(b, b.id, b.round, `card:${MEASURED_CARD_ID}`);

test('legacy AI and six existing actions retain the captured pre-change trajectories', () => {
  const states = legacyTrajectories();
  expect(states).toHaveLength(64);
  const hash = createHash('sha256')
    .update(JSON.stringify(states))
    .digest('hex');
  expect(hash).toBe(
    '7a15a1ef7743bf2a9afd21867e63eee9571d3f7edd38f6dbba1992edbcb0a928',
  );
});

test('candidate identity, seven distinct proposals and production gates remain independent', () => {
  const cards = syntheticSevenCards();
  expect(cards).toHaveLength(7);
  expect(new Set(cards.map((card) => card.action)).size).toBe(7);
  expect(cards.filter((card) => card.id === MEASURED_CARD_ID)).toHaveLength(1);
  expect(cards.at(-1)).toMatchObject({
    name: 'Golpe Medido',
    rarity: 'comum',
    minimumLevel: 1,
    focusCost: 1,
    homologation: { status: 'proposed' },
    acquisition: { authorizedSources: [] },
    art: { reference: null },
    biblicalReference: null,
  });
  expect(getApprovedArenaCards()).toEqual([]);
  expect(getArenaCardReadiness()).toMatchObject({
    missingDistinctEffects: 0,
    approvedCards: 0,
    collectionAvailable: false,
    starterAvailable: false,
  });
});

test('multiplication occurs after defense subtraction and before rounding, guards and armor', () => {
  // 3 + 2.2*5 - 1.15*2 = 11.7; round(11.7*1.15) = 13,
  // whereas multiplying an already rounded basic hit would produce 14.
  const b = charge(start());
  const used = play(b);
  expect(used.player.damageDealt).toBe(13);
  expect(used.player.damageDealt).not.toBe(
    Math.round(12 * arenaCombatConfig.measuredStrikeMultiplier),
  );
  for (const [guard, armor, expected] of [
    ['basic', false, 7],
    ['basic', true, 6],
    ['fortified', false, 4],
    ['fortified', true, 4],
  ] as const) {
    const o: BattleParticipantSnapshot = {
      ...measuredOpponent,
      equipment: armor
        ? [
            {
              id: 'fixture-armor',
              name: 'Armadura sintética',
              power: 0,
              effectIds: ['traveler-armor'],
            },
          ]
        : [],
    };
    const before = charge(start(measuredHero, o));
    const guarded: BattleState = {
      ...before,
      opponent: { ...before.opponent, guard },
    };
    expect(play(guarded).player.damageDealt).toBe(expected);
  }
});

test('cost stays one with every bounded discount; rejected level/Foco/command never consumes', () => {
  const special = arenaSpecials.find(
    (entry) => entry.id === 'measured-strike',
  )!;
  for (const discount of [-9, 0, 1, 2, 100, NaN, Infinity]) {
    const p = {
      ...measuredHero,
      level: 1,
      specialModifiers: { 'measured-strike': { focusDiscount: discount } },
    };
    expect(specialCost(p, special)).toBe(1);
    const ready = charge(start(p));
    const used = play(ready);
    expect(arenaFocus(used.player)).toBe(0);
    expect(used.deck?.usedIds).toEqual([MEASURED_CARD_ID]);
    expect(
      [...used.log]
        .reverse()
        .find((entry) => entry.actorId === p.id && entry.kind === 'damage')
        ?.focusDelta,
    ).toBe(0);
  }
  for (const focus of [0, -1, NaN, Infinity]) {
    const b = charge(start(), focus);
    expect(play(b)).toBe(b);
    expect(b.deck?.usedIds).toEqual([]);
  }
  const low = charge(start({ ...measuredHero, level: 0 }));
  expect(arenaCardAvailability(low, MEASURED_CARD_ID).status).toBe('level');
  expect(play(low)).toBe(low);
  const b = charge(start());
  for (const bad of [
    'special:measured-strike',
    'card:foreign',
    '',
    null,
    { cardId: MEASURED_CARD_ID, effect: 999 },
  ])
    expect(resolveArenaCommand(b, b.id, b.round, bad as never)).toBe(b);
  expect(
    resolveArenaCommand(b, 'wrong', b.round, `card:${MEASURED_CARD_ID}`),
  ).toBe(b);
  expect(
    resolveArenaCommand(b, b.id, b.round + 1, `card:${MEASURED_CARD_ID}`),
  ).toBe(b);
});

test('only validated card IDs activate the action; legacy/AI loadouts and direct APIs cannot', () => {
  const b = charge(start());
  expect(resolveArenaRound(b, 'special:measured-strike')).toBe(b);
  const legacy = charge(createArenaBattle(measuredHero, measuredOpponent, 42));
  expect(resolveArenaRound(legacy, 'special:measured-strike')).toBe(legacy);
  expect(
    resolveArenaCommand(
      legacy,
      legacy.id,
      legacy.round,
      `card:${MEASURED_CARD_ID}`,
    ),
  ).toBe(legacy);
  expect(specialLoadout(measuredHero)).toEqual([
    'path-strike',
    'steadfast-guard',
    'discernment',
    'pilgrim-step',
  ]);
  expect(
    specialLoadout({ ...measuredHero, specialLoadout: ['measured-strike'] }),
  ).toEqual([]);
  expect(
    play({ ...b, deck: { ...b.deck!, ownerId: 'foreign' } }),
  ).toMatchObject({ round: b.round, deck: { usedIds: [] } });
});

test('single use, stale double-click, frozen snapshot and new-battle restoration', () => {
  const b = charge(start());
  const used = play(b);
  expect(used.round).toBe(b.round + 1);
  expect(play(charge(used))).toEqual(charge(used));
  expect(
    resolveArenaCommand(used, b.id, b.round, `card:${MEASURED_CARD_ID}`),
  ).toBe(used);
  expect(used.deck?.cards).toEqual(b.deck?.cards);
  expect(start().deck?.usedIds).toEqual([]);
  const finished = { ...used, status: 'finished' as const };
  expect(play(finished)).toBe(finished);
});

test('prepared tactics and sword-after-defend apply without spending the path-strike reinforcement', () => {
  const p: BattleParticipantSnapshot = {
    ...measuredHero,
    equipment: [
      {
        id: 'fixture-sword',
        name: 'Espada sintética',
        power: 4,
        effectIds: ['path-sword'],
      },
    ],
    specialModifiers: { 'measured-strike': { powerMultiplier: 9 } },
  };
  const b = charge(start(p));
  const prepared: BattleState = {
    ...b,
    player: { ...b.player, tacticalMultiplier: 1.3, defendedLastRound: true },
  };
  const used = play(prepared);
  const expected = calculateDamage(p, measuredOpponent, {
    multiplier: 1.3 * 1.2 * 1.15 * 1.25,
  });
  expect(used.player.damageDealt).toBe(expected);
  expect(used.player.usedEffects).not.toContain('path-sword');
  expect(used.player.tacticalMultiplier).toBe(1);
  const text = describeCatalogCard(MEASURED_CARD_ID, prepared.player)!;
  expect(text).toMatchObject({ minimumLevel: 1, focusCost: 1 });
  expect(text.explanation).toContain('1,15');
  expect(text.explanation).toContain('menos a Defesa');
  expect(text.explanation).toContain('1,25');
  expect(text.explanation).toContain('Não gera Foco');
});
