import { getSupabaseBrowserClient } from '../client';
import type { GuildLessonRow } from '../database.types';
import { requireData, requireSuccess } from './errors';

export type GuildLessonInput = Readonly<{
  id?: string;
  leaderTravelerId: string;
  title: string;
  theme: string;
  bibleReference: string;
  bibleUrl: string;
  introduction: string;
  content: string;
  mainPoints: string[];
  discussionQuestions: string[];
  activityText: string;
  scheduledAt: string;
  relatedMissionId: string;
  publish: boolean;
}>;

export const guildLessonRepository = {
  async upcoming(guildId: string): Promise<GuildLessonRow[]> {
    const result = await getSupabaseBrowserClient().from('guild_lessons').select('*')
      .eq('guild_id', guildId).in('status', ['published', 'completed'])
      .gte('scheduled_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('scheduled_at', { ascending: true }).limit(5);
    if (result.error) throw new Error('Não foi possível carregar as próximas aulas.');
    return result.data;
  },
  async list(guildId: string): Promise<GuildLessonRow[]> {
    const result = await getSupabaseBrowserClient().from('guild_lessons').select('*')
      .eq('guild_id', guildId).order('scheduled_at', { ascending: true, nullsFirst: false });
    if (result.error) throw new Error('Não foi possível carregar as aulas.');
    return result.data;
  },
  async save(input: GuildLessonInput): Promise<string> {
    const result = await getSupabaseBrowserClient().rpc('save_guild_lesson', {
      p_lesson_id: input.id ?? null,
      p_leader_traveler_id: input.leaderTravelerId,
      p_title: input.title.trim(), p_theme: input.theme.trim(),
      p_bible_reference: input.bibleReference.trim(), p_bible_url: input.bibleUrl.trim() || null,
      p_introduction: input.introduction.trim(), p_content: input.content.trim(),
      p_main_points: input.mainPoints.map((item) => item.trim()).filter(Boolean),
      p_discussion_questions: input.discussionQuestions.map((item) => item.trim()).filter(Boolean),
      p_activity_text: input.activityText.trim() || null,
      p_scheduled_at: input.scheduledAt ? new Date(input.scheduledAt).toISOString() : null,
      p_related_mission_id: input.relatedMissionId || null, p_publish: input.publish,
    });
    return requireData(result, 'Não foi possível salvar a aula.');
  },
  async setStatus(lessonId: string, leaderTravelerId: string, status: 'completed' | 'cancelled'): Promise<void> {
    const result = await getSupabaseBrowserClient().rpc('set_guild_lesson_status', {
      p_lesson_id: lessonId, p_leader_traveler_id: leaderTravelerId, p_status: status,
    });
    requireSuccess(result, 'Não foi possível atualizar a aula.');
  },
};
