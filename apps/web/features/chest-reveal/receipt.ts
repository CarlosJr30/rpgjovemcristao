import type { ArenaCard } from '@rpg/game-engine';
import type { ChestOperationRow } from '../../lib/supabase/database.types';
import { chestCatalog, type ChestType } from '../journey/data/chests';
import { EQUIPMENT_CATALOG } from '../journey/data/equipmentCatalog';
import { RARITY_PRESENTATION } from '../journey/data/equipmentCinematic';
import type { Equipment } from '../journey/domain/traveler';

export type RevealRarity = Equipment['rarity'];
export type RevealPrize =
  | { kind: 'coins'; amount: number; rarity: RevealRarity }
  | { kind: 'equipment'; item: Equipment; rarity: RevealRarity }
  // Presentation contract only. The production adapter cannot produce a card.
  | { kind: 'card'; card: ArenaCard; rarity: RevealRarity; art: string | null };
export type RevealReceipt = Readonly<{
  id: string;
  operationKey: string;
  travelerId: string;
  chestType: ChestType;
  entries: readonly RevealPrize[];
}>;
export const uuid = (s: unknown): s is string =>
  typeof s === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
export const isChestType = (s: unknown): s is ChestType =>
  typeof s === 'string' && Object.hasOwn(chestCatalog, s);
export const chestRarity: Record<ChestType, RevealRarity> = {
  common: 'comum',
  uncommon: 'incomum',
  rare: 'raro',
  epic: 'épico',
  extraordinary: 'lendário',
};
export function prizeName(prize: RevealPrize) {
  return prize.kind === 'coins'
    ? `${prize.amount} Moedas do Viajante`
    : prize.kind === 'card'
      ? prize.card.name
      : prize.item.name;
}
export const rarityLabel = (rarity: RevealRarity) =>
  RARITY_PRESENTATION[rarity].label;

/** Only call with rows fetched through the existing authenticated repository.
 * Shape validation is not authentication, a signature or proof from storage. */
export function receiptFromOperation(
  row: ChestOperationRow,
  travelerId: string,
): RevealReceipt {
  const fail = () =>
    new Error(
      'Abertura pendente de confirmação: registro de recompensa incompatível.',
    );
  if (
    !row ||
    !uuid(row.id) ||
    row.traveler_id !== travelerId ||
    row.operation_type !== 'open' ||
    !/^open:[0-9a-f-]{36}$/i.test(row.operation_key) ||
    !uuid(row.operation_key.slice(5)) ||
    !isChestType(row.chest_type)
  )
    throw fail();
  const v = row.rewards;
  if (
    !v ||
    typeof v !== 'object' ||
    Array.isArray(v) ||
    v.chestType !== row.chest_type ||
    !Number.isSafeInteger(v.coins) ||
    Number(v.coins) < 0 ||
    (v.itemId !== null && typeof v.itemId !== 'string') ||
    !Number.isSafeInteger(v.remainingQuantity) ||
    Number(v.remainingQuantity) < 0 ||
    v.source !== row.source ||
    typeof v.duplicate !== 'boolean' ||
    Object.keys(v).some(
      (key) =>
        ![
          'chestType',
          'coins',
          'itemId',
          'itemName',
          'source',
          'remainingQuantity',
          'duplicate',
        ].includes(key),
    )
  )
    throw fail();
  const entries: RevealPrize[] = [];
  // Legacy receipt is an object, not an ordered array: preserve its defined
  // coins -> equipment presentation order. Never roll or infer extra rewards.
  if (Number(v.coins) > 0)
    entries.push({
      kind: 'coins',
      amount: Number(v.coins),
      rarity: chestRarity[row.chest_type],
    });
  if (v.itemId !== null) {
    const item = EQUIPMENT_CATALOG.find((e) => e.id === v.itemId);
    if (!item) throw fail();
    entries.push({ kind: 'equipment', item, rarity: item.rarity });
  }
  if (!entries.length) throw fail();
  return {
    id: row.id,
    operationKey: row.operation_key,
    travelerId,
    chestType: row.chest_type,
    entries,
  };
}
