// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { DeckEditor, BattleCards } from './editor';
import {
  cards,
  ids,
  player,
  opponent,
} from '../../../../tests/fixtures/arena-deck';
import { createArenaDeckBattle, resolveArenaRound } from '@rpg/game-engine';
afterEach(cleanup);
test('player with40 cards chooses7, cannot select8, removes/replaces and saves exact IDs', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <DeckEditor
      cards={cards}
      initial={[]}
      locked={false}
      busy={false}
      onSave={save}
    />,
  );
  expect(screen.getByRole('button', { name: 'Salvar baralho' })).toBeDisabled();
  for (let i = 1; i <= 7; i++)
    fireEvent.click(
      within(
        screen.getByRole('article', { name: `Carta: Carta de teste ${i}` }),
      ).getByRole('button'),
    );
  expect(screen.getByText('Cartas selecionadas: 7/7')).toBeInTheDocument();
  expect(
    within(
      screen.getByRole('article', { name: 'Carta: Carta de teste 8' }),
    ).getByRole('button'),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Remover carta 1' }));
  fireEvent.click(
    within(
      screen.getByRole('article', { name: 'Carta: Carta de teste 8' }),
    ).getByRole('button'),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Salvar baralho' }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith([...ids.slice(1), cards[7].id]),
  );
});
test('filters preserve selected slots; unimplemented card is visibly unavailable', () => {
  render(
    <DeckEditor
      cards={cards}
      initial={ids}
      locked={false}
      busy={false}
      onSave={vi.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText('Filtrar por raridade'), {
    target: { value: 'raro' },
  });
  expect(screen.getAllByRole('article')).toHaveLength(20);
  expect(screen.getByText('Cartas selecionadas: 7/7')).toBeInTheDocument();
  expect(
    within(
      screen.getByRole('article', { name: 'Carta: Carta de teste 40' }),
    ).getByRole('button'),
  ).toBeDisabled();
});
test('empty collection and active battle never offer a valid save', () => {
  const { rerender } = render(
    <DeckEditor
      cards={[]}
      initial={[]}
      locked={false}
      busy={false}
      onSave={vi.fn()}
    />,
  );
  expect(screen.getByText(/Você precisa de sete/)).toBeInTheDocument();
  rerender(
    <DeckEditor
      cards={cards}
      initial={ids}
      locked
      busy={false}
      onSave={vi.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: 'Salvar baralho' })).toBeDisabled();
});
test('battle displays7 cards, marks USADA, rejects interaction on used/finished cards', () => {
  const before = createArenaDeckBattle(player, opponent, 42, 'b', ids, cards);
  const next = resolveArenaRound(before, `card:${ids[0]}`);
  const play = vi.fn();
  const { rerender } = render(
    <BattleCards battle={next} busy={false} onPlay={play} />,
  );
  expect(screen.getAllByRole('button')).toHaveLength(7);
  expect(
    screen.getByRole('button', { name: 'Usar carta Carta de teste 1' }),
  ).toBeDisabled();
  expect(screen.getByText('USADA')).toBeInTheDocument();
  rerender(
    <BattleCards
      battle={{ ...next, status: 'finished' }}
      busy={false}
      onPlay={play}
    />,
  );
  expect(
    screen.getAllByRole('button').every((b) => b.hasAttribute('disabled')),
  ).toBe(true);
});
