import { beforeEach, describe, expect, test, vi } from 'vitest';

const { client, rpc } = vi.hoisted(() => {
  const rpc = vi.fn();
  return { client: { rpc, from: vi.fn() }, rpc };
});
vi.mock('../client', () => ({ getSupabaseBrowserClient: () => client }));

import { guildRepository } from './guild-repository';
import { guildMissionRepository } from './guild-mission-repository';
import { guildLessonRepository } from './guild-lesson-repository';

beforeEach(() => rpc.mockReset());

describe('Guild Supabase repositories', () => {
  test('creates a Guild without sending user identity or role', async () => {
    rpc.mockResolvedValue({ data: 'guild-1', error: null });
    await expect(
      guildRepository.create('traveler-1', 'Célula Esperança', 'Grupo jovem'),
    ).resolves.toBe('guild-1');
    expect(rpc).toHaveBeenCalledWith('create_guild', {
      p_leader_traveler_id: 'traveler-1',
      p_name: 'Célula Esperança',
      p_description: 'Grupo jovem',
    });
  });

  test('creates mission using only the tier, never arbitrary XP or coins', async () => {
    rpc.mockResolvedValue({ data: 'mission-1', error: null });
    await guildMissionRepository.create({
      travelerId: 'traveler-1',
      title: 'Servir em comunidade',
      description: 'Atividade objetiva.',
      missionType: 'practical_activity',
      bibleReference: '',
      bibleUrl: '',
      completionMode: 'leader_approval',
      rewardTier: 'great',
      startsAt: '',
      dueAt: '',
      publish: true,
    });
    const payload = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(rpc.mock.calls[0][0]).toBe('create_guild_mission');
    expect(payload.p_reward_tier).toBe('great');
    expect(Object.keys(payload).some((key) => /xp|coin|chest/i.test(key))).toBe(
      false,
    );
  });

  test('uses atomic RPCs for submission and leader approval', async () => {
    rpc
      .mockResolvedValueOnce({ data: 'pending_approval', error: null })
      .mockResolvedValueOnce({ data: 'completed', error: null });
    await expect(
      guildMissionRepository.submit(
        'mission-1',
        'member-1',
        'Concluí a tarefa.',
      ),
    ).resolves.toBe('pending_approval');
    await expect(
      guildMissionRepository.review('mission-1', 'member-1', 'leader-1', true),
    ).resolves.toBe('completed');
    expect(rpc).toHaveBeenNthCalledWith(2, 'review_guild_mission', {
      p_mission_id: 'mission-1',
      p_member_traveler_id: 'member-1',
      p_reviewer_traveler_id: 'leader-1',
      p_approve: true,
    });
  });

  test('routes leader management through guarded RPCs without direct table updates', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await guildMissionRepository.deleteDraft('draft-1', 'leader-1');
    await guildMissionRepository.close('mission-1', 'leader-1');
    await guildRepository.removeMember('member-1', 'leader-1');
    expect(rpc).toHaveBeenNthCalledWith(1, 'delete_guild_mission_draft', { p_mission_id: 'draft-1', p_leader_traveler_id: 'leader-1' });
    expect(rpc).toHaveBeenNthCalledWith(2, 'close_guild_mission', { p_mission_id: 'mission-1', p_leader_traveler_id: 'leader-1' });
    expect(rpc).toHaveBeenNthCalledWith(3, 'remove_guild_member', { p_member_traveler_id: 'member-1', p_leader_traveler_id: 'leader-1' });
    expect(client.from).not.toHaveBeenCalled();
  });

  test('sends optional rejection guidance but no reward values', async () => {
    rpc.mockResolvedValue({ data: 'rejected', error: null });
    await expect(guildMissionRepository.reviewWithGuidance('mission-1', 'member-1', 'leader-1', false, 'Tente novamente.')).resolves.toBe('rejected');
    expect(rpc).toHaveBeenCalledWith('review_guild_mission_with_guidance', {
      p_mission_id: 'mission-1', p_member_traveler_id: 'member-1', p_reviewer_traveler_id: 'leader-1',
      p_approve: false, p_guidance: 'Tente novamente.',
    });
  });
  test('saves a lesson through the guarded RPC and only links a mission by id', async () => {
    rpc.mockResolvedValue({ data: 'lesson-1', error: null });
    await guildLessonRepository.save({ leaderTravelerId: 'leader-1', title: 'Eu sou a videira', theme: 'Permanecer',
      bibleReference: 'João 15', bibleUrl: 'https://www.bible.com/pt/bible/129/JHN.15.NVI',
      introduction: 'Introdução', content: 'Estudo da passagem', mainPoints: ['A videira'],
      discussionQuestions: ['Qual é a imagem central?'], activityText: '', scheduledAt: '',
      relatedMissionId: 'mission-1', publish: true });
    expect(rpc).toHaveBeenCalledWith('save_guild_lesson', expect.objectContaining({
      p_leader_traveler_id: 'leader-1', p_related_mission_id: 'mission-1', p_publish: true,
      p_discussion_questions: ['Qual é a imagem central?'],
    }));
    expect(client.from).not.toHaveBeenCalled();
  });
});
