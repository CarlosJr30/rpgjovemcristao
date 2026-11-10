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
import { getArenaCardCatalog } from '@rpg/game-engine';
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { arenaDeckStorage } from '../arena-deck/storage';
import { arenaRepository } from '../journey/persistence/arena-storage';
import { journeyRepository } from '../journey/persistence/journey-storage';
const m = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../journey/state/use-journey', () => ({ updateTraveler: m.update }));
vi.mock('../journey/components/arena-stage', () => ({
  ArenaStage: () => null,
  FighterPortrait: () => null,
}));
vi.mock('../journey/hooks/use-game-audio', () => ({ useAudioScene: () => {} }));
vi.mock('../journey/audio/arena-audio', () => ({ emitArenaSound: () => {} }));
vi.mock('../journey/hooks/use-battle-presentation', () => ({
  useBattlePresentation: () => ({
    display: null,
    event: null,
    busy: false,
    phase: 'anticipation',
    cancel: () => {},
    play: (_before: unknown, _after: unknown, done: () => void) => {
      done();
      return true;
    },
  }),
}));
import { ArenaExperience } from '../journey/screens/arena';
const cards = getArenaCardCatalog().slice(0, 7),
  ids = cards.map((c) => c.id);
// Isolated synthetic fighter only; never sent to hosted storage or a player account.
const hero = {
  ...createTraveler(
    'Fixture',
    DEFAULT_APPEARANCE,
    'fixture-player',
    '2026-11-01T00:00:00Z',
  ),
  attributes: { life: 20, strength: 20, defense: 8, wisdom: 8 },
};
beforeEach(() => {
  localStorage.clear();
  m.update.mockReset();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
  let tail = Promise.resolve<unknown>(undefined);
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: (_key: string, _options: object, fn: () => unknown) => {
        const next = tail.then(fn);
        tail = next.catch(() => undefined);
        return next;
      },
    },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test('local practice opens the shared seven-card layer inside the combat viewport without playing a turn', async () => {
  await arenaDeckStorage.save('owner', hero.id, cards, ids);
  render(
    <ArenaExperience
      traveler={hero}
      ownerId="owner"
      collectionSource={async () => cards}
      practiceOnly
    />,
  );
  await screen.findByText('Cartas selecionadas: 7/7');
  fireEvent.click(screen.getByRole('button', { name: /Davi, o Aprendiz/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar batalha' }));
  const trigger = await screen.findByRole('button', { name: 'CARTAS' });
  const before = JSON.stringify(
    arenaDeckStorage.load('owner', hero.id, cards).battle,
  );
  fireEvent.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Escolha uma carta' });
  expect(dialog.closest('[data-combat-overlay]')).toContainElement(trigger);
  expect(screen.getAllByRole('article', { name: /^Carta:/ })).toHaveLength(7);
  expect(
    JSON.stringify(arenaDeckStorage.load('owner', hero.id, cards).battle),
  ).toBe(before);
});
test('practice victory and reload never settle rewards, mutate traveler or add legacy records', async () => {
  const source = vi.fn(async () => cards),
    record = vi.spyOn(arenaRepository, 'add'),
    saved = vi.spyOn(journeyRepository, 'listSaved'),
    claim = vi.spyOn(arenaDeckStorage, 'claimSettlement');
  const before = JSON.stringify(hero);
  await arenaDeckStorage.save('owner', hero.id, cards, ids);
  const view = render(
    <ArenaExperience
      traveler={hero}
      ownerId="owner"
      collectionSource={source}
      practiceOnly
    />,
  );
  await screen.findByText('Cartas selecionadas: 7/7');
  fireEvent.click(screen.getByRole('button', { name: /Davi, o Aprendiz/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar batalha' }));
  await screen.findByRole('group', { name: 'Ações da batalha' });
  for (let i = 0; i < 12; i++) {
    const b = arenaDeckStorage.load('owner', hero.id, cards).battle!;
    if (b.status === 'finished') break;
    fireEvent.click(screen.getByRole('button', { name: 'ATACAR' }));
    await waitFor(() => {
      const after = arenaDeckStorage.load('owner', hero.id, cards).battle!;
      expect(after.status === 'finished' || after.round > b.round).toBe(true);
    });
  }
  await screen.findByText(/Resultado demonstrativo local/);
  expect(arenaDeckStorage.load('owner', hero.id, cards).battle?.winnerId).toBe(
    hero.id,
  );
  view.unmount();
  render(
    <ArenaExperience
      traveler={hero}
      ownerId="owner"
      collectionSource={source}
      practiceOnly
    />,
  );
  await screen.findByText(/Resultado demonstrativo local/);
  expect(source.mock.calls.length).toBeGreaterThan(2);
  expect(record).not.toHaveBeenCalled();
  expect(claim).not.toHaveBeenCalled();
  expect(saved).not.toHaveBeenCalled();
  expect(m.update).not.toHaveBeenCalled();
  expect(JSON.stringify(hero)).toBe(before);
});
test('practice refuses start with no possessed cards rather than issuing a starter', async () => {
  render(
    <ArenaExperience
      traveler={hero}
      ownerId="owner"
      collectionSource={async () => []}
      practiceOnly
    />,
  );
  await screen.findByText('Cartas selecionadas: 0/7');
  fireEvent.click(screen.getByRole('button', { name: /Davi, o Aprendiz/ }));
  expect(
    screen.getByRole('button', { name: 'Iniciar batalha' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Iniciar batalha' }),
  ).toHaveAccessibleDescription(/Você possui 0\/7 cartas/);
  expect(
    screen
      .getAllByRole('link', { name: 'Meu Baralho' })
      .some((link) => link.getAttribute('href') === '/journey/arena/deck'),
  ).toBe(true);
  expect(m.update).not.toHaveBeenCalled();
});

test('owned but unselected cards explain how to prepare seven without starting a battle', async () => {
  render(
    <ArenaExperience
      traveler={hero}
      ownerId="owner"
      collectionSource={async () => cards}
      practiceOnly
    />,
  );
  await screen.findByText('Cartas selecionadas: 0/7');
  fireEvent.click(screen.getByRole('button', { name: /Noemi/ }));
  const start = screen.getByRole('button', { name: 'Iniciar batalha' });
  expect(start).toBeDisabled();
  expect(start).toHaveAccessibleDescription(
    /Selecione e salve sete cartas próprias distintas/,
  );
  expect(arenaDeckStorage.load('owner', hero.id, cards).battle).toBeNull();
});

test('fresh ownership failure is displayed beside start and never creates a battle', async () => {
  await arenaDeckStorage.save('owner', hero.id, cards, ids);
  const source = vi
    .fn()
    .mockResolvedValueOnce(cards)
    .mockRejectedValueOnce(new Error('Sua coleção não pôde ser confirmada.'));
  render(
    <ArenaExperience
      traveler={hero}
      ownerId="owner"
      collectionSource={source}
      practiceOnly
    />,
  );
  await screen.findByText('Cartas selecionadas: 7/7');
  fireEvent.click(screen.getByRole('button', { name: /Noemi/ }));
  const start = screen.getByRole('button', { name: 'Iniciar batalha' });
  expect(start).toBeEnabled();
  fireEvent.click(start);
  await screen.findByRole('alert');
  expect(start).toHaveAccessibleDescription(
    'Sua coleção não pôde ser confirmada.',
  );
  expect(arenaDeckStorage.load('owner', hero.id, cards).battle).toBeNull();
  expect(m.update).not.toHaveBeenCalled();
});
