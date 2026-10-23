import type { AttributeValues } from '../../../features/journey/domain/traveler';
import { getSupabaseBrowserClient } from '../client';
import type { TravelerStatsRow } from '../database.types';
import { ECONOMY_TRANSITION_NOTICE } from '../../authority/legacy-cutover';

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
    void travelerId;
    void stats;
    throw new Error(ECONOMY_TRANSITION_NOTICE);
  },
};
