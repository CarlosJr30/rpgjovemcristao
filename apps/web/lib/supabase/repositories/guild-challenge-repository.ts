import { getSupabaseBrowserClient } from '../client';
import type { Json } from '../database.types';
import { guardGuildContext } from '../../guild-governance/context-guard';
import { beginGuildWork } from '../../guild-governance/selection';
import {
  parseChallengeWorkspace,
  type ChallengeAction,
} from '../../../features/guild-challenges/contracts';
export class ChallengeRejected extends Error {}
export const guildChallengeRepository = {
  async load(actor: string, guild: string, event: string | null, offset = 0) {
    const verify = guardGuildContext(actor, guild);
    const { data, error } = await getSupabaseBrowserClient().rpc(
      'guild_challenges_workspace',
      { p_actor: actor, p_guild: guild, p_event: event, p_offset: offset },
    );
    verify();
    if (error)
      throw Error(
        'Gincanas indisponíveis. Confira sua comunidade e autorização atual.',
      );
    return parseChallengeWorkspace(data, guild, event);
  },
  async command(
    actor: string,
    guild: string,
    action: ChallengeAction,
    event: string,
    revision: number,
    payload: object,
    request: string,
  ) {
    const verify = guardGuildContext(actor, guild),
      finish = beginGuildWork(actor);
    try {
      const { data, error } = await getSupabaseBrowserClient().rpc(
        'guild_challenges_command',
        {
          p_actor: actor,
          p_guild: guild,
          p_action: action,
          p_event: event,
          p_request: request,
          p_revision: revision,
          p_data: payload as Json,
        },
      );
      verify();
      if (
        error &&
        [
          'PT409',
          '42501',
          '22023',
          'P0002',
          '23505',
          '55000',
          '22007',
          '23514',
        ].includes(error.code)
      )
        throw new ChallengeRejected(
          error.code === 'PT409'
            ? 'Conflito: atualize e confira o registro oficial antes de continuar.'
            : 'Operação recusada. Confira regras, datas, adesão e autorização atual.',
        );
      if (
        error ||
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        data.id !== event ||
        data.guildId !== guild ||
        data.action !== action ||
        !Number.isInteger(data.revision) ||
        typeof data.replayed !== 'boolean' ||
        data.economicIssued !== false
      )
        throw Error(
          'Resultado não confirmado. Confira o histórico antes de repetir.',
        );
      return data;
    } finally {
      finish();
    }
  },
};
