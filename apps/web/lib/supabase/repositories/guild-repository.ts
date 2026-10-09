import { getSupabaseBrowserClient } from '../client';
import type {
  GuildJoinRequestRow,
  GuildJoinRequestSummary,
  GuildMemberRow,
  GuildMemberSummary,
  GuildRow,
} from '../database.types';
import { requireData, requireSuccess } from './errors';

export type OnlineGuildContext = Readonly<{
  guild: GuildRow;
  membership: GuildMemberRow;
}>;

export const guildRepository = {
  async getContext(travelerId: string): Promise<OnlineGuildContext | null> {
    const membershipResult = await getSupabaseBrowserClient()
      .from('guild_members')
      .select('*')
      .eq('traveler_id', travelerId)
      .eq('status', 'active')
      .maybeSingle();
    if (membershipResult.error)
      throw new Error('Não foi possível carregar sua Guilda.');
    const membership = membershipResult.data;
    if (!membership) return null;
    const guildResult = await getSupabaseBrowserClient()
      .from('guilds')
      .select('*')
      .eq('id', membership.guild_id)
      .maybeSingle();
    if (guildResult.error || !guildResult.data)
      throw new Error('Não foi possível carregar sua Guilda.');
    return { guild: guildResult.data, membership };
  },

  async getOwnJoinRequest(
    travelerId: string,
  ): Promise<GuildJoinRequestRow | null> {
    const result = await getSupabaseBrowserClient()
      .from('guild_join_requests')
      .select('*')
      .eq('traveler_id', travelerId)
      .eq('status', 'pending')
      .maybeSingle();
    if (result.error)
      throw new Error('Não foi possível carregar seu pedido de entrada.');
    return result.data;
  },

  async create(
    travelerId: string,
    name: string,
    description: string,
  ): Promise<string> {
    const result = await getSupabaseBrowserClient().rpc('create_guild', {
      p_leader_traveler_id: travelerId,
      p_name: name,
      p_description: description || null,
    });
    return requireData(result, 'Não foi possível criar a Guilda.');
  },

  async requestJoin(guildId: string, travelerId: string): Promise<string> {
    const result = await getSupabaseBrowserClient().rpc('request_join_guild', {
      p_guild_id: guildId,
      p_traveler_id: travelerId,
    });
    return requireData(result, 'Não foi possível solicitar entrada na Guilda.');
  },

  async reviewJoinRequest(
    requestId: string,
    reviewerTravelerId: string,
    approve: boolean,
  ): Promise<void> {
    const result = await getSupabaseBrowserClient().rpc(
      'review_guild_join_request',
      {
        p_request_id: requestId,
        p_reviewer_traveler_id: reviewerTravelerId,
        p_approve: approve,
      },
    );
    requireSuccess(result, 'Não foi possível revisar o pedido.');
  },

  async leave(travelerId: string): Promise<void> {
    const result = await getSupabaseBrowserClient().rpc('leave_guild', {
      p_traveler_id: travelerId,
    });
    requireSuccess(result, 'Não foi possível sair da Guilda.');
  },

  async removeMember(memberTravelerId: string, leaderTravelerId: string): Promise<void> {
    const result = await getSupabaseBrowserClient().rpc('remove_guild_member', {
      p_member_traveler_id: memberTravelerId,
      p_leader_traveler_id: leaderTravelerId,
    });
    requireSuccess(result, 'Não foi possível remover o membro.');
  },

  async listMembers(travelerId: string): Promise<GuildMemberSummary[]> {
    const result = await getSupabaseBrowserClient().rpc('list_guild_members', {
      p_requester_traveler_id: travelerId,
    });
    return requireData(result, 'Não foi possível carregar os membros.');
  },

  async listJoinRequests(
    leaderTravelerId: string,
  ): Promise<GuildJoinRequestSummary[]> {
    const result = await getSupabaseBrowserClient().rpc(
      'list_guild_join_requests',
      { p_leader_traveler_id: leaderTravelerId },
    );
    return requireData(
      result,
      'Não foi possível carregar os pedidos de entrada.',
    );
  },
};
