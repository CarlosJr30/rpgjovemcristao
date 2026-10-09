import { getSupabaseBrowserClient } from '../client';
import type { GuildActivityRow, GuildAdminMissionStats, GuildMissionRow } from '../database.types';
import { requireData } from './errors';

export const guildAdminRepository = {
  async publicMemberProfile(requesterTravelerId: string, memberTravelerId: string): Promise<{ level: number; completed_missions: number }> {
    const data = requireData(await getSupabaseBrowserClient().rpc('guild_public_member_profile', {
      p_requester_traveler_id: requesterTravelerId, p_member_traveler_id: memberTravelerId,
    }), 'Não foi possível carregar o perfil público.');
    if (!data[0]) throw new Error('Perfil indisponível.');
    return data[0];
  },
  async stats(leaderTravelerId: string): Promise<GuildAdminMissionStats[]> {
    return requireData(await getSupabaseBrowserClient().rpc('guild_admin_stats', {
      p_leader_traveler_id: leaderTravelerId,
    }), 'Não foi possível carregar os contadores.');
  },
  async history(guildId: string, offset = 0, limit = 20): Promise<GuildActivityRow[]> {
    const result = await getSupabaseBrowserClient().from('guild_activity_log').select('*')
      .eq('guild_id', guildId).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (result.error) throw new Error('Não foi possível carregar o histórico.');
    return result.data;
  },
  async oldMissions(guildId: string, offset = 0): Promise<GuildMissionRow[]> {
    const result = await getSupabaseBrowserClient().from('guild_missions').select('*')
      .eq('guild_id', guildId).eq('status', 'closed')
      .order('created_at', { ascending: false }).range(offset, offset + 19);
    if (result.error) throw new Error('Não foi possível carregar missões antigas.');
    return result.data;
  },
  async missions(guildId: string): Promise<GuildMissionRow[]> {
    const result = await getSupabaseBrowserClient().from('guild_missions').select('*')
      .eq('guild_id', guildId).in('status', ['published', 'draft'])
      .order('created_at', { ascending: false });
    if (result.error) throw new Error('Não foi possível carregar as missões.');
    return result.data;
  },
  async byIds(guildId: string, ids: string[]): Promise<GuildMissionRow[]> {
    if (!ids.length) return [];
    const result = await getSupabaseBrowserClient().from('guild_missions').select('*')
      .eq('guild_id', guildId).in('id', ids);
    if (result.error) throw new Error('Não foi possível carregar aprovações antigas.');
    return result.data;
  },
};
