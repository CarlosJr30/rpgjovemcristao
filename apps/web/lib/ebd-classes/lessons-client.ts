import { getSupabaseBrowserClient } from '../supabase/client';
import type { Json } from '../supabase/database.types';
import type { Workspace } from '../../features/guild-ebd/contracts';
import type { EbdAction } from '../supabase/repositories/guild-ebd-repository';
import { EbdConflict } from '../supabase/repositories/guild-ebd-repository';
import { guardGuildContext } from '../guild-governance/context-guard';
import { beginGuildWork } from '../guild-governance/selection';
export class LessonCommandRejected extends Error {}
export function parseClassLessons(
  value: unknown,
  guild: string,
  selected: string,
): Workspace {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Resposta de aula inválida.');
  const r = value as Record<string, unknown>;
  if (
    r.version !== 2 ||
    r.guildId !== guild ||
    r.classId !== selected ||
    typeof r.leader !== 'boolean' ||
    typeof r.teacher !== 'boolean' ||
    ![
      'lessons',
      'activities',
      'answers',
      'attendance',
      'members',
      'teachers',
      'history',
      'rewards',
      'quizzes',
      'quizResults',
      'eligibility',
    ].every((k) => Array.isArray(r[k])) ||
    !(r.lessons as Record<string, unknown>[]).every(
      (l) =>
        l &&
        typeof l === 'object' &&
        l.ebd_class_id === selected &&
        l.guild_id === guild,
    ) ||
    !(r.quizzes as Record<string, unknown>[]).every(
      (q) =>
        q &&
        typeof q === 'object' &&
        Array.isArray(q.questions) &&
        q.questions.length === 7,
    )
  )
    throw Error('Resposta de outra classe ou formato incompatível.');
  return r as unknown as Workspace;
}
export const classLessonsRepository = {
  async load(actor: string, guild: string, selected: string, offset = 0) {
    const verify = guardGuildContext(actor, guild);
    const { data, error } = await getSupabaseBrowserClient().rpc(
      'ebd_class_lessons_workspace',
      { p_actor: actor, p_guild: guild, p_class: selected, p_offset: offset },
    );
    verify();
    if (error)
      throw Error('Aulas indisponíveis. Confira sua classe e permissão.');
    return parseClassLessons(data, guild, selected);
  },
  async command(
    actor: string,
    guild: string,
    selected: string,
    action: EbdAction,
    id: string,
    revision: number,
    payload: object,
    request: string,
  ) {
    const verify = guardGuildContext(actor, guild),
      finish = beginGuildWork(actor);
    try {
      const { data, error } = await getSupabaseBrowserClient().rpc(
        'ebd_class_lessons_command',
        {
          p_actor: actor,
          p_guild: guild,
          p_class: selected,
          p_action: action,
          p_id: id,
          p_request: request,
          p_revision: revision,
          p_data: payload as Json,
        },
      );
      verify();
      if (error?.code === 'PT409')
        throw new EbdConflict(
          'Outra atualização foi salva. Seu texto foi preservado; atualize a consulta antes de repetir.',
        );
      if (
        error &&
        ['42501', '22023', 'P0002', '23505', '55000', '54000'].includes(
          error.code,
        )
      )
        throw new LessonCommandRejected(
          'Operação recusada. Confira campos, publicação e autorização atual.',
        );
      if (
        error ||
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        data.id !== id ||
        typeof data.revision !== 'number' ||
        typeof data.replayed !== 'boolean'
      )
        throw Error(
          'A operação não foi confirmada. Confira o estado antes de tentar novamente.',
        );
      return data;
    } finally {
      finish();
    }
  },
};
