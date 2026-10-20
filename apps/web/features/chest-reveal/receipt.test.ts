import { expect, test } from 'vitest';
import {
  chestRow,
  receipt,
  TRAVELER,
} from '../../../../tests/fixtures/chest-reveal';
import { receiptFromOperation, rarityLabel, chestRarity } from './receipt';
import type { ChestOperationRow } from '../../lib/supabase/database.types';
test('legacy confirmed ledger maps only granted coins then catalog equipment, without quantity guesses', () => {
  expect(receipt.entries.map((p) => p.kind)).toEqual(['coins', 'equipment']);
  expect(receipt.entries[1]).toMatchObject({
    item: { id: 'traveler-armor-uncommon', stats: { life: 1, defense: 1 } },
    rarity: 'incomum',
  });
  expect(JSON.stringify(receipt)).not.toMatch(/duplicate|quantity/);
  expect(
    receiptFromOperation(
      {
        ...chestRow,
        rewards: {
          ...(chestRow.rewards as object),
          itemName: 'client-supplied',
        },
      },
      TRAVELER,
    ),
  ).toEqual(receipt);
});
test('foreign, pending, unknown, malformed or extended reward schemas do not become confirmed prizes', () => {
  const variants: Partial<ChestOperationRow>[] = [
    { traveler_id: 'other' },
    { operation_type: 'purchase' },
    { id: 'fake' },
    { operation_key: 'grant:fake' },
    { rewards: null },
    { rewards: { ...(chestRow.rewards as object), coins: -1 } },
    { rewards: { ...(chestRow.rewards as object), coins: 1.5 } },
    { rewards: { ...(chestRow.rewards as object), itemId: 'fake-card' } },
    { rewards: { ...(chestRow.rewards as object), cards: ['fake'] } },
    { rewards: { ...(chestRow.rewards as object), chestType: 'mythic' } },
  ];
  for (const v of variants)
    expect(() => receiptFromOperation({ ...chestRow, ...v }, TRAVELER)).toThrow(
      /pendente/,
    );
});
test('only existing five rarity identities; extraordinary is presentation alias of legendary equipment', () => {
  expect(Object.keys(chestRarity)).toEqual([
    'common',
    'uncommon',
    'rare',
    'epic',
    'extraordinary',
  ]);
  expect(Object.values(chestRarity).map(rarityLabel)).toEqual([
    'Comum',
    'Incomum',
    'Raro',
    'Épico',
    'Extraordinário',
  ]);
});
