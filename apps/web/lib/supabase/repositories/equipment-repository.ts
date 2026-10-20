import type { EquipmentSlot } from '../../../features/journey/domain/traveler';
import { getSupabaseBrowserClient } from '../client';
import type { EquippedItemRow } from '../database.types';
import { ECONOMY_TRANSITION_NOTICE } from '../../authority/legacy-cutover';

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
  ): Promise<void> {
    void travelerId;
    void slot;
    void itemId;
    throw new Error(ECONOMY_TRANSITION_NOTICE);
  },
  async unequipItem(travelerId: string, slot: EquipmentSlot): Promise<void> {
    void travelerId;
    void slot;
    throw new Error(ECONOMY_TRANSITION_NOTICE);
  },
};
