import { ALL_STORIES, STORY_STEPS } from '../../features/story/catalog';
import type { StoryProgress } from '../../features/story/progression';
import {
  canUseTravelerInCurrentSession,
  getCurrentOnlineUserId,
  getOnlineSessionRevision,
} from './online-sync';
import { getSupabaseBrowserClient } from './client';

export function parseStoryProgress(
  value: unknown,
  travelerId: string,
): StoryProgress[] {
  if (!Array.isArray(value) || value.length > ALL_STORIES.length)
    throw new Error('Progresso inválido.');
  const seen = new Set<string>();
  return value.map((row: unknown) => {
    if (!row || typeof row !== 'object') throw new Error('Progresso inválido.');
    const r = row as Record<string, unknown>;
    if (
      r.traveler_id !== travelerId ||
      typeof r.story_id !== 'string' ||
      !ALL_STORIES.some((s) => s.id === r.story_id) ||
      seen.has(r.story_id) ||
      !Array.isArray(r.completed_steps) ||
      r.completed_steps.length > STORY_STEPS.length ||
      !r.completed_steps.every((s) => STORY_STEPS.includes(s)) ||
      new Set(r.completed_steps).size !== r.completed_steps.length ||
      typeof r.video_completed !== 'boolean' ||
      !(
        r.reward_receipt === null ||
        (typeof r.reward_receipt === 'string' &&
          r.reward_receipt.length > 0 &&
          r.reward_receipt.length <= 200)
      ) ||
      !(
        r.completed_at === null ||
        (typeof r.completed_at === 'string' &&
          Number.isFinite(Date.parse(r.completed_at)))
      )
    )
      throw new Error('Progresso inválido.');
    seen.add(r.story_id);
    return {
      traveler_id: travelerId,
      story_id: r.story_id,
      completed_steps: [...r.completed_steps],
      video_completed: r.video_completed,
      reward_receipt: r.reward_receipt,
      completed_at: r.completed_at,
    } as StoryProgress;
  });
}

// No local progress, writes, authority RPCs or fallback on permission errors.
export async function readStoryProgress(
  travelerId: string,
): Promise<StoryProgress[]> {
  const owner = getCurrentOnlineUserId(),
    session = getOnlineSessionRevision();
  const current = () =>
    !!owner &&
    owner === getCurrentOnlineUserId() &&
    session === getOnlineSessionRevision() &&
    canUseTravelerInCurrentSession(travelerId);
  if (!current()) throw new Error('Sessão indisponível.');
  const { data, error } = await getSupabaseBrowserClient()
    .from('story_progress')
    .select(
      'traveler_id,story_id,completed_steps,video_completed,reward_receipt,completed_at',
    )
    .eq('traveler_id', travelerId);
  if (error || !current())
    throw new Error('Não foi possível consultar o progresso.');
  return parseStoryProgress(data, travelerId);
}
