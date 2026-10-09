import { describe, expect, test } from 'vitest';
import { chestCatalog, guildTierChest, selectChestReward } from './index';

describe('chest economy', () => {
  test('centralizes five tiers and prevents direct purchase of top tiers', () => {
    expect(Object.keys(chestCatalog)).toEqual([
      'common',
      'uncommon',
      'rare',
      'epic',
      'extraordinary',
    ]);
    expect(chestCatalog.common.price).toBe(40);
    expect(chestCatalog.rare.minimumLevel).toBe(3);
    expect(chestCatalog.epic.price).toBeNull();
    expect(chestCatalog.extraordinary.price).toBeNull();
  });

  test('selects deterministic rewards from an injected roll', () => {
    expect(selectChestReward('common', 0)).toEqual({
      coins: 25,
      itemId: null,
      itemName: null,
    });
    expect(selectChestReward('common', 0.99)).toMatchObject({
      itemId: 'traveler-sword-common',
    });
    expect(() => selectChestReward('rare', 1)).toThrow();
  });

  test('maps guild tiers without granting the best purchasable infinitely', () => {
    expect(guildTierChest).toEqual({
      normal: 'common',
      great: 'uncommon',
      epic: 'rare',
      extraordinary: 'epic',
    });
  });
});
