import type { EquipmentSlot } from '../../../features/journey/domain/traveler';
import { getSupabaseBrowserClient } from '../client';
import type { EquippedItemRow } from '../database.types';
import { isShopTestPreview, isShopRelease } from '../../release-scope';
import { equipmentOperationError } from '../equipment-access';

export const equipmentRepository = {
  async getEquippedItems(travelerId: string): Promise<EquippedItemRow[]> {
    const result = await getSupabaseBrowserClient()
      .from('equipped_items')
      .select('*')
      .eq('traveler_id', travelerId);
    if (result.error)
      throw new Error('Não foi possível carregar os equipamentos.');
    return result.data;
  },

  async equipItem(
    travelerId: string,
    slot: EquipmentSlot,
    itemId: string,
    expectedItemId: string | null,
  ): Promise<void> {
    await setOwnedEquipment(travelerId, slot, itemId, expectedItemId);
  },
  async unequipItem(
    travelerId: string,
    slot: EquipmentSlot,
    expectedItemId: string | null,
  ): Promise<void> {
    await setOwnedEquipment(travelerId, slot, null, expectedItemId);
  },
};

async function setOwnedEquipment(
  travelerId: string,
  slot: EquipmentSlot,
  itemId: string | null,
  expectedItemId: string | null,
) {
  if (isShopTestPreview() || isShopRelease()) {
    const { error } = await getSupabaseBrowserClient().rpc(
      isShopRelease() ? 'equip_shop_item' : 'equip_qa_shop',
      {
        p_actor: travelerId,
        p_slot: slot,
        p_item_id: itemId,
        p_expected_item_id: expectedItemId,
      },
    );
    if (error) throw Error(equipmentOperationError(error));
    return;
  }
  const { error } = await getSupabaseBrowserClient().rpc(
    'set_owned_equipment',
    {
      p_traveler_id: travelerId,
      p_slot: slot,
      p_item_id: itemId,
      p_expected_item_id: expectedItemId,
    },
  );
  if (error) throw new Error(equipmentOperationError(error));
}
