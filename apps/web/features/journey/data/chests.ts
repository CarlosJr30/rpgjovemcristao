import {
  chestCatalog,
  selectChestReward,
  type ChestReward,
  type ChestType,
} from '@rpg/game-engine';
import type { Equipment, Traveler } from '../domain/traveler';
import { EQUIPMENT_CATALOG } from './equipmentCatalog';
import { equipmentAssetForItem } from './equipmentAssets';

export { chestCatalog, type ChestType, type ChestReward };

const rarityLabels: Readonly<Record<Equipment['rarity'], string>> = {
  comum: 'Comum',
  incomum: 'Incomum',
  raro: 'Raro',
  épico: 'Épico',
  lendário: 'Extraordinário',
};

export type ChestEquipmentReward = Readonly<{
  id: string;
  name: string;
  rarity: Equipment['rarity'];
  rarityLabel: string;
  iconAsset: string;
  quantity: number;
  duplicate: boolean;
}>;

export function resolveChestEquipmentReward(
  reward: ChestReward,
  inventoryBeforeOpening: readonly Equipment[],
): ChestEquipmentReward | null {
  if (!reward.itemId) return null;
  const definition = EQUIPMENT_CATALOG.find((item) => item.id === reward.itemId);
  if (!definition) return null;
  const owned = inventoryBeforeOpening.find((item) => item.id === definition.id);
  const previousQuantity = owned?.quantity ?? (owned ? 1 : 0);
  return {
    id: definition.id,
    name: definition.name,
    rarity: definition.rarity,
    rarityLabel: rarityLabels[definition.rarity],
    iconAsset: equipmentAssetForItem(definition),
    quantity: previousQuantity + 1,
    duplicate: previousQuantity > 0,
  };
}

const rememberOperation = (traveler: Traveler, operationId: string) =>
  [
    ...traveler.chestOperationIds.filter((id) => id !== operationId),
    operationId,
  ].slice(-200);

export function grantChest(
  traveler: Traveler,
  type: ChestType,
  source: string,
  operationId: string,
): Traveler {
  if (traveler.chestOperationIds.includes(operationId)) return traveler;
  return {
    ...traveler,
    chests: { ...traveler.chests, [type]: traveler.chests[type] + 1 },
    chestSources: {
      ...traveler.chestSources,
      [type]: [...traveler.chestSources[type], source.slice(0, 120)],
    },
    chestOperationIds: rememberOperation(traveler, operationId),
  };
}

export type LocalChestPurchase =
  | { status: 'purchased'; traveler: Traveler }
  | { status: 'duplicate'; traveler: Traveler }
  | { status: 'unavailable' | 'level-required' | 'insufficient' };

export function purchaseChestLocal(
  traveler: Traveler,
  type: ChestType,
  operationId: string,
): LocalChestPurchase {
  if (traveler.chestOperationIds.includes(operationId))
    return { status: 'duplicate', traveler };
  const definition = chestCatalog[type];
  if (definition.price === null) return { status: 'unavailable' };
  if (traveler.level < definition.minimumLevel)
    return { status: 'level-required' };
  if (traveler.coins < definition.price) return { status: 'insufficient' };
  const granted = grantChest(traveler, type, 'shop', operationId);
  return {
    status: 'purchased',
    traveler: { ...granted, coins: granted.coins - definition.price },
  };
}

export type LocalChestOpening =
  | { status: 'opened' | 'duplicate'; traveler: Traveler; reward: ChestReward }
  | { status: 'empty' };

export function openChestLocal(
  traveler: Traveler,
  type: ChestType,
  operationId: string,
  roll: number,
  openedAt: string,
): LocalChestOpening {
  const previous = traveler.chestHistory.find(
    (entry) => entry.operationId === operationId,
  );
  if (previous)
    return { status: 'duplicate', traveler, reward: previous.reward };
  if (traveler.chests[type] < 1) return { status: 'empty' };
  const reward = selectChestReward(type, roll);
  const source = traveler.chestSources[type][0] ?? 'unknown';
  let inventory = traveler.inventory;
  if (reward.itemId) {
    const catalogItem = EQUIPMENT_CATALOG.find(
      (item) => item.id === reward.itemId,
    );
    if (catalogItem) {
      const owned = inventory.find((item) => item.id === catalogItem.id);
      inventory = owned
        ? inventory.map((item) =>
            item.id === catalogItem.id
              ? { ...item, quantity: (item.quantity ?? 1) + 1, isNew: true }
              : item,
          )
        : [
            ...inventory,
            { ...catalogItem, quantity: 1, isNew: true } satisfies Equipment,
          ];
    }
  }
  return {
    status: 'opened',
    reward,
    traveler: {
      ...traveler,
      coins: traveler.coins + reward.coins,
      inventory,
      chests: { ...traveler.chests, [type]: traveler.chests[type] - 1 },
      chestSources: {
        ...traveler.chestSources,
        [type]: traveler.chestSources[type].slice(1),
      },
      chestOperationIds: rememberOperation(traveler, operationId),
      chestHistory: [
        ...traveler.chestHistory,
        { operationId, chestType: type, source, reward, openedAt },
      ].slice(-100),
    },
  };
}
