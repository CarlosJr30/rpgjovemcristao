// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { cards, ids } from '../../../../tests/fixtures/arena-deck';
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { arenaDeckStorage } from './storage';
vi.mock('../journey/components/arena-stage', () => ({
  ArenaStage: () => <p>Campo de treino existente</p>,
  FighterPortrait: () => null,
}));
vi.mock('../journey/hooks/use-battle-presentation', () => ({
  useBattlePresentation: () => ({
    display: null,
    event: null,
    busy: false,
    phase: 'anticipation',
    cancel: vi.fn(),
    play: (_b: unknown, _a: unknown, done: () => void) => {
      done();
      return true;
    },
  }),
}));
import { ArenaExperience } from '../journey/screens/arena';
const traveler = createTraveler(
  'Lia',
  DEFAULT_APPEARANCE,
  'player',
  '2026-10-20T12:00:00Z',
);
const source = async () => cards;
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: false,addEventListener:vi.fn(),removeEventListener:vi.fn() }),
  });
  let tail = Promise.resolve<unknown>(undefined);
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (_n: string, _o: object, fn: () => unknown) => {
        const result = tail.then(fn);
        tail = result.catch(() => undefined);
        return result;
      },
    },
  });
});
afterEach(cleanup);
test('real Arena integration blocks an empty collection without granting cards', async () => {
  render(
    <ArenaExperience
      traveler={traveler}
      ownerId="owner"
      collectionSource={async () => []}
    />,
  );
  await screen.findByText('Cartas selecionadas: 0/7');
  fireEvent.click(screen.getByRole('button', { name: /Davi, o Aprendiz/ }));
  expect(
    screen.getByRole('button', { name: 'Iniciar batalha' }),
  ).toBeDisabled();
});
test('real Arena starts with saved7, commits one rapid action, remount resumes same identity and used card', async () => {
  await arenaDeckStorage.save('owner', 'player', cards, ids);
  const view = render(
    <ArenaExperience
      traveler={traveler}
      ownerId="owner"
      collectionSource={source}
    />,
  );
  await screen.findByText('Cartas selecionadas: 7/7');
  fireEvent.click(screen.getByRole('button', { name: /Davi, o Aprendiz/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar batalha' }));
  await screen.findByRole('button', { name: 'Usar carta Carta de teste 1' });
  const before = arenaDeckStorage.load('owner', 'player', cards).battle!;
  const button = screen.getByRole('button', {
    name: 'Usar carta Carta de teste 1',
  });
  fireEvent.click(button);
  fireEvent.click(button);
  await waitFor(() => expect(screen.getByText('USADA')).toBeInTheDocument());
  view.unmount();
  render(
    <ArenaExperience
      traveler={traveler}
      ownerId="owner"
      collectionSource={source}
    />,
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Usar carta Carta de teste 1' }),
    ).toBeDisabled(),
  );
  expect(arenaDeckStorage.load('owner', 'player', cards).battle?.id).toBe(
    before.id,
  );
  expect(arenaDeckStorage.load('owner', 'player', cards).battle?.round).toBe(
    before.round + 1,
  );
});
