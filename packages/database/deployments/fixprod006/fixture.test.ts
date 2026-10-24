import { expect, it } from 'vitest';
import { offlinePostgres } from '../../../../tests/fixtures/offline-authority-postgres';

it.each([-1, 0x100000000, 1.5, NaN, Infinity])(
  'rejects unsafe offline seed %s before starting any process',
  (authoritySeed) => {
    expect(() => offlinePostgres({ authoritySeed })).toThrow(/uint32/);
  },
);
