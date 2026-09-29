import { getSupabaseBrowserClient } from '../client';
import type { InventoryRow, Json } from '../database.types';
import { requireSuccess } from './errors';

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
    const current = await this.getInventory(travelerId);
    const owned = current.find((item) => item.item_id === itemId);
    await this.setQuantity(
      travelerId,
      itemId,
      (owned?.quantity ?? 0) + quantity,
      metadata,
    );
  },

  async removeItem(travelerId: string, itemId: string): Promise<void> {
    const result = await getSupabaseBrowserClient()
      .from('inventory')
      .delete()
      .eq('traveler_id', travelerId)
      .eq('item_id', itemId);
    requireSuccess(result, 'Não foi possível remover o item.');
  },

  async setQuantity(
    travelerId: string,
    itemId: string,
    quantity: number,
    metadata: Json | null = null,
  ): Promise<void> {
    if (!Number.isSafeInteger(quantity) || quantity < 0)
      throw new Error('Quantidade de item inválida.');
    if (quantity === 0) return this.removeItem(travelerId, itemId);
    const result = await getSupabaseBrowserClient()
      .from('inventory')
      .upsert(
        { traveler_id: travelerId, item_id: itemId, quantity, metadata },
        { onConflict: 'traveler_id,item_id' },
      );
    requireSuccess(result, 'Não foi possível salvar o item.');
  },
};
