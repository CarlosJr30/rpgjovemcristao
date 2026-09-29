import type { EquipmentSlot } from '../../../features/journey/domain/traveler';
import { getSupabaseBrowserClient } from '../client';
import type { EquippedItemRow } from '../database.types';
import { requireSuccess } from './errors';

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
    const result = await getSupabaseBrowserClient()
      .from('equipped_items')
      .upsert(
        { traveler_id: travelerId, slot, item_id: itemId },
        { onConflict: 'traveler_id,slot' },
      );
    requireSuccess(result, 'Não foi possível equipar o item.');
  },

  async unequipItem(travelerId: string, slot: EquipmentSlot): Promise<void> {
    const result = await getSupabaseBrowserClient()
      .from('equipped_items')
      .delete()
      .eq('traveler_id', travelerId)
      .eq('slot', slot);
    requireSuccess(result, 'Não foi possível desequipar o item.');
  },
};
