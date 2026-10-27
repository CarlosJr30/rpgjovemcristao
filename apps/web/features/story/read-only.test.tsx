// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { JourneyReadView } from './read-only';
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
afterEach(cleanup);
const snapshot = () => ({
  traveler: createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    'hero',
    '2026-10-27T10:00:00Z',
  ),
  inventory: [],
  persistedProgress: false,
});
test('preserves nine worlds and exposes only consultation links', () => {
  render(<JourneyReadView snapshot={snapshot()} records={[]} />);
  expect(
    within(screen.getByRole('list', { name: 'Mundos bíblicos' })).getAllByRole(
      'listitem',
    ),
  ).toHaveLength(9);
  expect(
    screen
      .getAllByRole('link')
      .every(
        (a) =>
          !/phases|equipment|shop|arena/.test(a.getAttribute('href') ?? ''),
      ),
  ).toBe(true);
  expect(screen.queryAllByRole('button')).toHaveLength(0);
});
test('legacy completion does not fabricate five story completions', () => {
  const s = snapshot();
  s.persistedProgress = true;
  s.traveler.progress.gardenCompleted = true;
  render(<JourneyReadView snapshot={s} records={[]} worldId="origins" />);
  expect(
    within(
      screen.getByRole('list', { name: 'Histórias de As Origens' }),
    ).getAllByRole('listitem'),
  ).toHaveLength(5);
  expect(screen.getAllByText(/Conclusão não registrada/)).toHaveLength(5);
  expect(screen.getByText(/fase concluída no histórico legado/)).toBeVisible();
});
test('unavailable worlds have no invented phases or activity controls', () => {
  render(
    <JourneyReadView snapshot={snapshot()} records={[]} worldId="patriarchs" />,
  );
  expect(
    screen.getByText(/As histórias deste mundo ainda estão em preparação/),
  ).toBeVisible();
  expect(screen.queryByRole('list')).toBeNull();
});
test('story consultation shows objectives and gates without starting gameplay', () => {
  render(
    <JourneyReadView
      snapshot={snapshot()}
      records={[]}
      storyId="garden-choice"
    />,
  );
  expect(
    screen.getByRole('region', { name: 'Objetivos e requisitos' }),
  ).toBeVisible();
  expect(screen.getByText(/Conclusão bloqueada/)).toBeVisible();
  expect(screen.queryAllByRole('button')).toHaveLength(0);
  expect(screen.queryByRole('textbox')).toBeNull();
});
