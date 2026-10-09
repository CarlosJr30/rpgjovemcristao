import { describe, expect, test } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
import {
  grantChest,
  openChestLocal,
  purchaseChestLocal,
  resolveChestEquipmentReward,
} from './data/chests';

const traveler = () =>
  createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    '12345678-1234-4321-8234-123456789abc',
    '2026-09-29T12:00:00.000Z',
  );

describe('local chest lifecycle', () => {
  test('grant is idempotent and keeps source with the owned chest', () => {
    const first = grantChest(
      traveler(),
      'rare',
      'mission:garden',
      'grant:mission-1',
    );
    const retry = grantChest(
      first,
      'rare',
      'mission:garden',
      'grant:mission-1',
    );
    expect(retry.chests.rare).toBe(1);
    expect(retry.chestSources.rare).toEqual(['mission:garden']);
  });

  test('purchase validates balance, price and level then accumulates quantity', () => {
    const player = { ...traveler(), coins: 200 };
    expect(purchaseChestLocal(player, 'rare', 'buy-low').status).toBe(
      'level-required',
    );
    const first = purchaseChestLocal(player, 'common', 'buy-1');
    expect(first.status).toBe('purchased');
    if (first.status !== 'purchased') return;
    const second = purchaseChestLocal(first.traveler, 'common', 'buy-2');
    expect(second.status).toBe('purchased');
    if (second.status !== 'purchased') return;
    expect(second.traveler.coins).toBe(120);
    expect(second.traveler.chests.common).toBe(2);
    expect(purchaseChestLocal(second.traveler, 'common', 'buy-2').status).toBe(
      'duplicate',
    );
  });

  test('opening consumes one chest, grants coins/item and retry does not duplicate', () => {
    const owned = grantChest(
      grantChest(traveler(), 'common', 'mission', 'grant-1'),
      'common',
      'event',
      'grant-2',
    );
    const opened = openChestLocal(
      owned,
      'common',
      'open-1',
      0.99,
      '2026-09-29T13:00:00.000Z',
    );
    expect(opened.status).toBe('opened');
    if (opened.status !== 'opened') return;
    expect(opened.traveler.chests.common).toBe(1);
    expect(opened.traveler.coins).toBe(10);
    expect(
      opened.traveler.inventory.find(
        (item) => item.id === 'traveler-sword-common',
      ),
    ).toMatchObject({ quantity: 1 });
    const retry = openChestLocal(
      opened.traveler,
      'common',
      'open-1',
      0,
      '2026-09-29T14:00:00.000Z',
    );
    expect(retry.status).toBe('duplicate');
    if (retry.status === 'empty') return;
    expect(retry.traveler.chests.common).toBe(1);
    expect(retry.traveler.coins).toBe(10);
  });

  test('duplicate equipment increments quantity instead of disappearing', () => {
    const first = openChestLocal(
      grantChest(traveler(), 'common', 'mission', 'grant-1'),
      'common',
      'open-1',
      0.99,
      '2026-09-29T13:00:00.000Z',
    );
    if (first.status === 'empty') return;
    const withSecond = grantChest(
      first.traveler,
      'common',
      'mission',
      'grant-2',
    );
    const second = openChestLocal(
      withSecond,
      'common',
      'open-2',
      0.99,
      '2026-09-29T14:00:00.000Z',
    );
    if (second.status === 'empty') return;
    expect(
      second.traveler.inventory.find(
        (item) => item.id === 'traveler-sword-common',
      )?.quantity,
    ).toBe(2);
  });

  test('resolves an equipment reward to its catalog name, rarity and icon', () => {
    const reward = resolveChestEquipmentReward(
      {
        coins: 20,
        itemId: 'traveler-armor-uncommon',
        itemName: 'untrusted server label',
      },
      traveler().inventory,
    );
    expect(reward).toMatchObject({
      id: 'traveler-armor-uncommon',
      name: 'Couraça do Viajante',
      rarityLabel: 'Incomum',
      quantity: 1,
      duplicate: false,
    });
    expect(reward?.iconAsset).toBe(
      '/assets/equipment/armor/traveler_armor_rare_icon.png',
    );
  });

  test('marks an already owned equipment reward as an incremented duplicate', () => {
    const current = traveler();
    const sword = {
      id: 'traveler-sword-common',
      name: 'Espada do Caminho',
      slot: 'weapon' as const,
      rarity: 'comum' as const,
      power: 1,
      stats: { strength: 2 },
      quantity: 2,
    };
    expect(
      resolveChestEquipmentReward(
        {
          coins: 10,
          itemId: sword.id,
          itemName: sword.name,
        },
        [...current.inventory, sword],
      ),
    ).toMatchObject({ quantity: 3, duplicate: true });
  });
});
