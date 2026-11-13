import { expect, test } from 'vitest';
import { ECONOMY_041_CHESTS, getArenaCardCatalog } from '@rpg/game-engine';
import { receiptFromOperation } from './receipt';
import { chestRow, TRAVELER } from '../../../../tests/fixtures/chest-reveal';
import { EQUIPMENT_CATALOG } from '../journey/data/equipmentCatalog';
import type { ChestOperationRow } from '../../lib/supabase/database.types';

function row(
  type: keyof typeof ECONOMY_041_CHESTS,
  kind: 'coins' | 'card' | 'equipment',
  quantity = 1,
): ChestOperationRow {
  const policy = ECONOMY_041_CHESTS[type];
  const item =
    kind === 'card'
      ? getArenaCardCatalog().find(
          (c) =>
            c.rarity === policy.rarity &&
            c.catalogVersion === 'arena-cards-2026-11-09.1-content-040a',
        )
      : kind === 'equipment'
        ? EQUIPMENT_CATALOG.find(
            (e) => e.rarity === policy.rarity && e.id.startsWith('equipment-'),
          )
        : null;
  const source = 'economy041:00000000-0000-4000-8000-000000000011';
  return {
    ...chestRow,
    chest_type: type,
    source,
    rewards: {
      catalogVersion: 'economy041-chest-v1',
      chestType: type,
      coins: kind === 'coins' ? policy.coins : 0,
      itemKind: kind,
      itemId: item?.id ?? null,
      itemName: item?.name ?? null,
      cardVersion:
        kind === 'card' ? 'arena-cards-2026-11-09.1-content-040a' : null,
      quantity: kind === 'coins' ? 0 : quantity,
      duplicateItem: kind !== 'coins' && quantity > 1,
      source,
      remainingQuantity: 0,
      duplicate: false,
      sellValue: { comum: 10, incomum: 20, raro: 35, épico: 70, lendário: 120 }[
        policy.rarity
      ],
    },
  };
}
test('five approved chests use the approved prices and category probabilities', () => {
  expect(Object.values(ECONOMY_041_CHESTS).map((v) => v.price)).toEqual([
    40, 80, 150, 250, 400,
  ]);
  for (const p of Object.values(ECONOMY_041_CHESTS))
    expect(p.coinWeight + p.cardWeight + p.equipmentWeight).toBe(100);
  const counts = ['comum', 'incomum', 'raro', 'épico', 'lendário'].map(
    (r) =>
      getArenaCardCatalog().filter(
        (c) =>
          c.rarity === r &&
          c.catalogVersion === 'arena-cards-2026-11-09.1-content-040a',
      ).length,
  );
  expect(counts).toEqual([3, 10, 9, 7, 4]);
});
test.each(
  Object.keys(ECONOMY_041_CHESTS) as (keyof typeof ECONOMY_041_CHESTS)[],
)(
  '%s maps a single confirmed coin/card/equipment result and keeps canonical art/data',
  (type) => {
    for (const kind of ['coins', 'card', 'equipment'] as const) {
      const receipt = receiptFromOperation(row(type, kind), TRAVELER);
      expect(receipt.entries).toHaveLength(1);
      expect(receipt.entries[0].kind).toBe(kind);
      expect(receipt.catalogVersion).toBe('economy041-chest-v1');
      expect(receipt.repeated).toBeUndefined();
    }
    const original = row(type, 'card', 2),
      receipt = receiptFromOperation(original, TRAVELER);
    expect(receipt.repeated).toMatchObject({
      quantity: 2,
      itemId: (original.rewards as Record<string, unknown>).itemId,
    });
    expect(receipt.entries[0]).toMatchObject({
      kind: 'card',
      rarity: ECONOMY_041_CHESTS[type].rarity,
      art: expect.stringMatching(/\.webp$/),
    });
  },
);
test('wrong source, payout, rarity/version and contradictory duplication state never become prizes', () => {
  const original = row('rare', 'card', 2),
    base = original.rewards as Record<string, unknown>;
  for (const change of [
    { coins: 999 },
    { cardVersion: 'fake' },
    { itemKind: 'coins' },
    { quantity: 1 },
    { duplicateItem: false },
    { sellValue: 1 },
  ])
    expect(() =>
      receiptFromOperation(
        {
          ...original,
          rewards: { ...base, ...change } as ChestOperationRow['rewards'],
        },
        TRAVELER,
      ),
    ).toThrow();
  expect(() =>
    receiptFromOperation(
      { ...original, source: 'community001c:old' },
      TRAVELER,
    ),
  ).toThrow();
  expect(() =>
    receiptFromOperation(
      {
        ...row('rare', 'coins'),
        rewards: { ...(row('rare', 'coins').rewards as object), coins: 999 },
      },
      TRAVELER,
    ),
  ).toThrow();
});
