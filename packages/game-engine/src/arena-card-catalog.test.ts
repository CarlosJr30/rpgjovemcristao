import { expect, test } from 'vitest';
import {
  ARENA_CARD_ACTIONS,
  ARENA_CARD_CATALOG_VERSION,
  ARENA_CARD_RARITIES,
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
import { cards, player, opponent } from '../../../tests/fixtures/arena-deck';

test('registry preserves six stable unique identities and distinct implemented effects, with no invented seventh', () => {
  const catalog = getArenaCardCatalog();
  expect(catalog.map((entry) => entry.id)).toEqual([
    'arena-card-basic-attack',
    'arena-card-basic-defense',
    'arena-card-path-strike',
    'arena-card-steadfast-guard',
    'arena-card-discernment',
    'arena-card-pilgrim-step',
  ]);
  expect(new Set(catalog.map((entry) => entry.id)).size).toBe(6);
  expect(catalog.map((entry) => entry.action)).toEqual(ARENA_CARD_ACTIONS);
  expect(catalog).toEqual(getArenaCardCatalog());
  expect(
    validateArenaDeck(
      catalog.map((entry) => entry.id),
      catalog,
    ),
  ).toBe('count');
  expect(
    validateArenaDeck(
      [...catalog.map((entry) => entry.id), catalog[0].id],
      catalog,
    ),
  ).toBe('duplicate');
  expect(Object.isFrozen(catalog)).toBe(true);
  expect(Object.isFrozen(catalog[0].parameters)).toBe(true);
  expect(Object.isFrozen(catalog[0].acquisition.proposedSources)).toBe(true);
});

test('proposed entries and injected definitions are never playable approvals or authorized sources', () => {
  expect(getApprovedArenaCards()).toEqual([]);
  for (const entry of getArenaCardCatalog()) {
    expect(resolveApprovedArenaCard(entry.id)).toBeNull();
    expect(
      resolveApprovedArenaCard({
        ...entry,
        homologation: { status: 'approved' },
        action: 'attack',
        parameters: { damage: 99999 },
      }),
    ).toBeNull();
    expect(entry).toMatchObject({
      homologation: { status: 'proposed', approvalReference: null },
      acquisition: {
        status: 'pending-server-contract',
        authorizedSources: [],
        approvalReference: null,
      },
      art: { approved: false, reference: null },
      biblicalReference: null,
      usesPerBattle: 1,
      remainsOwnedAfterBattle: true,
    });
    expect(entry.catalogVersion).toBe(ARENA_CARD_CATALOG_VERSION);
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
    proposedCards: 6,
    distinctExistingEffects: 6,
    missingDistinctEffects: 1,
    approvedCards: 0,
    proposedUsableAtLevel: 2,
    collectionAvailable: false,
    starterAvailable: false,
    authoritativeAcquisitionAvailable: false,
  });
  expect(getArenaCardReadiness(8).proposedUsableAtLevel).toBe(6);
  for (const level of [0, -1, 1.2, NaN, Infinity])
    expect(() => getArenaCardReadiness(level)).toThrow(/Nível/);
});

test('objective data and descriptions use the actual engine rules rather than duplicated balance values', () => {
  for (const entry of getArenaCardCatalog()) {
    const expected = describeArenaAction(entry.action);
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

// A synthetic seventh slot exercises the existing seven-card engine contract.
// It is never a seventh official proposal, a grant or part of the runtime catalog.
function syntheticDeck(entry: ArenaCard) {
  const owned: readonly ArenaCard[] = [entry, ...cards.slice(0, 6)];
  return { owned, ids: owned.map((card) => card.id) };
}
const charge = (state: BattleState): BattleState => ({
  ...state,
  player: { ...state.player, focusPoints: arenaCombatConfig.maximumFocus },
});

test.each(getArenaCardCatalog())(
  '$name executes the existing effect exactly and consumes only the accepted card',
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
    expect(used.player).toEqual(expected.player);
    expect(used.opponent).toEqual(expected.opponent);
    expect(used.log).toEqual(expected.log);
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
