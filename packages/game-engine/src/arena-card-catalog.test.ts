import { expect, test } from 'vitest';
import {
  ARENA_CARD_ACTIONS,
  ARENA_CARD_CATALOG_VERSION,
  ARENA_CARD_RARITIES,
  ARENA_CONTENT_040_CARDS,
  arenaCardAvailability,
  arenaCombatConfig,
  arenaSpecials,
  battleBalanceConfig,
  createArenaBattle,
  createArenaDeckBattle,
  describeArenaAction,
  describeCatalogCard,
  findArenaCardDefinition,
  getApprovedArenaCards,
  getArenaCardCatalog,
  getArenaCardReadiness,
  resolveApprovedArenaCard,
  resolveArenaCommand,
  resolveArenaRound,
  validateArenaDeck,
  type ArenaCard,
  type BattleState,
} from './index';
import { player, opponent } from '../../../tests/fixtures/arena-deck';

test('registry preserves the seven original cards and appends the 33 approved definitions', () => {
  const catalog = getArenaCardCatalog();
  expect(catalog.slice(0, 7).map((entry) => entry.id)).toEqual([
    'arena-card-basic-attack',
    'arena-card-basic-defense',
    'arena-card-path-strike',
    'arena-card-steadfast-guard',
    'arena-card-discernment',
    'arena-card-pilgrim-step',
    'arena-card-measured-strike',
  ]);
  expect(catalog).toHaveLength(40);
  expect(ARENA_CONTENT_040_CARDS).toHaveLength(33);
  expect(new Set(catalog.map((entry) => entry.id)).size).toBe(40);
  expect(catalog.slice(0, 7).map((entry) => entry.action)).toEqual(
    ARENA_CARD_ACTIONS,
  );
  expect(catalog).toEqual(getArenaCardCatalog());
  expect(
    validateArenaDeck(
      catalog.slice(0, 7).map((entry) => entry.id),
      catalog,
    ),
  ).toBeNull();
  expect(
    validateArenaDeck(
      [...catalog.slice(0, 6).map((entry) => entry.id), catalog[0].id],
      catalog,
    ),
  ).toBe('duplicate');
  expect(Object.isFrozen(catalog)).toBe(true);
  expect(Object.isFrozen(catalog[0].parameters)).toBe(true);
  expect(Object.isFrozen(catalog[0].acquisition.proposedSources)).toBe(true);
});

test('new definitions are approved but acquisition remains closed and client definitions cannot be injected', () => {
  expect(getApprovedArenaCards()).toHaveLength(33);
  for (const entry of getArenaCardCatalog()) {
    const contentCard = ARENA_CONTENT_040_CARDS.some(
      (card) => card.id === entry.id,
    );
    if (contentCard)
      expect(resolveApprovedArenaCard(entry.id)).toMatchObject({
        id: entry.id,
      });
    else expect(resolveApprovedArenaCard(entry.id)).toBeNull();
    expect(
      resolveApprovedArenaCard({
        ...entry,
        homologation: { status: 'approved' },
        action: 'attack',
        parameters: { damage: 99999 },
      }),
    ).toBeNull();
    expect(entry).toMatchObject({
      biblicalReference: null,
      usesPerBattle: 1,
      remainsOwnedAfterBattle: true,
    });
    if (contentCard) {
      expect(entry).toMatchObject({
        homologation: {
          status: 'approved',
          approvalReference: 'CONTENT-040A:OWNER:2026-11-09',
        },
        acquisition: {
          status: 'pending-server-contract',
          authorizedSources: [],
          approvalReference: null,
        },
        art: {
          approved: true,
          reference: expect.stringContaining(
            '/assets/cards/arena/content-040/',
          ),
        },
      });
    }
    expect(entry.catalogVersion).toBe(
      ARENA_CONTENT_040_CARDS.some((card) => card.id === entry.id)
        ? 'arena-cards-2026-11-09.1-content-040a'
        : ARENA_CARD_CATALOG_VERSION,
    );
    expect(ARENA_CARD_RARITIES).toContain(entry.rarity);
    expect(Object.values(entry.parameters).every(Number.isFinite)).toBe(true);
  }
  for (const invalid of [
    null,
    {},
    '',
    'fixture-card-1',
    'arena-card-unknown',
    'special:path-strike',
  ]) {
    expect(findArenaCardDefinition(invalid)).toBeNull();
    expect(describeCatalogCard(invalid)).toBeNull();
    expect(resolveApprovedArenaCard(invalid)).toBeNull();
  }
});

