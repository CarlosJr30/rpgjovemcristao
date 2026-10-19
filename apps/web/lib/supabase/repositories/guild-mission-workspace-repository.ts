import { getSupabaseBrowserClient } from '../client';
import type { Json } from '../database.types';
import type {
  Decision,
  MissionFormData,
  Workspace,
} from '../../../features/guild-missions/contracts';

const failure = () =>
  new Error(
    'Não foi possível salvar. Confira a permissão, os campos e se os dados foram atualizados.',
  );
export const missionWorkspaceRepository = {
  async load(actor: string, historyOffset = 0): Promise<Workspace> {
    const { data, error } = await getSupabaseBrowserClient().rpc(
      'guild_mission_workspace',
      { p_actor: actor, p_history_offset: historyOffset },
    );
    if (
      error ||
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      data.version !== 1 ||
      !Array.isArray(data.missions) ||
      !Array.isArray(data.attempts) ||
      !Array.isArray(data.progress) ||
      !Array.isArray(data.history)
    )
      throw new Error(
        'Painel de missões indisponível. A atualização autorizada do banco pode estar pendente.',
      );
    return data as unknown as Workspace;
  },
  async save(
    actor: string,
    id: string,
    revision: number,
    input: MissionFormData,
  ): Promise<string> {
    const payload = {
      ...input,
      targetIds: input.audience === 'all' ? [] : input.targetIds,
      startsAt: input.startsAt ? new Date(input.startsAt).toISOString() : '',
      dueAt: input.dueAt ? new Date(input.dueAt).toISOString() : '',
    };
    const { data, error } = await getSupabaseBrowserClient().rpc(
      'save_guild_mission_v2',
      {
        p_actor: actor,
        p_mission: id,
        p_expected_revision: revision,
        p_data: payload as Json,
      },
    );
    if (error || !data) throw failure();
    return data;
  },
  async transition(
    actor: string,
    id: string,
    revision: number,
    action: 'publish' | 'close' | 'cancel',
  ) {
    const { error } = await getSupabaseBrowserClient().rpc(
      'transition_guild_mission_v2',
      {
        p_actor: actor,
        p_mission: id,
        p_expected_revision: revision,
        p_action: action,
      },
    );
    if (error) throw failure();
  },
  async act(
    actor: string,
    id: string,
    action: 'start' | 'submit',
    note: string,
    requestId: string,
    attempt = 0,
  ) {
    const { error } = await getSupabaseBrowserClient().rpc(
      'act_guild_mission_v2',
      {
        p_actor: actor,
        p_mission: id,
        p_action: action,
        p_note: note,
        p_request: requestId,
        p_expected_attempt: attempt,
      },
    );
    if (error) throw failure();
  },
  async review(
    actor: string,
    attemptId: string,
    revision: number,
    decision: Decision,
    reason: string,
    requestId: string,
  ) {
    const { error } = await getSupabaseBrowserClient().rpc(
      'review_guild_mission_v2',
      {
        p_actor: actor,
        p_attempt: attemptId,
        p_revision: revision,
        p_decision: decision,
        p_reason: reason,
        p_request: requestId,
      },
    );
    if (error) throw failure();
  },
};
