import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  ALL_STORIES,
  ORIGIN_STORIES,
  STORY_STEPS,
  WORLDS,
  type StoryVideo,
} from './catalog';
import {
  isStoryComplete,
  nextRequiredStep,
  nextStory,
  progressFor,
  storyStatus,
  videoBlocker,
  worldSummary,
  type StoryProgress,
} from './progression';

const travelerId = 'traveler-a';
const receipt = (id: string): StoryProgress => ({
  traveler_id: travelerId,
  story_id: id,
  completed_steps: [...STORY_STEPS],
  video_completed: true,
  reward_receipt: `receipt:${id}`,
  completed_at: '2026-10-19T12:00:00Z',
});
describe('campaign order and individual progression', () => {
  test('nine worlds and five Origins stories in the requested order, with stable Garden identity', () => {
    expect(WORLDS.map((world) => world.title)).toEqual([
      'As Origens',
      'Os Patriarcas',
      'Libertação',
      'Terra Prometida',
      'Reis e Profetas',
      'Exílio e Retorno',
      'Vida de Jesus',
      'Igreja Primitiva',
      'Apocalipse e Nova Criação',
    ]);
    expect(WORLDS.map((world) => world.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(ORIGIN_STORIES.map((story) => story.id)).toEqual([
      'creation',
      'garden-choice',
      'cain-abel',
      'noah-ark',
      'babel',
    ]);
    expect(new Set(ALL_STORIES.map((story) => story.id)).size).toBe(5);
    expect(ORIGIN_STORIES[1]).toMatchObject({
      minigameId: 'snake-chase',
      legacyRoute: '/journey/phases/o-jardim-e-a-escolha',
    });
    expect(WORLDS.slice(1).every((world) => world.stories.length === 0)).toBe(
      true,
    );
  });
  test('first story available; finishing it unlocks the next without Guild state', () => {
    expect(storyStatus(ORIGIN_STORIES[0], travelerId, [])).toBe('available');
    expect(storyStatus(ORIGIN_STORIES[1], travelerId, [])).toBe('locked');
    const records = [receipt('creation')];
    expect(storyStatus(ORIGIN_STORIES[1], travelerId, records)).toBe(
      'available',
    );
    expect(nextStory(travelerId, records)?.id).toBe('garden-choice');
  });
  test.each(STORY_STEPS)('cannot complete with missing %s receipt', (step) => {
    const row = receipt('creation');
    row.completed_steps = row.completed_steps.filter((value) => value !== step);
    expect(isStoryComplete(ORIGIN_STORIES[0], row)).toBe(false);
    expect(storyStatus(ORIGIN_STORIES[1], travelerId, [row])).toBe('locked');
  });
  test.each(['video', 'reward', 'completion'] as const)(
    'does not trust incomplete %s',
    (missing) => {
      const row = receipt('creation');
      if (missing === 'video') row.video_completed = false;
      if (missing === 'reward') row.reward_receipt = null;
      if (missing === 'completion') row.completed_at = null;
      expect(isStoryComplete(ORIGIN_STORIES[0], row)).toBe(false);
    },
  );
  test('cross-traveler records neither disclose progress nor unlock stories', () => {
    const row = receipt('creation');
    expect(progressFor('creation', 'traveler-b', [row])).toBeUndefined();
    expect(storyStatus(ORIGIN_STORIES[1], 'traveler-b', [row])).toBe('locked');
    expect(worldSummary(WORLDS[0], 'traveler-b', [row]).percent).toBe(0);
  });
  test('completed stories remain revisitable and completion counts once on replay', () => {
    const row = receipt('creation');
    const repeated = [row, row];
    expect(storyStatus(ORIGIN_STORIES[0], travelerId, repeated)).toBe(
      'completed',
    );
    expect(worldSummary(WORLDS[0], travelerId, repeated)).toMatchObject({
      percent: 20,
      completed: 1,
    });
  });
  test('empty future worlds never become completed or playable', () => {
    const records = ORIGIN_STORIES.map((story) => receipt(story.id));
    expect(worldSummary(WORLDS[0], travelerId, records)).toMatchObject({
      percent: 100,
      status: 'completed',
    });
    expect(worldSummary(WORLDS[1], travelerId, records)).toMatchObject({
      percent: 0,
      status: 'locked',
    });
  });
  test('resume selects the first missing activity and never requires a leader', () => {
    const row = {
      ...receipt('creation'),
      completed_steps: [
        'explore',
        'reading',
      ] as StoryProgress['completed_steps'],
      video_completed: false,
      reward_receipt: null,
      completed_at: null,
    };
    expect(nextRequiredStep(ORIGIN_STORIES[0], row)).toBe('activity');
    row.completed_steps = [
      'explore',
      'reading',
      'activity',
      'quiz',
      'reflection',
    ];
    expect(nextRequiredStep(ORIGIN_STORIES[0], row)).toBe('video');
  });
  test('SQL proposal has exactly the same story IDs/order; catalog cannot silently drift', () => {
    const sql = readFileSync(
      'packages/database/proposals/task0081-story-progress.sql',
      'utf8',
    );
    const seeds = [...sql.matchAll(/\('([a-z-]+)','origins',(\d)\)/g)].map(
      (match) => [match[1], Number(match[2])],
    );
    expect(seeds).toEqual(
      ORIGIN_STORIES.map((story) => [story.id, story.order]),
    );
  });
});
describe('mandatory video dependencies', () => {
  const video = (): StoryVideo => ({
    ...ORIGIN_STORIES[0].video,
    provider: 'youtube',
    externalId: 'abcdefghijk',
    availability: 'available',
    source: 'Synthetic test fixture',
    author: 'Test author',
    verification: 'provider-api',
    embedding: 'allowed' as const, editorialReview: {status:'approved' as const,reference:'test-fixture-only'}, durationSeconds:75, captions:'fixture', accessibleAlternative:'fixture',
    authorization: {
      status: 'approved',
      terms: 'synthetic test only',
      evidence: 'fixture',
    },
  });
  test('all real story videos remain pending without fabricated links or permissions', () => {
    for (const story of ALL_STORIES) {
      expect(videoBlocker(story.video)).toContain('Aguardando');
      expect(story.video.url).toBeNull();
      expect(story.video.externalId).toBeNull();
    }
  });
  test('requires availability, authorization, provenance and a verification mechanism', () => {
    expect(videoBlocker(video())).toBeNull();
    expect(videoBlocker({ ...video(), availability: 'unavailable' })).toContain(
      'indisponível',
    );
    expect(videoBlocker({ ...video(), source: null })).toContain('autorização');
    expect(
      videoBlocker({
        ...video(),
        authorization: { status: 'pending', terms: null, evidence: null },
      }),
    ).toContain('autorização');
    expect(videoBlocker({ ...video(), verification: 'none' })).toContain(
      'não permite',
    );
  });
});
