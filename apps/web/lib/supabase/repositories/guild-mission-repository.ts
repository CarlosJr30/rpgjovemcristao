import type { GuildRewardTier } from '@rpg/game-engine';
import { getSupabaseBrowserClient } from '../client';
import type {
  GuildMissionProgressRow,
  GuildMissionProgressSummary,
  GuildMissionRow,
  Json,
} from '../database.types';
import { requireData, requireSuccess } from './errors';

export type GuildMissionType =
  | 'bible_reading'
  | 'lesson'
  | 'quiz'
  | 'practical_activity'
  | 'individual_challenge'
  | 'collective_challenge'
  | 'special_mission'
  | 'journey_gate';
export type GuildCompletionMode = 'self_complete' | 'leader_approval';
export type CreateGuildMissionInput = Readonly<{
  travelerId: string;
  title: string;
  description: string;
  missionType: GuildMissionType;
  bibleReference: string;
  bibleUrl: string;
  completionMode: GuildCompletionMode;
  rewardTier: GuildRewardTier;
  startsAt: string;
  dueAt: string;
  publish: boolean;
  metadata?: Json;
}>;

export const guildMissionRepository = {
  async list(guildId: string): Promise<GuildMissionRow[]> {
    const result = await getSupabaseBrowserClient()
      .from('guild_missions')
      .select('*')
      .eq('guild_id', guildId)
      .order('created_at', { ascending: false });
    if (result.error) throw new Error('Não foi possível carregar as Missões.');
    return result.data;
  },

  async listOwnProgress(
    travelerId: string,
  ): Promise<GuildMissionProgressRow[]> {
    const result = await getSupabaseBrowserClient()
      .from('guild_mission_progress')
      .select('*')
      .eq('traveler_id', travelerId);
    if (result.error)
      throw new Error('Não foi possível carregar seu progresso.');
    return result.data;
  },

  async create(input: CreateGuildMissionInput): Promise<string> {
    const result = await getSupabaseBrowserClient().rpc(
      'create_guild_mission',
      {
        p_creator_traveler_id: input.travelerId,
        p_title: input.title,
        p_description: input.description || null,
        p_mission_type: input.missionType,
        p_bible_reference: input.bibleReference || null,
        p_bible_url: input.bibleUrl || null,
        p_completion_mode: input.completionMode,
        p_reward_tier: input.rewardTier,
        p_starts_at: input.startsAt
          ? new Date(input.startsAt).toISOString()
          : null,
        p_due_at: input.dueAt ? new Date(input.dueAt).toISOString() : null,
        p_publish: input.publish,
        p_metadata: input.metadata ?? null,
      },
    );
    return requireData(result, 'Não foi possível criar a Missão.');
  },

  async publish(missionId: string, leaderTravelerId: string): Promise<void> {
    const result = await getSupabaseBrowserClient().rpc(
      'publish_guild_mission',
      { p_mission_id: missionId, p_leader_traveler_id: leaderTravelerId },
    );
    requireSuccess(result, 'Não foi possível publicar a Missão.');
  },

  async updateDraft(missionId: string, input: CreateGuildMissionInput): Promise<void> {
    const result = await getSupabaseBrowserClient().rpc('update_guild_mission_draft', {
      p_mission_id: missionId, p_leader_traveler_id: input.travelerId,
      p_title: input.title, p_description: input.description || null,
      p_mission_type: input.missionType, p_bible_reference: input.bibleReference || null,
      p_bible_url: input.bibleUrl || null, p_completion_mode: input.completionMode,
      p_reward_tier: input.rewardTier,
      p_starts_at: input.startsAt ? new Date(input.startsAt).toISOString() : null,
      p_due_at: input.dueAt ? new Date(input.dueAt).toISOString() : null,
    });
    requireSuccess(result, 'Não foi possível salvar o rascunho.');
  },

  async deleteDraft(missionId: string, leaderTravelerId: string): Promise<void> {
    const result = await getSupabaseBrowserClient().rpc('delete_guild_mission_draft', {
      p_mission_id: missionId, p_leader_traveler_id: leaderTravelerId,
    });
    requireSuccess(result, 'Não foi possível excluir o rascunho.');
  },

  async close(missionId: string, leaderTravelerId: string): Promise<void> {
    const result = await getSupabaseBrowserClient().rpc('close_guild_mission', {
      p_mission_id: missionId, p_leader_traveler_id: leaderTravelerId,
    });
    requireSuccess(result, 'Não foi possível encerrar a missão.');
  },

  async start(missionId: string, travelerId: string): Promise<string> {
    const result = await getSupabaseBrowserClient().rpc('start_guild_mission', {
      p_mission_id: missionId,
      p_traveler_id: travelerId,
    });
    return requireData(result, 'Não foi possível iniciar a Missão.');
  },

  async submit(
    missionId: string,
    travelerId: string,
    note: string,
  ): Promise<string> {
    const result = await getSupabaseBrowserClient().rpc(
      'submit_guild_mission',
      {
        p_mission_id: missionId,
        p_traveler_id: travelerId,
        p_completion_note: note || null,
      },
    );
    return requireData(result, 'Não foi possível concluir a Missão.');
  },

  async review(
    missionId: string,
    memberTravelerId: string,
    reviewerTravelerId: string,
    approve: boolean,
  ): Promise<string> {
    const result = await getSupabaseBrowserClient().rpc(
      'review_guild_mission',
      {
        p_mission_id: missionId,
        p_member_traveler_id: memberTravelerId,
        p_reviewer_traveler_id: reviewerTravelerId,
        p_approve: approve,
      },
    );
    return requireData(result, 'Não foi possível revisar a Missão.');
  },

  async reviewWithGuidance(missionId: string, memberTravelerId: string, reviewerTravelerId: string, approve: boolean, guidance: string): Promise<string> {
    const result = await getSupabaseBrowserClient().rpc('review_guild_mission_with_guidance', {
      p_mission_id: missionId, p_member_traveler_id: memberTravelerId,
      p_reviewer_traveler_id: reviewerTravelerId, p_approve: approve,
      p_guidance: guidance || null,
    });
    return requireData(result, 'Não foi possível revisar a missão.');
  },

  async listProgress(
    missionId: string,
    leaderTravelerId: string,
  ): Promise<GuildMissionProgressSummary[]> {
    const result = await getSupabaseBrowserClient().rpc(
      'list_guild_mission_progress',
      { p_mission_id: missionId, p_leader_traveler_id: leaderTravelerId },
    );
    return requireData(
      result,
      'Não foi possível carregar o progresso da Missão.',
    );
  },
};
