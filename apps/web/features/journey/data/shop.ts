import type { Traveler } from '../domain/traveler';
import { SHOP_OFFERS } from './equipmentCatalog';

export type PurchaseResult =
  | { status: 'purchased'; traveler: Traveler }
  | { status: 'insufficient' | 'owned' | 'unavailable' };

export function purchaseFromShop(traveler: Traveler, equipmentId: string): PurchaseResult {
  const offer = SHOP_OFFERS.find((entry) => entry.equipment.id === equipmentId);
  if (!offer) return { status: 'unavailable' };
  if (traveler.inventory.some((item) => item.id === equipmentId)) return { status: 'owned' };
  if (traveler.coins < offer.price) return { status: 'insufficient' };
  return {
    status: 'purchased',
    traveler: {
      ...traveler,
      coins: traveler.coins - offer.price,
      inventory: [...traveler.inventory, { ...offer.equipment, isNew: true }],
    },
  };
}
