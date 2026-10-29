import { getSupabaseBrowserClient } from '../client';
import {
  getGuildSelection,
  beginGuildWork,
} from '../../guild-governance/selection';
import { guardGuildContext } from '../../guild-governance/context-guard';
import { parseGovernanceStatus } from '../../guild-governance/contracts';
import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from '../online-sync';
import type {
  Json,
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
  canManage?: boolean;
}>;

export class GuildSelectionRequired extends Error {}
function sessionGuard(actor: string) {
  const owner = getCurrentOnlineUserId(),
    revision = getOnlineSessionRevision();
  if (!owner || !canUseTravelerInCurrentSession(actor))
    throw Error('Confirme o avatar ativo da sua conta.');
  return () => {
    if (
      owner !== getCurrentOnlineUserId() ||
      revision !== getOnlineSessionRevision() ||
      !canUseTravelerInCurrentSession(actor)
    )
      throw Error('A conta ou o avatar mudou. Atualize a consulta.');
  };
}
async function contexts(actor: string): Promise<OnlineGuildContext[]> {
  const verify = sessionGuard(actor);
  const result = await getSupabaseBrowserClient().rpc('guild_scoped_contexts', {
    p_actor: actor,
  });
  verify();
  const data = requireData(
    result,
    'Não foi possível carregar suas comunidades.',
  );
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    data.version !== 1 ||
    !Array.isArray(data.guilds)
  )
    throw Error('Resposta de comunidades inválida.');
  const rows = data.guilds as unknown as OnlineGuildContext[];
  if (
    !rows.every(
      (r) =>
        r &&
        typeof r.guild?.id === 'string' &&
        r.membership?.traveler_id === actor &&
        r.membership.guild_id === r.guild.id &&
        r.membership.status === 'active' &&
        typeof r.canManage === 'boolean',
    ) ||
    new Set(rows.map((r) => r.guild.id)).size !== rows.length
  )
    throw Error('Vínculos de comunidade inválidos.');
  return rows;
}
async function scoped(
  actor: string,
  guild: string,
  action: string,
  id: string,
  data: object,
  request: string,
) {
  const verify =
    action === 'create' ? sessionGuard(actor) : guardGuildContext(actor, guild);
  const finish = beginGuildWork(actor);
  try {
    const result = await getSupabaseBrowserClient().rpc(
      'guild_scoped_command',
      {
        p_actor: actor,
        p_guild: guild,
        p_action: action,
        p_id: id,
        p_request: request,
        p_data: data as Json,
      },
    );
    verify();
    const response = requireData(
      result,
      'A operação não foi confirmada. Confira sua permissão nesta Guilda.',
    );
    if (
      !response ||
      typeof response !== 'object' ||
      Array.isArray(response) ||
      typeof response.id !== 'string'
    )
      throw Error('Recibo de comunidade inválido.');
    return response;
  } finally {
    finish();
  }
}

export const guildRepository = {
  async getStatus(actor: string) {
    const verify = sessionGuard(actor);
    const result = await getSupabaseBrowserClient().rpc(
      'guild_scoped_status',
      {},
    );
    verify();
    return parseGovernanceStatus(
      requireData(result, 'Não foi possível confirmar suas permissões.'),
    );
  },
  listContexts: contexts,
  async getContext(
    travelerId: string,
    guildId?: string,
  ): Promise<OnlineGuildContext | null> {
    const selected = guildId ?? getGuildSelection(travelerId);
    const verify = guardGuildContext(travelerId, selected ?? undefined);
    const rows = await contexts(travelerId);
    verify();
    if (selected) {
      const match = rows.find((r) => r.guild.id === selected);
      if (!match)
        throw new GuildSelectionRequired(
          'Selecione uma Guilda em que você participa.',
        );
      return match;
    }
    if (rows.length > 1)
      throw new GuildSelectionRequired(
        'Escolha explicitamente a Guilda ativa.',
      );
    return rows[0] ?? null;
  },

  async getOwnJoinRequest(
    travelerId: string,
    guildId?: string,
  ): Promise<GuildJoinRequestRow | null> {
    const selected = guildId ?? getGuildSelection(travelerId);
    const verify = guardGuildContext(travelerId, selected ?? undefined);
    const query = getSupabaseBrowserClient()
      .from('guild_join_requests')
      .select('*')
      .eq('traveler_id', travelerId)
      .eq('status', 'pending');
    const result = await (selected ? query.eq('guild_id', selected) : query);
    verify();
    if (result.error)
      throw new Error('Não foi possível carregar seu pedido de entrada.');
    if ((result.data?.length ?? 0) > 1)
      throw new GuildSelectionRequired(
        'Selecione o pedido da Guilda desejada.',
      );
    return result.data?.[0] ?? null;
  },

  async createScoped(
    traveler: string,
    id: string,
    name: string,
    description: string,
    request: string,
  ) {
    const receipt = await scoped(
      traveler,
      id,
      'create',
      id,
      { name, description },
      request,
    );
    if (receipt.id !== id)
      throw Error('O recibo não corresponde à comunidade solicitada.');
    return receipt.id;
  },
  async reviewScoped(
    requestId: string,
    actor: string,
    guild: string,
    approve: boolean,
    request: string,
  ) {
    await scoped(actor, guild, 'review', requestId, { approve }, request);
  },
  async leaveScoped(actor: string, guild: string, request: string) {
    await scoped(actor, guild, 'leave', actor, {}, request);
  },
  async removeScoped(
    target: string,
    actor: string,
    guild: string,
    request: string,
  ) {
    await scoped(actor, guild, 'remove', target, {}, request);
  },
  async listMembersScoped(
    actor: string,
    guild: string,
  ): Promise<GuildMemberSummary[]> {
    const verify = guardGuildContext(actor, guild);
    const result = await getSupabaseBrowserClient().rpc(
      'guild_scoped_members',
      { p_actor: actor, p_guild: guild },
    );
    verify();
    return requireData(
      result,
      'Não foi possível carregar os membros desta Guilda.',
    );
  },
  async listRequestsScoped(
    actor: string,
    guild: string,
  ): Promise<GuildJoinRequestSummary[]> {
    const verify = guardGuildContext(actor, guild);
    const result = await getSupabaseBrowserClient().rpc(
      'guild_scoped_requests',
      { p_actor: actor, p_guild: guild },
    );
    verify();
    return requireData(
      result,
      'Não foi possível carregar os pedidos desta Guilda.',
    );
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

  async removeMember(
    memberTravelerId: string,
    leaderTravelerId: string,
  ): Promise<void> {
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
