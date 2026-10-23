import type { ChestOperationRow } from '../../apps/web/lib/supabase/database.types';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../apps/web/features/journey/domain/traveler';
import { EQUIPMENT_CATALOG } from '../../apps/web/features/journey/data/equipmentCatalog';
import {
  receiptFromOperation,
  type RevealReceipt,
} from '../../apps/web/features/chest-reveal/receipt';
export const OWNER = '12345678-1234-4321-8234-123456789abc';
export const TRAVELER = '22345678-1234-4321-8234-123456789abc';
export const OPERATION = '32345678-1234-4321-8234-123456789abc';
export const RECEIPT = '42345678-1234-4321-8234-123456789abc';
export const chestRow: ChestOperationRow = {
  id: RECEIPT,
  traveler_id: TRAVELER,
  operation_key: `open:${OPERATION}`,
  operation_type: 'open',
  chest_type: 'uncommon',
  source: 'mission',
  price_paid: null,
  created_at: '2026-10-20T10:00:00Z',
  rewards: {
    chestType: 'uncommon',
    coins: 20,
    itemId: 'traveler-armor-uncommon',
    itemName: 'Couraça do Viajante',
    source: 'mission',
    remainingQuantity: 0,
    duplicate: false,
  },
};
export const receipt = receiptFromOperation(chestRow, TRAVELER);
export const fixtureTraveler = () => ({
  ...createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    TRAVELER,
    '2026-10-20T10:00:00Z',
  ),
  inventory: [...EQUIPMENT_CATALOG],
});
export const cardReceipt: RevealReceipt = {
  ...receipt,
  entries: [
    {
      kind: 'card',
      rarity: 'raro',
      art: null,
      card: {
        id: 'fixture-reveal-card',
        name: 'Carta sintética de revelação',
        rarity: 'raro',
        type: 'OFFENSIVE',
        action: 'special:path-strike',
      },
    },
    receipt.entries[1],
    receipt.entries[0],
  ],
};
