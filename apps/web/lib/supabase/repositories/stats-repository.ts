import type { AttributeValues } from '../../../features/journey/domain/traveler';
import { getSupabaseBrowserClient } from '../client';
import type { TravelerStatsRow } from '../database.types';
import { requireSuccess } from './errors';

export const statsRepository = {
  async getTravelerStats(travelerId: string): Promise<TravelerStatsRow | null> {
    const result = await getSupabaseBrowserClient()
      .from('traveler_stats')
      .select('*')
      .eq('traveler_id', travelerId)
      .maybeSingle();
    if (result.error)
      throw new Error('Não foi possível carregar os atributos.');
    return result.data;
  },

  async updateBaseStats(
    travelerId: string,
    stats: AttributeValues,
  ): Promise<void> {
    const result = await getSupabaseBrowserClient()
      .from('traveler_stats')
      .update({
        base_life: stats.life,
        base_strength: stats.strength,
        base_defense: stats.defense,
        base_wisdom: stats.wisdom,
      })
      .eq('traveler_id', travelerId);
    requireSuccess(result, 'Não foi possível salvar os atributos.');
  },
};