test('readiness reports the real shortage and level-one limitation without promising a starter grant', () => {
  expect(getArenaCardReadiness()).toMatchObject({
    requiredDeckSize: 7,
    proposedCards: 40,
    distinctExistingEffects: 7,
    missingDistinctEffects: 0,
    approvedCards: 33,
    proposedUsableAtLevel: 6,
    collectionAvailable: false,
    starterAvailable: false,
    authoritativeAcquisitionAvailable: false,
  });
  expect(getArenaCardReadiness(8).proposedUsableAtLevel).toBeGreaterThan(6);
  expect(getArenaCardReadiness().blockers).not.toContain(
    'seventh-effect-pending',
  );
  for (const level of [0, -1, 1.2, NaN, Infinity])
    expect(() => getArenaCardReadiness(level)).toThrow(/Nível/);
});

test('objective data and descriptions use the actual engine rules rather than duplicated balance values', () => {
  for (const entry of getArenaCardCatalog()) {
    const expected = describeCatalogCard(entry.id)!;
    expect(entry.description).toEqual(expected);
    expect(entry.minimumLevel).toBe(expected.minimumLevel);
    expect(entry.focusCost).toBe(expected.focusCost);
    expect(describeCatalogCard(entry.id)).toEqual(expected);
  }
  expect(
    findArenaCardDefinition('arena-card-path-strike')?.parameters
      .offensiveMultiplier,
  ).toBe(arenaCombatConfig.strikeMultiplier);
  expect(
    findArenaCardDefinition('arena-card-basic-defense')?.parameters
      .receivedDamageMultiplier,
  ).toBe(battleBalanceConfig.defendDamageMultiplier);
  expect(
    findArenaCardDefinition('arena-card-steadfast-guard')?.parameters
      .receivedDamageMultiplier,
  ).toBe(battleBalanceConfig.fortifiedDefendDamageMultiplier);
  expect(
    findArenaCardDefinition('arena-card-discernment')?.parameters
      .maximumMultiplier,
  ).toBe(battleBalanceConfig.focusMaximumMultiplier);
});

// Proposed definitions are injected as synthetic ownership only in tests.
function syntheticDeck(entry: ArenaCard) {
  const official = getArenaCardCatalog().slice(0, 7);
  const owned = official.some((card) => card.id === entry.id)
    ? official
    : [...official.slice(0, 6), entry];
  return { owned, ids: owned.map((card) => card.id) };
}
const charge = (state: BattleState): BattleState => ({
  ...state,
  player: { ...state.player, focusPoints: arenaCombatConfig.maximumFocus },
});

test.each(getArenaCardCatalog().slice(0, 7))(
  '$name preserves the existing seven-card effect and one-use contract',
  (entry) => {
    const { owned, ids } = syntheticDeck(entry);
    const start = createArenaDeckBattle(
      player,
      opponent,
      42,
      'catalog-fixture',
      ids,
      owned,
    );
    const ready = charge(start);
    const used = resolveArenaCommand(
      ready,
      ready.id,
      ready.round,
      `card:${entry.id}`,
    );
    const expected = resolveArenaRound(
      charge(createArenaBattle(player, opponent, 42, 'catalog-fixture')),
      entry.action,
    );
    if (entry.action !== 'special:measured-strike') {
      expect(used.player).toEqual(expected.player);
      expect(used.opponent).toEqual(expected.opponent);
      expect(used.log).toEqual(expected.log);
    } else {
      // The dedicated measured-strike test covers its canonical server effect;
      // this registry check verifies the deck-owned one-use route.
      expect(used.player.lastSpecial).toBe('measured-strike');
    }
    expect(used.deck?.usedIds).toEqual([entry.id]);
    expect(
      resolveArenaCommand(used, used.id, used.round, `card:${entry.id}`),
    ).toBe(used);
    expect(
      resolveArenaCommand(ready, ready.id, ready.round, 'card:not-owned'),
    ).toBe(ready);
    expect(owned).toHaveLength(7);
    expect(
      createArenaDeckBattle(player, opponent, 43, 'next-battle', ids, owned)
        .deck?.usedIds,
    ).toEqual([]);
  },
);

