import { describe, expect, it } from 'vitest';
import { ORIGINS_LESSONS } from './origins-lessons';
import { ORIGIN_STORIES, WORLDS } from './catalog';
import { isStoryComplete, storyStatus, videoBlocker } from './progression';
import {
  appendWorkbook,
  emptyWorkbookState,
  lessonQuiz,
  readWorkbook,
  replayWorkbook,
  transitionWorkbook,
  workbookStage,
  type Workbook,
} from './workbook';
import {
  learningEvents,
  workbookOwner,
  workbookTraveler,
} from '../../../../tests/fixtures/origins-workbook';
class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}
const scope = (id = 'creation') => ({
  owner: workbookOwner,
  traveler: workbookTraveler,
  storyId: id,
  revision: 1,
});
describe('005 educational workbook, never official authority', () => {
  it.each(ORIGINS_LESSONS)(
    '$storyId reaches mandatory video only after exploration/reading/activity/quiz/reflection without issuing completion',
    (lesson) => {
      expect(lesson.scenes.length).toBeGreaterThanOrEqual(4);
      expect(lesson.readings.length).toBeGreaterThan(0);
      expect(lesson.quiz).toHaveLength(3);
      const state = replayWorkbook(lesson, learningEvents(lesson));
      expect(workbookStage(lesson, state)).toBe('video');
      expect(
        isStoryComplete(
          ORIGIN_STORIES.find((s) => s.id === lesson.storyId)!,
          undefined,
        ),
      ).toBe(false);
      expect(JSON.stringify(state)).not.toMatch(
        /reward_receipt|completed_at|video_completed|coins|"xp"/,
      );
      expect(
        lesson.scenes.every(
          (s) =>
            s.classification === 'INTERPRETATIVE' &&
            s.reference.startsWith('Gênesis'),
        ),
      ).toBe(true);
      expect(lesson.activity.classification).toBe('FICTIONAL');
    },
  );
  it('preserves nine worlds, five stable IDs, ordering and independent official progression', () => {
    expect(WORLDS).toHaveLength(9);
    expect(ORIGINS_LESSONS.map((l) => l.storyId)).toEqual(
      ORIGIN_STORIES.map((s) => s.id),
    );
    for (const s of ORIGIN_STORIES.slice(1))
      expect(storyStatus(s, workbookTraveler, [])).toBe('locked');
    expect(storyStatus(ORIGIN_STORIES[0], workbookTraveler, [])).toBe(
      'available',
    );
    expect(ORIGINS_LESSONS.every((l) => l.review === 'candidate')).toBe(true);
    expect(
      ORIGIN_STORIES.every(
        (s) => s.video.availability === 'missing' && !!videoBlocker(s.video),
      ),
    ).toBe(true);
  });
  it('rejects skipping reading, activity, quiz or reflection and rejects fake video/XP/results', () => {
    const lesson = ORIGINS_LESSONS[0],
      initial = emptyWorkbookState();
    for (const action of [
      { type: 'reading-confirm', chapter: 1 },
      { type: 'task', taskId: 'day-1', choice: '0' },
      {
        type: 'quiz-answer',
        questionId: lesson.quiz[0].id,
        optionId: lesson.quiz[0].correctOptionId,
      },
      { type: 'reflect' },
      { type: 'video-complete' },
      { type: 'reward', xp: 999 },
    ])
      expect(() => transitionWorkbook(lesson, initial, action)).toThrow();
    const visited = replayWorkbook(
      lesson,
      lesson.scenes.map((s) => ({ type: 'visit', sceneId: s.id })),
    );
    expect(() =>
      transitionWorkbook(lesson, visited, {
        type: 'reading-confirm',
        chapter: 1,
      }),
    ).toThrow();
  });
  it('mistakes explain learning without unlocking; retries shuffle every question with different correct positions', () => {
    const lesson = ORIGINS_LESSONS[0],
      activity = replayWorkbook(lesson, learningEvents(lesson, 'quiz'));
    const q = lesson.quiz[0],
      wrong = q.options.find((o) => o.id !== q.correctOptionId)!;
    const state = transitionWorkbook(lesson, activity, {
      type: 'quiz-answer',
      questionId: q.id,
      optionId: wrong.id,
    });
    expect(workbookStage(lesson, state)).toBe('quiz');
    const first = lessonQuiz(lesson, 1),
      next = lessonQuiz(lesson, 2);
    expect(
      new Set(
        first.map((q) =>
          q.options.findIndex((o) => o.id === q.correctOptionId),
        ),
      ).size,
    ).toBe(3);
    expect(first.map((q) => q.options.map((o) => o.id))).not.toEqual(
      next.map((q) => q.options.map((o) => o.id)),
    );
    for (const q of next)
      expect(new Set(q.options.map((o) => o.id)).size).toBe(4);
  });
  it('resumes only the same account/Traveler/revision and never imports old Garden success or other keys', () => {
    const storage = new MemoryStorage(),
      lesson = ORIGINS_LESSONS[0];
    storage.setItem(
      'legacy-garden-save',
      '{"gardenCompleted":true,"nextPhaseUnlocked":true}',
    );
    let book = readWorkbook(lesson, scope(), storage);
    for (const event of learningEvents(lesson, 'activity'))
      book = appendWorkbook(lesson, book, event, storage);
    expect(
      workbookStage(
        lesson,
        replayWorkbook(lesson, readWorkbook(lesson, scope(), storage).events),
      ),
    ).toBe('activity');
    expect(
      readWorkbook(
        lesson,
        { ...scope(), traveler: '10000000-0000-4000-8000-000000000006' },
        storage,
      ).events,
    ).toEqual([]);
    expect(
      readWorkbook(
        lesson,
        { ...scope(), owner: '00000000-0000-4000-8000-000000000006' },
        storage,
      ).events,
    ).toEqual([]);
    expect(storage.getItem('legacy-garden-save')).toContain('true');
  });
  it('deduplicates a scene, refuses stale tab writes and preserves corrupt original without overwriting', () => {
    const storage = new MemoryStorage(),
      lesson = ORIGINS_LESSONS[0],
      initial = readWorkbook(lesson, scope(), storage),
      event = { type: 'visit' as const, sceneId: lesson.scenes[0].id };
    const book = appendWorkbook(lesson, initial, event, storage);
    expect(appendWorkbook(lesson, book, event, storage).events).toHaveLength(1);
    expect(() => appendWorkbook(lesson, initial, event, storage)).toThrow(
      /outra aba/,
    );
    const key = [...storage.data.keys()][0],
      raw = '{"scope":null,"events":[],"completed_at":"fake"}';
    storage.setItem(key, raw);
    expect(() => readWorkbook(lesson, scope(), storage)).toThrow();
    expect(storage.getItem(key)).toBe(raw);
  });
  it('reflections have no score or saved text and reopening cannot produce an official video receipt', () => {
    const lesson = ORIGINS_LESSONS[0],
      state = replayWorkbook(lesson, learningEvents(lesson, 'reflection'));
    expect(() =>
      transitionWorkbook(lesson, state, {
        type: 'reflect',
        text: 'private confidence',
      }),
    ).toThrow();
    const book: Workbook = { scope: scope(), events: learningEvents(lesson) };
    expect(JSON.stringify(book)).not.toMatch(
      /private confidence|video_completed|completed_at|reward_receipt/,
    );
    expect(workbookStage(lesson, replayWorkbook(lesson, book.events))).toBe(
      'video',
    );
  });
});
