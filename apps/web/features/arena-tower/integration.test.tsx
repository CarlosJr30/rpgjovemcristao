// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { cards, ids } from '../../../../tests/fixtures/arena-deck';
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { arenaDeckStorage } from '../arena-deck/storage';
import { TowerExperience } from './screen';
const spies = vi.hoisted(() => ({ grant: vi.fn(), history: vi.fn() }));
vi.mock('../journey/components/arena-stage', () => ({
  ArenaStage: () => <p>Campo de batalha reutilizado</p>,
  FighterPortrait: () => null,
}));
vi.mock('../journey/hooks/use-battle-presentation', () => ({
  useBattlePresentation: () => ({
    display: null,
    event: null,
    busy: false,
    phase: 'anticipation',
    cancel: vi.fn(),
    play: (_a: unknown, _b: unknown, done: () => void) => {
      done();
      return true;
    },
  }),
}));
vi.mock('../journey/state/use-journey', () => ({
  updateTraveler: spies.grant,
}));
vi.mock('../../lib/supabase/online-sync', () => ({
  getCurrentOnlineUserId: () => 'owner',
  canUseTravelerInCurrentSession: () => true,
}));
vi.mock('../journey/persistence/journey-storage', () => ({
  journeyRepository: {
    listSaved: () => [],
    load: () => ({ status: 'ready', traveler: hero }),
  },
}));
vi.mock('../journey/persistence/arena-storage', () => ({
  arenaRepository: {
    list: () => [],
    has: () => false,
    rewardedToday: () => 0,
    add: spies.history,
  },
}));
const hero = {
  ...createTraveler(
    'Lia',
    DEFAULT_APPEARANCE,
    'player',
    '2026-10-20T12:00:00Z',
  ),
  level: 8,
  attributes: { life: 40, strength: 50, defense: 30, wisdom: 20 },
};
const source = async () => cards;
beforeEach(() => {
  localStorage.clear();
  spies.grant.mockClear();
  spies.history.mockClear();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
  const queues = new Map<string, Promise<unknown>>();
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (k: string, _o: object, fn: () => unknown) => {
        const r = (queues.get(k) ?? Promise.resolve()).then(fn);
        queues.set(
          k,
          r.catch(() => undefined),
        );
        return r;
      },
    },
  });
});
afterEach(cleanup);
test('real map keeps seven, first available but empty catalog blocks product without grants', async () => {
  render(
    <TowerExperience
      ownerId="owner"
      traveler={hero}
      collectionSource={async () => []}
    />,
  );
  await screen.findByText('Torre local: 0/7 desafios concluídos.');
  const map = screen.getByRole('list', { name: 'Sete andares da Torre' });
  expect(within(map).getAllByRole('listitem')).toHaveLength(7);
  expect(
    screen.getByRole('button', { name: 'Entrar no andar' }),
  ).toBeDisabled();
  expect(
    screen.getAllByRole('button', { name: 'Andar bloqueado' }),
  ).toHaveLength(6);
  expect(screen.getByText('Progresso local, não oficial.')).toBeVisible();
  expect(spies.grant).not.toHaveBeenCalled();
});
test('ArenaExperience tower finishes without common economic grant even with active account; next floor only', async () => {
  await arenaDeckStorage.save('owner', 'player', cards, ids);
  const view = render(
    <TowerExperience
      ownerId="owner"
      traveler={hero}
      collectionSource={source}
    />,
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Entrar no andar' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Iniciar batalha' }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar batalha' }));
  const actions = await screen.findByRole('group', {
    name: 'Ações da batalha',
  });
  expect(within(actions).getAllByRole('button')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'ATACAR' }));
  await screen.findByText(/Resultado demonstrativo registrado/);
  expect(spies.grant).not.toHaveBeenCalled();
  expect(spies.history).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à Torre' }));
  await screen.findByText('Torre local: 1/7 desafios concluídos.');
  expect(
    screen.getAllByRole('button', { name: 'Andar bloqueado' }),
  ).toHaveLength(5);
  view.unmount();
  render(
    <TowerExperience
      ownerId="owner"
      traveler={hero}
      collectionSource={source}
    />,
  );
  await waitFor(() =>
    expect(
      screen.getByText('Torre local: 1/7 desafios concluídos.'),
    ).toBeVisible(),
  );
  expect(spies.grant).not.toHaveBeenCalled();
});
