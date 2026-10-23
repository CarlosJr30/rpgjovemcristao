import type { EquipmentSlot } from '../../../features/journey/domain/traveler';
import { getSupabaseBrowserClient } from '../client';
import type { EquippedItemRow } from '../database.types';

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
  const { error } = await getSupabaseBrowserClient().rpc(
    'set_owned_equipment',
    {
      p_traveler_id: travelerId,
      p_slot: slot,
      p_item_id: itemId,
      p_expected_item_id: expectedItemId,
    },
  );
  if (error)
    throw new Error(
      error.code === '40001'
        ? 'O equipamento mudou em outra aba ou há um combate ativo. Atualize e tente novamente.'
        : 'Não foi possível confirmar o equipamento no servidor. Seus itens foram preservados.',
    );
}
