import { getSupabaseBrowserClient } from '../supabase/client';
import type { Json } from '../supabase/database.types';
import { guardGuildContext } from '../guild-governance/context-guard';
import { beginGuildWork } from '../guild-governance/selection';
import { parseClassesWorkspace } from './contracts';
export class ClassCommandRejected extends Error {}
export class ClassConflict extends ClassCommandRejected {}
export const classesRepository = {
  async load(actor: string, guild: string, selected: string | null) {
    const verify = guardGuildContext(actor, guild);
    const { data, error } = await getSupabaseBrowserClient().rpc(
      'ebd_classes_workspace',
      { p_actor: actor, p_guild: guild, p_class: selected },
    );
    verify();
    if (error)
      throw Error(
        'Classes indisponíveis. Atualize a consulta ou confira sua permissão.',
      );
    return parseClassesWorkspace(data, guild, selected);
  },
  async command(
    actor: string,
    guild: string,
    selected: string,
    action: 'save' | 'state' | 'teacher' | 'member' | 'leave',
    revision: number,
    payload: object,
    request: string,
  ) {
    const verify = guardGuildContext(actor, guild),
      finish = beginGuildWork(actor);
    try {
      const { data, error } = await getSupabaseBrowserClient().rpc(
        'ebd_classes_command',
        {
          p_actor: actor,
          p_guild: guild,
          p_class: selected,
          p_action: action,
          p_request: request,
          p_revision: revision,
          p_data: payload as Json,
        },
      );
      verify();
      if (error?.code === 'PT409')
        throw new ClassConflict(
          'Outra atualização foi salva. Seu texto foi preservado; confira a versão atual antes de tentar novamente.',
        );
      if (
        error &&
        ['42501', '22023', 'P0002', '23505', '55000'].includes(error.code)
      )
        throw new ClassCommandRejected(
          'O servidor recusou a operação. Confira sua permissão e os dados.',
        );
      if (
        error ||
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        data.id !== selected ||
        typeof data.revision !== 'number' ||
        typeof data.replayed !== 'boolean'
      )
        throw Error(
          'A operação não foi confirmada. Confira a permissão e os dados antes de tentar novamente.',
        );
      return data;
    } finally {
      finish();
    }
  },
};
