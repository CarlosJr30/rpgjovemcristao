// @vitest-environment jsdom
import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { TrainingQAProvider, TrainingQAControls } from './provider';
import { useTrainingTraveler } from './context';
import { setTraining } from '../../lib/training-qa/store';
const fixture = vi.hoisted(() => ({
  actor: '10000000-0000-4000-8000-000000000003',
  owner: '00000000-0000-4000-8000-000000000003',
  read: vi.fn(),
  journey: {
    status: 'ready',
    traveler: {
      id: '10000000-0000-4000-8000-000000000003',
      coins: 1234,
      inventory: [],
      equipped: {},
      avatar: {},
      chests: { common: 0, uncommon: 0, rare: 0, epic: 0, extraordinary: 0 },
    },
  },
}));
vi.mock('../journey/state/use-journey', () => ({
  useCanonicalJourney: () => fixture.journey,
}));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => ({ status: 'signedIn', user: { id: fixture.owner } }),
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getOnlineSessionRevision: () => 1,
}));
vi.mock('../../lib/training-qa/client', () => ({ readTraining: fixture.read }));
vi.mock('next/navigation', () => ({ usePathname: () => '/journey/shop' }));
function Probe() {
  const view = useTrainingTraveler();
  return (
    <>
      <TrainingQAControls />
      <output aria-label="Projected balance">
        {view?.coins ?? fixture.journey.traveler.coins}
      </output>
    </>
  );
}
const view = () => (
  <TrainingQAProvider>
    <Probe />
  </TrainingQAProvider>
);
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_ECONOMY_QA002', '1');
  setTraining(null);
  fixture.read.mockReset();
});
afterEach(() => {
  cleanup();
  setTraining(null);
  vi.unstubAllEnvs();
});
it('does not query or enable training when deployment flag is absent', () => {
  vi.stubEnv('NEXT_PUBLIC_ECONOMY_QA002', '');
  render(view());
  expect(fixture.read).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Projected balance').textContent).toBe('1234');
});
it('only a server designation makes the button visible; mode selection changes projection and exit restores it', async () => {
  fixture.read.mockResolvedValue({
    version: 1,
    qaOnly: true,
    enabled: true,
    actor: fixture.actor,
    activation: '00000000-0000-4000-8000-000000000101',
    expiresAt: '2099-01-01T00:00:00Z',
    coins: 10000,
    chests: 0,
    items: {},
    equipped: {},
    revision: 0,
    history: [],
  });
  render(view());
  const controls = await screen.findByText('Treino QA');
  expect(
    screen.queryByText(/Orçamento privado|Validade:|10000 moedas QA/),
  ).toBeNull();
  const details = controls.closest('details');
  expect(details?.open).toBe(false);
  fireEvent.click(controls);
  expect(details?.open).toBe(true);
  const enter = await screen.findByRole('button', {
    name: 'Ativar treino isolado',
  });
  expect(screen.getByLabelText('Projected balance').textContent).toBe('1234');
  await act(async () => fireEvent.click(enter));
  await waitFor(() =>
    expect(screen.getByLabelText('Projected balance').textContent).toBe(
      '10000',
    ),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Sair do treino isolado' }),
  );
  expect(screen.getByLabelText('Projected balance').textContent).toBe('1234');
  expect(fixture.journey.traveler.coins).toBe(1234);
  expect(fixture.read).toHaveBeenCalledTimes(2);
});
it('keeps a non-designated user on the canonical view without grant actions', async () => {
  fixture.read.mockResolvedValue(null);
  render(view());
  await waitFor(() => expect(fixture.read).toHaveBeenCalledOnce());
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByLabelText('Projected balance').textContent).toBe('1234');
});
