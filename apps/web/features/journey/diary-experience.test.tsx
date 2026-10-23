// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
import { diaryView } from './data/diaryView';
import { DiaryScreen } from './screens/diary';

let currentTraveler = createTraveler(
  'Lia',
  DEFAULT_APPEARANCE,
  'lia',
  '2026-10-06T12:00:00Z',
);
const saveParticipation = vi.hoisted(() => vi.fn());
vi.mock('./components/shell', () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RequireTraveler: ({
    children,
  }: {
    children: (t: typeof currentTraveler) => React.ReactNode;
  }) => children(currentTraveler),
}));
vi.mock('./state/use-journey', () => ({ saveDiaryEntry: saveParticipation }));
beforeEach(() => {
  currentTraveler = createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    'lia',
    '2026-10-06T12:00:00Z',
  );
  saveParticipation.mockReset();
});
afterEach(cleanup);
it('keeps empty records honest and uses the central reading gate', () => {
  currentTraveler.progress.gardenStep = 'reward';
  currentTraveler.progress.quizAttemptId = 2;
  const view = diaryView(currentTraveler);
  expect(view.step).toBe('reading');
  expect(view.quizCompleted).toBe(false);
  expect(view.dated).toEqual([]);
  expect(view.milestones).toEqual([]);
  expect(view.lastDated).toBeNull();
  render(<DiaryScreen />);
  expect(screen.getByText('Leia Gênesis 2–3')).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.getByText(/Nenhum evento com data/)).toBeInTheDocument();
});
it('sorts only real timestamps, never dates completion from opening, and does not mutate saves', () => {
  const p = currentTraveler.progress;
  p.bibleReading = {
    genesis2Opened: '2026-10-02T12:00:00Z',
    genesis2Confirmed: true,
    genesis3Opened: 'invalid-date',
    genesis3Confirmed: true,
    comprehensionCompleted: true,
  };
  p.devotionalCompleted = true;
  p.gardenStep = 'done';
  p.gardenCompleted = true;
  p.gardenRewardGranted = true;
  p.guildChallengeStatus = 'completed';
  p.guildChallengeSubmittedAt = '2026-10-03T12:00:00Z';
  p.guildChallengeValidatedAt = '2026-10-04T12:00:00Z';
  p.guildRewardClaimed = true;
  const before = structuredClone(currentTraveler),
    view = diaryView(currentTraveler);
  expect(view.dated.map((e) => e.id)).toEqual([
    'guild-validated',
    'guild-submitted',
    'open-genesis-2',
  ]);
  expect(
    view.milestones.find((e) => e.id === 'confirm-genesis-2')?.date,
  ).toBeNull();
  expect(view.quizCompleted).toBe(true);
  const events = [...view.dated, ...view.milestones];
  expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
  expect(currentTraveler).toEqual(before);
});
it('keeps private reflection collapsed, escapes markup and closes it for another traveler', () => {
  currentTraveler.progress.devotionalReflection =
    '<script>private-test</script>';
  currentTraveler.progress.devotionalCompleted = true;
  const { container, rerender } = render(<DiaryScreen />);
  expect(screen.getByText('<script>private-test</script>')).not.toBeVisible();
  const details = screen
    .getByText('Ver minha reflexão privada')
    .closest('details')!;
  fireEvent.click(screen.getByText('Ver minha reflexão privada'));
  expect(details).toHaveAttribute('open');
  expect(container.querySelector('script')).toBeNull();
  currentTraveler = createTraveler(
    'Noemi',
    DEFAULT_APPEARANCE,
    'noemi',
    '2026-10-06T12:00:00Z',
  );
  currentTraveler.progress.devotionalReflection = 'Outra reflexão de teste';
  rerender(<DiaryScreen />);
  expect(
    screen.queryByText('<script>private-test</script>'),
  ).not.toBeInTheDocument();
  expect(screen.getByText('Outra reflexão de teste')).not.toBeVisible();
});
it('registers participation once per visit and reports failure honestly', () => {
  saveParticipation.mockReturnValueOnce(false).mockReturnValue(true);
  render(<DiaryScreen />);
  const button = screen.getByRole('button', { name: 'Registrar participação' });
  fireEvent.click(button);
  expect(screen.getByRole('status')).toHaveTextContent('Não foi possível');
  expect(button).toBeEnabled();
  fireEvent.click(button);
  fireEvent.click(button);
  expect(saveParticipation).toHaveBeenCalledTimes(2);
  expect(button).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Nenhum texto novo foi salvo',
  );
});
it.each([
  'submitted',
  'awaiting-validation',
  'revision-requested',
  'reward-available',
  'completed',
] as const)(
  'shows the saved Guild state %s without changing its gate',
  (status) => {
    currentTraveler.progress.gardenCompleted = true;
    currentTraveler.progress.guildChallengeStatus = status;
    render(<DiaryScreen />);
    expect(
      screen.getByRole('link', { name: /Modo História · ver mundos/ }),
    ).toHaveAttribute('href', '/journey');
    expect(
      screen.getByText(
        diaryView(currentTraveler).guildStatus +
          ' · Atividade da Guilda independente do Modo História.',
      ),
    ).toBeInTheDocument();
  },
);
