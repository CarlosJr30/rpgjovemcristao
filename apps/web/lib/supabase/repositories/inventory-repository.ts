import { getSupabaseBrowserClient } from '../client';
import type { InventoryRow, Json } from '../database.types';
import { ECONOMY_TRANSITION_NOTICE } from '../../authority/legacy-cutover';

export const inventoryRepository = {
  async getInventory(travelerId: string): Promise<InventoryRow[]> {
    const result = await getSupabaseBrowserClient()
      .from('inventory')
      .select('*')
      .eq('traveler_id', travelerId)
      .order('acquired_at');
    if (result.error) throw new Error('Não foi possível carregar a mochila.');
    return result.data;
  },

  async addItem(
    travelerId: string,
    itemId: string,
    quantity = 1,
    metadata: Json | null = null,
  ): Promise<void> {
    void travelerId;
    void itemId;
    void quantity;
    void metadata;
    throw new Error(ECONOMY_TRANSITION_NOTICE);
  },
  async removeItem(travelerId: string, itemId: string): Promise<void> {
    void travelerId;
    void itemId;
    throw new Error(ECONOMY_TRANSITION_NOTICE);
  },
  async setQuantity(
    travelerId: string,
    itemId: string,
    quantity: number,
    metadata: Json | null = null,
  ): Promise<void> {
    void travelerId;
    void itemId;
    void quantity;
    void metadata;
    throw new Error(ECONOMY_TRANSITION_NOTICE);
  },
};
