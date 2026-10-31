// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ load: vi.fn(), command: vi.fn() }));
vi.mock('../../lib/supabase/repositories/guild-challenge-repository', () => ({
  guildChallengeRepository: mocks,
  ChallengeRejected: class extends Error {},
}));
import { GuildChallenges } from './panel';
afterEach(cleanup);
const frame = (closed = false) => ({
  version: 1,
  guildId: 'guild',
  leader: false,
  offset: 0,
  economicRewardsEnabled: false,
  events: [
    {
      id: 'event',
      title: 'Technical exercise',
      mode: 'individual',
      status: closed ? 'closed' : 'running',
      revision: 4,
    },
  ],
  event: {
    id: 'event',
    title: 'Technical exercise',
    description: '',
    theme: '',
    reference: '',
    criteria: 'Seven responses',
    mode: 'individual',
    status: closed ? 'closed' : 'running',
    revision: 4,
    ruleVersion: 1,
    meetingId: null,
    startsAt: '2026-10-31T00:00:00Z',
    endsAt: '2026-11-01T00:00:00Z',
    manualIds: [],
    canAnswer: !closed,
    canPractice: closed,
    enrolment: 'accepted',
    progressReceived: 1,
    eligibleCount: 1,
  },
  questions: Array.from({ length: 7 }, (_, i) => ({
    prompt: `Technical question ${i + 1}`,
    options: ['First', 'Second', 'Third', 'Fourth'],
    difficulty: 'easy',
    reference: '',
    ...(closed ? { answerKey: 0, feedback: 'Educational explanation' } : {}),
  })),
  teams: [],
  roster: [],
  myResult: closed
    ? {
        choices: [1, 1, 1, 1, 1, 1, 1],
        score: 0,
        submittedAt: '2026-10-31T01:00:00Z',
        ruleVersion: 1,
        practiceCount: 0,
      }
    : null,
  latestPractice: null,
  board: null,
  members: [],
  meetings: [],
  manualActivities: [],
  history: [],
});
test('official confirmation sends seven choices only; protected explanation and leader controls stay absent', async () => {
  const w = frame();
  mocks.load.mockImplementation(async (_a, _g, event) => ({
    ...w,
    event: event ? w.event : null,
    questions: event ? w.questions : [],
  }));
  mocks.command.mockResolvedValue({});
  render(<GuildChallenges actor="actor" guildId="guild" />);
  fireEvent.change(
    await screen.findByRole('combobox', {
      name: 'Gincana selecionada',
    }),
    {
      target: { value: 'event' },
    },
  );
  const form = await screen.findByRole('form', { name: 'Respostas oficiais' });
  for (const group of within(form).getAllByRole('group'))
    fireEvent.click(within(group).getAllByRole('radio')[0]);
  expect(screen.queryByText('Educational explanation')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Criar gincana' }),
  ).not.toBeInTheDocument();
  fireEvent.submit(form);
  await waitFor(() =>
    expect(mocks.command).toHaveBeenCalledWith(
      'actor',
      'guild',
      'answer',
      'event',
      1,
      { choices: [0, 0, 0, 0, 0, 0, 0] },
      expect.any(String),
    ),
  );
});
test('learning uses its own action and preserves the displayed official first result', async () => {
  const w = frame(true);
  mocks.load.mockImplementation(async (_a, _g, event) => ({
    ...w,
    event: event ? w.event : null,
    questions: event ? w.questions : [],
    myResult: event ? w.myResult : null,
  }));
  mocks.command.mockResolvedValue({});
  render(<GuildChallenges actor="actor" guildId="guild" />);
  fireEvent.change(
    await screen.findByRole('combobox', {
      name: 'Gincana selecionada',
    }),
    {
      target: { value: 'event' },
    },
  );
  const form = await screen.findByRole('form', { name: 'Tentativa educativa' });
  for (const group of within(form).getAllByRole('group'))
    fireEvent.click(within(group).getAllByRole('radio')[0]);
  fireEvent.submit(form);
  await waitFor(() =>
    expect(mocks.command).toHaveBeenCalledWith(
      'actor',
      'guild',
      'practice',
      'event',
      1,
      { choices: [0, 0, 0, 0, 0, 0, 0] },
      expect.any(String),
    ),
  );
  expect(
    screen.getByText(/Resultado oficial recebido e preservado: 0\/7/),
  ).toBeInTheDocument();
});
