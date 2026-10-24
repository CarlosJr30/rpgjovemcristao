import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import {
  getArenaCardCatalog,
  ARENA_CARD_BALANCE_VERSION,
  ARENA_CARD_CATALOG_VERSION,
} from '@rpg/game-engine';
const review = JSON.parse(
  readFileSync(
    'packages/database/deployments/fixprod003/test-catalog.json',
    'utf8',
  ),
);
it('freezes exactly seven existing cards without changing effects, level, Focus, rarity or numerical parameters', () => {
  const source = getArenaCardCatalog();
  expect(review.definitions).toHaveLength(7);
  expect(
    new Set(review.definitions.map((c: { id: string }) => c.id)).size,
  ).toBe(7);
  expect(
    new Set(review.definitions.map((c: { action: string }) => c.action)).size,
  ).toBe(7);
  for (let i = 0; i < 7; i++) {
    const c = review.definitions[i];
    expect({
      ...c,
      catalogVersion: source[i].catalogVersion,
      homologation: source[i].homologation,
      acquisition: source[i].acquisition,
    }).toEqual(source[i]);
    expect(c.usesPerBattle).toBe(1);
    expect(c.remainsOwnedAfterBattle).toBe(true);
    expect(c.acquisition.authorizedSources).toEqual(['starter']);
  }
  expect(review.sourceVersion).toBe(ARENA_CARD_CATALOG_VERSION);
  expect(review.balanceVersion).toBe(ARENA_CARD_BALANCE_VERSION);
  expect(
    createHash('sha256')
      .update(JSON.stringify(review.definitions))
      .digest('hex'),
  ).toBe(review.definitionsSha256);
});
it('limits the approval to the isolated test project, retaining three level-one cards and future level gates', () => {
  expect(review.project).toBe('wkdvdzfkbwvhyjmamrsg');
  expect(review.productionApproval).toBe(false);
  expect(
    review.definitions.filter(
      (c: { minimumLevel: number }) => c.minimumLevel === 1,
    ),
  ).toHaveLength(3);
  expect(
    review.definitions.find(
      (c: { action: string }) => c.action === 'special:measured-strike',
    ),
  ).toMatchObject({
    minimumLevel: 1,
    focusCost: 1,
    usesPerBattle: 1,
    parameters: { offensiveMultiplier: 1.15, gainedFocus: 0 },
  });
});
it('keeps the reviewed equipment behavior unchanged when promoted from proposal to migration', () => {
  const normalize = (p: string) =>
    readFileSync(p, 'utf8').replaceAll('\r\n', '\n');
  expect(
    normalize(
      'supabase/migrations/20261024001624_fix_prod_003_owned_equipment.sql',
    ),
  ).toBe(normalize('packages/database/proposals/fix-prod-002-equipment.sql'));
});
