import { getSupabaseBrowserClient } from '../client';
import type { Json } from '../database.types';
import type { Workspace } from '../../../features/guild-ebd/contracts';
import { guardGuildContext } from '../../guild-governance/context-guard';
import { beginGuildWork } from '../../guild-governance/selection';

export class EbdConflict extends Error {}
export type EbdAction =
  | 'teacher'
  | 'lesson'
  | 'state'
  | 'activity'
  | 'submit'
  | 'grade'
  | 'attendance'
  | 'quiz'
  | 'quiz_remove'
  | 'quiz_submit';
// Class authority keeps quizzes separate from legacy single-question activities.
export type ClassEbdAction = EbdAction | 'quiz' | 'quiz_submit';
export const ebdRepository = {
  async load(actor: string, offset = 0, guildId?: string): Promise<Workspace> {
    const verify = guildId ? guardGuildContext(actor, guildId) : () => {};
    const { data, error } = guildId
      ? await getSupabaseBrowserClient().rpc('guild_scoped_ebd_workspace', {
          p_actor: actor,
          p_guild: guildId,
          p_offset: offset,
        })
      : await getSupabaseBrowserClient().rpc('guild_ebd_workspace', {
          p_actor: actor,
          p_offset: offset,
        });
    verify();
    if (
      error ||
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      data.version !== 1 ||
      (guildId !== undefined && data.guildId !== guildId) ||
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
    guildId?: string,
  ) {
    const verify = guildId ? guardGuildContext(actor, guildId) : () => {},
      finish = guildId ? beginGuildWork(actor) : () => {};
    try {
      const { data, error } = guildId
        ? await getSupabaseBrowserClient().rpc('guild_scoped_ebd_command', {
            p_actor: actor,
            p_guild: guildId,
            p_action: action,
            p_id: id,
            p_revision: revision,
            p_data: payload as Json,
          })
        : await getSupabaseBrowserClient().rpc('guild_ebd_command', {
            p_actor: actor,
            p_action: action,
            p_id: id,
            p_revision: revision,
            p_data: payload as Json,
          });
      verify();
      if (error?.code === 'PT409' || error?.code === '40001')
        throw new EbdConflict(
          'Outra atualização foi salva. Seu texto continua no editor. Copie-o antes de recarregar a versão atual.',
        );
      if (error || !data)
        throw new Error(
          'A operação não foi confirmada. Confira os campos, a permissão e o estado atual antes de tentar novamente.',
        );
      return data;
    } finally {
      finish();
    }
  },
};
