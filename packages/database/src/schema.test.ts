import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, test } from 'vitest';
import {
  equippedItems,
  inventory,
  profiles,
  travelerStats,
  travelers,
  wallets,
} from './schema';

const tables = [
  profiles,
  travelers,
  travelerStats,
  wallets,
  inventory,
  equippedItems,
];

describe('initial Supabase gameplay schema', () => {
  test('enables RLS and declares explicit policies on every table', () => {
    for (const table of tables) {
      const config = getTableConfig(table);
      expect(config.enableRLS).toBe(true);
      expect(config.policies.length).toBeGreaterThan(0);
    }
  });

  test('enforces ownership and domain constraints in the schema', () => {
    const travelerConfig = getTableConfig(travelers);
    const inventoryConfig = getTableConfig(inventory);
    const equippedConfig = getTableConfig(equippedItems);

    expect(travelerConfig.indexes.map((entry) => entry.config.name)).toContain(
      'travelers_one_active_per_user_idx',
    );
    expect(
      inventoryConfig.uniqueConstraints.map((entry) => entry.name),
    ).toContain('inventory_traveler_item_unique');
    expect(equippedConfig.primaryKeys).toHaveLength(1);
    expect(equippedConfig.foreignKeys).toHaveLength(2);
  });
});
