// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  type Traveler,
} from './domain/traveler';
const mocks = vi.hoisted(() => ({ current: null as Traveler | null }));
vi.mock('./components/shell', () => ({
  Shell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  RequireTraveler: ({
    children,
  }: {
    children: (traveler: Traveler) => React.ReactNode;
  }) => children(mocks.current!),
}));
vi.mock('./state/use-journey', () => ({
  useJourney: () => ({ status: 'ready', traveler: mocks.current }),
  updateTraveler: (update: (traveler: Traveler) => Traveler) => {
    mocks.current = update(mocks.current!);
  },
}));
vi.mock('./audio/audio-manager', () => ({
  gameAudio: { playEffect: vi.fn() },
}));
import { PhaseScreen } from './screens/phase';
beforeEach(() => {
  mocks.current = createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    'traveler-a',
    '2026-10-19T12:00:00Z',
  );
  Object.assign(mocks.current.progress, {
    gardenStep: 'quiz',
    gardenFragments: 3,
    devotionalCompleted: true,
  });
  Object.assign(mocks.current.progress.bibleReading, {
    genesis2Confirmed: true,
    genesis3Confirmed: true,
    comprehensionCompleted: true,
  });
});
afterEach(cleanup);
test('finishing the existing quiz reaches the mandatory video without granting legacy rewards', async () => {
  const inventory = structuredClone(mocks.current!.inventory);
  render(<PhaseScreen />);
  await waitFor(() =>
    expect(screen.getByText('Quiz bíblico · 1/5')).toBeVisible(),
  );
  for (let index = 0; index < 5; index++) {
    fireEvent.click(screen.getByRole('button', { name: /^A / }));
    fireEvent.click(screen.getByRole('button', { name: 'Próxima →' }));
  }
  expect(screen.getByText(/Aguardando seleção de um vídeo/)).toBeVisible();
  expect(mocks.current!.progress.gardenStep).toBe('video');
  expect(mocks.current!.progress.gardenCompleted).toBe(false);
  expect(mocks.current!.progress.gardenRewardGranted).toBe(false);
  expect(mocks.current!.xp).toBe(0);
  expect(mocks.current!.coins).toBe(0);
  expect(mocks.current!.inventory).toEqual(inventory);
  expect(
    screen.queryByRole('button', { name: /Concluir fase|Finalizar registro/ }),
  ).toBeNull();
});
