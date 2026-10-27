// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
const m = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('./state/use-journey', () => ({ updateTraveler: m.save }));
// This tests callback wiring only. Real movement/victory remain browser gates.
vi.mock('./components/snake-chase-game', () => ({
  SnakeChaseGame: ({
    onComplete,
    onTutorialComplete,
    tutorialCompleted,
    completionLabel,
  }: {
    onComplete: () => void;
    onTutorialComplete: () => void;
    tutorialCompleted: boolean;
    completionLabel: string;
  }) => (
    <section>
      <p>{tutorialCompleted ? 'memory tutorial' : 'new tutorial'}</p>
      <button onClick={onTutorialComplete}>Tutorial callback</button>
      <button onClick={onComplete}>{completionLabel}</button>
    </section>
  ),
}));
import { MinigamePractice } from './screens/minigame-practice';
afterEach(() => {
  cleanup();
  m.save.mockClear();
});
test('completion and replay callbacks never persist tutorial, progression or rewards', () => {
  const source = createTraveler(
      'Lia',
      DEFAULT_APPEARANCE,
      'hero',
      '2026-10-27T10:00:00Z',
    ),
    before = structuredClone(source);
  const view = render(<MinigamePractice traveler={source} />);
  expect(screen.getByText('new tutorial')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Tutorial callback' }));
  expect(screen.getByText('memory tutorial')).toBeVisible();
  fireEvent.click(
    screen.getByRole('button', { name: 'Encerrar demonstração →' }),
  );
  expect(
    screen.getByRole('region', { name: 'Resultado demonstrativo' }),
  ).toBeVisible();
  expect(m.save).not.toHaveBeenCalled();
  expect(source).toEqual(before);
  fireEvent.click(
    screen.getByRole('button', { name: 'Jogar outra demonstração' }),
  );
  expect(screen.getByText('memory tutorial')).toBeVisible();
  view.unmount();
  render(<MinigamePractice traveler={source} />);
  expect(screen.getByText('new tutorial')).toBeVisible();
  expect(source).toEqual(before);
  expect(m.save).not.toHaveBeenCalled();
});
