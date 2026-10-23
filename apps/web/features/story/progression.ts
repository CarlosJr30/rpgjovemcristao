import {
  ALL_STORIES,
  WORLDS,
  type Story,
  type StoryStep,
  type StoryVideo,
  type World,
} from './catalog';

// This model is display-only. Only the protected backend can issue these records.
export type StoryProgress = {
  traveler_id: string;
  story_id: string;
  completed_steps: StoryStep[];
  video_completed: boolean;
  reward_receipt: string | null;
  completed_at: string | null;
};
export function videoBlocker(video: StoryVideo): string | null {
  if (video.availability === 'unavailable')
    return 'O vídeo está indisponível. A conclusão permanece pendente.';
  if (
    video.availability !== 'available' ||
    !video.provider ||
    (!video.url && !video.externalId)
  )
    return 'Aguardando seleção de um vídeo autorizado.';
  if (
    video.authorization.status !== 'approved' ||
    !video.authorization.terms ||
    !video.authorization.evidence ||
    !video.author ||
    !video.source
  )
    return 'Aguardando comprovação de autorização e autoria do vídeo.';
  if (video.verification === 'none')
    return 'Este provedor ainda não permite registrar a visualização. A conclusão permanece pendente.';
  if(video.embedding!=='allowed'||video.editorialReview.status!=='approved'||!video.editorialReview.reference)
    return 'Aguardando autorização de incorporação e revisão editorial do vídeo.';
  if(!video.durationSeconds||video.durationSeconds<=0||!video.captions||!video.accessibleAlternative)
    return 'Aguardando duração, legendas e alternativa acessível revisadas.';
  return null;
}
export const progressFor = (
  storyId: string,
  travelerId: string,
  records: readonly StoryProgress[],
) =>
  records.find(
    (row) => row.story_id === storyId && row.traveler_id === travelerId,
  );
export function isStoryComplete(
  story: Story,
  row: StoryProgress | undefined,
): boolean {
  return (
    !!row?.completed_at &&
    Number.isFinite(Date.parse(row.completed_at)) &&
    !!row.reward_receipt &&
    row.video_completed &&
    story.requiredSteps.every((step) => row.completed_steps.includes(step))
  );
}
export function storyStatus(
  story: Story,
  travelerId: string,
  records: readonly StoryProgress[],
): 'completed' | 'available' | 'locked' {
  const index = ALL_STORIES.findIndex((item) => item.id === story.id);
  if (index < 0) return 'locked';
  if (isStoryComplete(story, progressFor(story.id, travelerId, records)))
    return 'completed';
  const previous = ALL_STORIES.slice(0, index);
  return previous.every((item) =>
    isStoryComplete(item, progressFor(item.id, travelerId, records)),
  )
    ? 'available'
    : 'locked';
}
export function worldSummary(
  world: World,
  travelerId: string,
  records: readonly StoryProgress[],
) {
  const completed = world.stories.filter((story) =>
    isStoryComplete(story, progressFor(story.id, travelerId, records)),
  ).length;
  const percent = world.stories.length
    ? Math.floor((completed / world.stories.length) * 100)
    : 0;
  const previousWorlds = WORLDS.slice(0, world.order - 1);
  const unlocked = previousWorlds.every(
    (item) =>
      item.stories.length > 0 &&
      item.stories.every((story) =>
        isStoryComplete(story, progressFor(story.id, travelerId, records)),
      ),
  );
  return {
    completed,
    percent,
    status: (world.stories.length > 0 && completed === world.stories.length
      ? 'completed'
      : unlocked && world.stories.length > 0
        ? 'available'
        : 'locked') as 'completed' | 'available' | 'locked',
  };
}
export function nextStory(
  travelerId: string,
  records: readonly StoryProgress[],
) {
  return (
    ALL_STORIES.find(
      (story) =>
        !isStoryComplete(story, progressFor(story.id, travelerId, records)),
    ) ?? null
  );
}
export function nextRequiredStep(
  story: Story,
  row: StoryProgress | undefined,
): StoryStep | null {
  return (
    story.requiredSteps.find((step) =>
      step === 'video'
        ? !row?.video_completed
        : step === 'reward'
          ? !row?.reward_receipt
          : !row?.completed_steps.includes(step),
    ) ?? null
  );
}
