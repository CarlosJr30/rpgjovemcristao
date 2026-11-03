import { expect, it } from 'vitest';
import { parseChestGrant } from './client';
const id = '00000000-0000-4000-8000-000000000700';
it('requires an official receipt identity and approved tier before announcing acquisition', () => {
  for (const v of [
    null,
    {},
    { version: 1, status: 'awarded' },
    {
      version: 1,
      status: 'awarded',
      receiptId: id,
      travelerId: id,
      eventId: id,
      chestType: 'rare',
    },
    { version: 1, status: 'client-won' },
  ])
    expect(() => parseChestGrant(v)).toThrow();
  expect(
    parseChestGrant({
      version: 1,
      status: 'awarded',
      receiptId: id,
      travelerId: id,
      eventId: id,
      chestType: 'common',
    }).status,
  ).toBe('awarded');
});
it('quota suspension and legacy outcomes never fabricate a receipt', () => {
  for (const status of [
    'weekly-limit',
    'monthly-limit',
    'leader-monthly-limit',
    'suspended',
    'legacy-reconciliation-required',
  ])
    expect(parseChestGrant({ version: 1, status }).receiptId).toBeUndefined();
});
