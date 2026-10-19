import { getSupabaseBrowserClient } from '../client';
import type { StoryProgress } from '../../../features/story/progression';

export const storyRepository = {
  async list(travelerId: string): Promise<StoryProgress[]> {
    const result = await getSupabaseBrowserClient()
      .from('story_progress')
      .select('*')
      .eq('traveler_id', travelerId);
    if (result.error || !Array.isArray(result.data))
      throw new Error(
        'O progresso das histórias ainda não está disponível. Seu histórico do Jardim foi preservado.',
      );
    return result.data;
  },
  async complete(travelerId: string, storyId: string): Promise<void> {
    const result = await getSupabaseBrowserClient().rpc('complete_story', {
      p_traveler_id: travelerId,
      p_story_id: storyId,
    });
    if (result.error)
      throw new Error(
        'Não foi possível concluir. Verifique as etapas, o vídeo e a recompensa pendentes.',
      );
  },
};
