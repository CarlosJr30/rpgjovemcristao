import type { Traveler } from '../../../features/journey/domain/traveler';
import { getSupabaseBrowserClient } from '../client';
import type { TravelerRow } from '../database.types';
import { OnlinePersistenceError, requireSuccess } from './errors';

const travelerUpdate = (traveler: Traveler) => ({
  name: traveler.name,
  body_type: traveler.avatar.gender,
  skin_tone: traveler.appearance.skin,
  hair_style: traveler.appearance.hair,
  hair_color: traveler.avatar.hairColor,
  avatar_variant: traveler.appearance.outfit,
  level: traveler.level,
  xp: traveler.xp,
  journey_progress: traveler.progress,
});

export const travelerRepository = {
  async createTraveler(traveler: Traveler): Promise<string> {
    const payload = {
      p_id: traveler.id,
      p_name: traveler.name,
      p_body_type: traveler.avatar.gender,
      p_skin_tone: traveler.appearance.skin,
      p_hair_style: traveler.appearance.hair,
      p_hair_color: traveler.avatar.hairColor,
      p_avatar_variant: traveler.appearance.outfit,
    };
    if (process.env.NODE_ENV === 'development') {
      console.info('[CREATE TRAVELER] rpc start');
      console.info('[CREATE TRAVELER] payload:', payload);
    }
    const result = await getSupabaseBrowserClient().rpc(
      'create_traveler',
      payload,
    );
    if (process.env.NODE_ENV === 'development') {
      console.info('[CREATE TRAVELER] response data:', result.data);
      if (result.error) {
        console.error('[CREATE TRAVELER] response error:', {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          status:
            'status' in result.error ? result.error.status : 'unavailable',
        });
      }
    }
    if (result.error) {
      const status =
        'status' in result.error ? String(result.error.status) : 'unavailable';
      throw new OnlinePersistenceError(
        'Não foi possível criar o Viajante online.',
        `RPC create_traveler: code=${result.error.code}; message=${result.error.message}; details=${result.error.details}; hint=${result.error.hint}; status=${status}`,
      );
    }
    if (result.data === null)
      throw new OnlinePersistenceError(
        'Não foi possível criar o Viajante online.',
        'RPC create_traveler retornou data=null sem erro.',
      );
    return result.data;
  },

  async getTravelersByUser(userId: string): Promise<TravelerRow[]> {
    const result = await getSupabaseBrowserClient()
      .from('travelers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');
    if (result.error)
      throw new Error('Não foi possível carregar seus Viajantes.');
    return result.data;
  },

  async getTravelerById(
    id: string,
    userId: string,
  ): Promise<TravelerRow | null> {
    const result = await getSupabaseBrowserClient()
      .from('travelers')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (result.error)
      throw new Error('Não foi possível carregar seu Viajante.');
    return result.data;
  },

  async updateTraveler(
    id: string,
    userId: string,
    traveler: Traveler,
  ): Promise<void> {
    const result = await getSupabaseBrowserClient()
      .from('travelers')
      .update(travelerUpdate(traveler))
      .eq('id', id)
      .eq('user_id', userId);
    requireSuccess(result, 'Não foi possível salvar o Viajante.');
  },

  async deleteTraveler(id: string, userId: string): Promise<void> {
    const result = await getSupabaseBrowserClient()
      .from('travelers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    requireSuccess(result, 'Não foi possível remover o Viajante.');
  },

  async setActiveTraveler(id: string): Promise<void> {
    const result = await getSupabaseBrowserClient().rpc('set_active_traveler', {
      p_traveler_id: id,
    });
    requireSuccess(result, 'Não foi possível selecionar o Viajante.');
  },
};
