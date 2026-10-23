import type { OriginsLesson } from '../../apps/web/features/story/origins-lessons';
import type { WorkbookEvent } from '../../apps/web/features/story/workbook';
export const workbookOwner = '00000000-0000-4000-8000-000000000005';
export const workbookTraveler = '10000000-0000-4000-8000-000000000005';
export function learningEvents(
  lesson: OriginsLesson,
  through: 'activity' | 'quiz' | 'reflection' | 'video' = 'video',
): WorkbookEvent[] {
  const events: WorkbookEvent[] = [
    ...lesson.scenes.map((s) => ({ type: 'visit' as const, sceneId: s.id })),
    ...lesson.readings.flatMap((r) => [
      { type: 'reading-open' as const, chapter: r.chapter },
      { type: 'reading-confirm' as const, chapter: r.chapter },
    ]),
  ];
  if (through === 'activity') return events;
  if (lesson.storyId === 'garden-choice')
    events.push({ type: 'snake-complete' });
  else
    for (const task of lesson.activity.tasks)
      events.push({ type: 'task', taskId: task.id, choice: task.answer });
  if (through === 'quiz') return events;
  for (const question of lesson.quiz)
    events.push({
      type: 'quiz-answer',
      questionId: question.id,
      optionId: question.correctOptionId,
    });
  events.push({type:'quiz-confirm'});
  if (through === 'reflection') return events;
  return [...events, { type: 'reflect' }];
}