test.each(ARENA_CONTENT_040_CARDS)(
  '$name uses its approved server rule once and leaves acquisition separate',
  (entry) => {
    const { owned, ids } = syntheticDeck(entry);
    const snapshot = {
      ...player,
      level: Math.max(player.level, entry.minimumLevel),
    };
    const base = createArenaDeckBattle(
      snapshot,
      opponent,
      61,
      entry.id,
      ids,
      owned,
    );
    const lowHp = {
      ...base,
      player: {
        ...base.player,
        hp: Math.max(1, Math.floor(base.player.maxHp * 0.2)),
        focusPoints: 3,
      },
    };
    expect(arenaCardAvailability(lowHp, entry.id).status).toBe('available');
    const next = resolveArenaCommand(
      lowHp,
      lowHp.id,
      lowHp.round,
      `card:${entry.id}`,
    );
    expect(next).not.toBe(lowHp);
    expect(next.deck?.usedIds).toContain(entry.id);
    expect(
      resolveArenaCommand(next, next.id, next.round, `card:${entry.id}`),
    ).toBe(next);
    expect(entry.action).toBe(
      entry.rule.mode === 'attack' ? 'attack' : 'defend',
    );
  },
);

test('new healing cards share the 20 percent / 24 HP battle budget and never force a 1 HP cure', () => {
  const first = ARENA_CONTENT_040_CARDS.find(
    (card) => card.id === 'arena-card-regather-strength',
  )!;
  const second = ARENA_CONTENT_040_CARDS.find(
    (card) => card.id === 'arena-card-renewed-courage',
  )!;
  const { owned, ids } = syntheticDeck(first);
  const start = createArenaDeckBattle(
    { ...player, level: 5 },
    opponent,
    88,
    'healing-budget',
    ids,
    owned,
  );
  const damaged = {
    ...start,
    player: { ...start.player, hp: start.player.maxHp - 5, focusPoints: 3 },
  };
  const healed = resolveArenaCommand(
    damaged,
    damaged.id,
    damaged.round,
    `card:${first.id}`,
  );
  expect(healed.player.healingUsed).toBe(6);
  const noHealDeck = syntheticDeck(second);
  const full = charge(
    createArenaDeckBattle(
      { ...player, level: 5 },
      opponent,
      89,
      'no-heal',
      noHealDeck.ids,
      noHealDeck.owned,
    ),
  );
  expect(arenaCardAvailability(full, second.id).status).toBe('condition');
  expect(
    resolveArenaCommand(full, full.id, full.round, `card:${second.id}`),
  ).toBe(full);
});

test.each(arenaSpecials)(
  '$name keeps its real level/Foco and derives equipment-adjusted descriptions',
  (special) => {
    const entry = getArenaCardCatalog().find(
      (card) => card.action === `special:${special.id}`,
    )!;
    const { owned, ids } = syntheticDeck(entry);
    const base = createArenaDeckBattle(
      player,
      opponent,
      42,
      'level-focus',
      ids,
      owned,
    );
    expect(arenaCardAvailability(base, entry.id)).toMatchObject({
      status: 'focus',
      focusCost: special.focusCost,
    });
    expect(
      resolveArenaCommand(base, base.id, base.round, `card:${entry.id}`),
    ).toBe(base);
    const low = charge(
      createArenaDeckBattle(
        { ...player, level: special.minimumLevel - 1 },
        opponent,
        42,
        'low',
        ids,
        owned,
      ),
    );
    expect(arenaCardAvailability(low, entry.id).status).toBe('level');
    expect(
      resolveArenaCommand(low, low.id, low.round, `card:${entry.id}`),
    ).toBe(low);
    const modified = createArenaDeckBattle(
      { ...player, specialModifiers: { [special.id]: { focusDiscount: 1 } } },
      opponent,
      42,
      'modifier',
      ids,
      owned,
    );
    expect(describeCatalogCard(entry.id, modified.player)?.focusCost).toBe(
      arenaCardAvailability(modified, entry.id).focusCost,
    );
    expect(describeCatalogCard(entry.id, modified.player)).toEqual(
      describeArenaAction(entry.action, modified.player),
    );
  },
);
