import { describe, expect, test } from 'vitest';
import { guildMissionRewards } from './index';

describe('Guild mission rewards', () => {
  test('defines the four immutable system tiers', () => {
    expect(Object.keys(guildMissionRewards)).toEqual([
      'normal',
      'great',
      'epic',
      'extraordinary',
    ]);
    expect(guildMissionRewards.normal).toEqual({
      xp: 80,
      coins: 25,
      chestType: 'common',
      chestQuantity: 1,
      chestLabel: 'Baú Comum',
    });
    expect(guildMissionRewards.great).toMatchObject({
      xp: 240,
      coins: 100,
      chestType: 'uncommon',
      chestQuantity: 1,
    });
    expect(guildMissionRewards.epic).toMatchObject({
      xp: 480,
      coins: 220,
      chestType: 'rare',
      chestQuantity: 1,
    });
    expect(guildMissionRewards.extraordinary).toEqual({
      xp: 720,
      coins: 360,
      chestType: 'epic',
      chestQuantity: 1,
      chestLabel: 'Baú Épico',
    });
    expect(
      Object.values(guildMissionRewards).some(
        (reward) => reward.chestType === 'extraordinary',
      ),
    ).toBe(false);
    expect(Object.isFrozen(guildMissionRewards)).toBe(true);
    expect(
      Object.values(guildMissionRewards).every((reward) =>
        Object.isFrozen(reward),
      ),
    ).toBe(true);
  });
});
