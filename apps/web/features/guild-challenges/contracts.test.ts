import { expect, test } from 'vitest';
import { parseChallengeWorkspace } from './contracts';
const base = () => ({
  version: 1,
  guildId: 'guild',
  offset: 0,
  leader: false,
  economicRewardsEnabled: false,
  event: {
    id: 'event',
    status: 'running',
    revision: 3,
    ruleVersion: 1,
    manualIds: [],
  },
  events: [],
  questions: [],
  teams: [],
  roster: [],
  members: [],
  meetings: [],
  manualActivities: [],
  history: [],
  myResult: null,
  latestPractice: null,
  board: null,
});
test('rejects a response from another Guild or previously selected event', () => {
  expect(() => parseChallengeWorkspace(base(), 'other', 'event')).toThrow();
  expect(() => parseChallengeWorkspace(base(), 'guild', 'old-event')).toThrow();
});
test.each(['answerKey', 'feedback'])(
  'rejects early protected %s for both participant and leader',
  (key) => {
    for (const leader of [false, true])
      expect(() =>
        parseChallengeWorkspace(
          {
            ...base(),
            leader,
            questions: [
              {
                prompt: 'Technical fixture',
                options: ['A', 'B', 'C', 'D'],
                difficulty: 'easy',
                [key]: key === 'answerKey' ? 0 : 'Protected explanation',
              },
            ],
          },
          'guild',
          'event',
        ),
      ).toThrow();
  },
);
test.each(['board', 'myResult', 'latestPractice'])(
  'rejects early score or result channel %s',
  (key) => {
    const value =
      key === 'board'
        ? { persons: [], teams: [] }
        : { score: 7, choices: [0, 0, 0, 0, 0, 0, 0], ruleVersion: 1 };
    expect(() =>
      parseChallengeWorkspace({ ...base(), [key]: value }, 'guild', 'event'),
    ).toThrow();
  },
);
test('accepts running questions with no key, score or explanation', () => {
  expect(
    parseChallengeWorkspace(
      {
        ...base(),
        questions: [
          {
            prompt: 'Technical fixture',
            options: ['A', 'B', 'C', 'D'],
            difficulty: 'easy',
          },
        ],
      },
      'guild',
      'event',
    ).board,
  ).toBeNull();
});
test('rejects unexpected economic enablement', () => {
  expect(() =>
    parseChallengeWorkspace(
      { ...base(), economicRewardsEnabled: true },
      'guild',
      'event',
    ),
  ).toThrow();
});
