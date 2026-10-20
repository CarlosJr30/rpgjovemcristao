import { getSupabaseBrowserClient } from '../client';
import type { Json } from '../database.types';
import type { Workspace } from '../../../features/guild-ebd/contracts';

export class EbdConflict extends Error {}
export type EbdAction =
  | 'teacher'
  | 'lesson'
  | 'state'
  | 'activity'
  | 'submit'
  | 'grade'
  | 'attendance';
export const ebdRepository = {
  async load(actor: string, offset = 0): Promise<Workspace> {
    const { data, error } = await getSupabaseBrowserClient().rpc(
      'guild_ebd_workspace',
      { p_actor: actor, p_offset: offset },
    );
    if (
      error ||
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      data.version !== 1 ||
      ![
        'lessons',
        'activities',
        'answers',
        'attendance',
        'members',
        'teachers',
        'history',
        'rewards',
      ].every((k) => Array.isArray(data[k]))
    )
      throw new Error(
        'Escola Bíblica indisponível. A atualização autorizada do banco pode estar pendente.',
      );
    return data as unknown as Workspace;
  },
  async command(
    actor: string,
    action: EbdAction,
    id: string,
    revision: number,
    payload: object,
  ) {
    const { data, error } = await getSupabaseBrowserClient().rpc(
      'guild_ebd_command',
      {
        p_actor: actor,
        p_action: action,
        p_id: id,
        p_revision: revision,
        p_data: payload as Json,
      },
    );
    if (error?.code === '40001')
      throw new EbdConflict(
        'Outra atualização foi salva. Seu texto continua no editor. Copie-o antes de recarregar a versão atual.',
      );
    if (error || !data)
      throw new Error(
        'A operação não foi confirmada. Confira os campos, a permissão e o estado atual antes de tentar novamente.',
      );
    return data;
  },
};
