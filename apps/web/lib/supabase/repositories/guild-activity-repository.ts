import { getSupabaseBrowserClient } from '../client';
import type { Json } from '../database.types';
import { guardGuildContext } from '../../guild-governance/context-guard';
import { beginGuildWork } from '../../guild-governance/selection';
import { parseCellWorkspace } from '../../../features/guild-missions/cell-contracts';
export class CellCommandRejected extends Error {}
export type CellAction =
  'save' | 'state' | 'delegate' | 'participate' | 'review';
export const guildActivityRepository = {
  async load(actor: string, guild: string, offset = 0) {
    const verify = guardGuildContext(actor, guild);
    const { data, error } = await getSupabaseBrowserClient().rpc(
      'guild_activity_workspace',
      { p_actor: actor, p_guild: guild, p_offset: offset },
    );
    verify();
    if (error)
      throw Error(
        'Atividades indisponíveis. Confira sua Guilda e autorização atual.',
      );
    return parseCellWorkspace(data, guild);
  },
  async command(
    actor: string,
    guild: string,
    action: CellAction,
    id: string,
    revision: number,
    payload: object,
    request: string,
  ) {
    const verify = guardGuildContext(actor, guild),
      finish = beginGuildWork(actor);
    try {
      const { data, error } = await getSupabaseBrowserClient().rpc(
        'guild_activity_command',
        {
          p_actor: actor,
          p_guild: guild,
          p_action: action,
          p_id: id,
          p_request: request,
          p_revision: revision,
          p_data: payload as Json,
        },
      );
      verify();
      if (
        error &&
        ['PT409', '42501', '22023', 'P0002', '23505', '55000'].includes(
          error.code,
        )
      )
        throw new CellCommandRejected(
          error.code === 'PT409'
            ? 'Outra atualização já foi salva ou esta conta já participa por outro avatar. Atualize e confira o histórico.'
            : 'Operação recusada. Confira datas, campos, participação e autorização atual.',
        );
      if (
        error ||
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        data.id !== id ||
        data.guildId !== guild ||
        data.action !== action ||
        !Number.isInteger(data.revision) ||
        typeof data.replayed !== 'boolean' ||
        data.economicIssued !== false
      )
        throw Error(
          'O resultado não foi confirmado. Preserve os campos e confira o histórico antes de repetir.',
        );
      return data;
    } finally {
      finish();
    }
  },
};
