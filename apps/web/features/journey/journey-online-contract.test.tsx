// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const { command, update } = vi.hoisted(() => ({
  command: vi.fn(),
  update: vi.fn(),
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
}));
vi.mock('./state/use-journey', () => ({
  runOnlineJourneyAction: command,
  updateTraveler: update,
}));
import { ReadingComprehension } from './components/bible-reading';
import { Devotional } from './components/devotional';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
import { comprehensionQuestions } from './data/reading-comprehension';
const traveler = createTraveler(
  'Sintetico',
  DEFAULT_APPEARANCE,
  '11111111-1111-4111-8111-111111111111',
  '2026-10-17T00:00:00.000Z',
);
beforeEach(() => {
  command.mockReset();
  command.mockResolvedValue({});
  update.mockReset();
});
afterEach(() => cleanup());
test('comprehension submits actual selected answers and waits for server confirmation', async () => {
  const done = vi.fn();
  render(<ReadingComprehension traveler={traveler} onComplete={done} />);
  for (const q of comprehensionQuestions)
    fireEvent.click(screen.getByRole('radio', { name: q.options[0].text }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Concluir checkpoint →' }),
  );
  await waitFor(() => expect(done).toHaveBeenCalledTimes(1));
  expect(command).toHaveBeenCalledWith({
    type: 'comprehension',
    answers: {
      care: 'cultivate',
      orientation: 'freedom-limit',
      consequence: 'rupture',
    },
  });
  expect(update).not.toHaveBeenCalled();
});
test('a rejected devotional command neither advances nor grants client-side resources', async () => {
  command.mockRejectedValue(Error('server unavailable'));
  const done = vi.fn();
  render(<Devotional traveler={traveler} onComplete={done} />);
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Reflexão sintética.' },
  });
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Salvar reflexão e continuar para a Missão →',
    }),
  );
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível'),
  );
  expect(command).toHaveBeenCalledWith({
    type: 'devotional',
    reflection: 'Reflexão sintética.',
  });
  expect(done).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});
