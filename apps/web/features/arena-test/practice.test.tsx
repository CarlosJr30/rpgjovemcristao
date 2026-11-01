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
const cards = getArenaCardCatalog(),
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
      trainingLevel={50}
    />,
  );
  await screen.findByText('Cartas selecionadas: 7/7');
  fireEvent.click(screen.getByRole('button', { name: /Davi, o Aprendiz/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar batalha' }));
  await screen.findByRole('group', { name: 'Ações da batalha' });
  expect(
    arenaDeckStorage.load('owner', hero.id, cards).battle?.player.snapshot
      .level,
  ).toBe(50);
  expect(hero.level).toBe(1);
  expect(hero.xp).toBe(0);
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
  expect(m.update).not.toHaveBeenCalled();
});
