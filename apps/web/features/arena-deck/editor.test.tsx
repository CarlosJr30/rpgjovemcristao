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
import {
  createArenaDeckBattle,
  getArenaCardCatalog,
  resolveArenaRound,
  type ArenaCard,
} from '@rpg/game-engine';
import { ARENA_CARD_ILLUSTRATIONS } from './card-illustrations';
afterEach(cleanup);
const officialCards: ArenaCard[] = getArenaCardCatalog().map(
  ({ id, name, rarity, type, action }) => ({
    id,
    name,
    rarity,
    type,
    action,
  }),
);
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
  const selected = screen.getByRole('article', {
    name: 'Carta: Carta de teste 1',
  });
  expect(selected).toHaveAttribute('data-art-status', 'pending');
  expect(within(selected).getByText('Símbolo de ação')).toBeVisible();
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

test('approved official illustrations remain selectable in the existing deck editor', () => {
  expect(Object.keys(ARENA_CARD_ILLUSTRATIONS).sort()).toEqual(
    officialCards.map((card) => card.id).sort(),
  );
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <DeckEditor
      cards={officialCards}
      initial={[]}
      locked={false}
      busy={false}
      onSave={save}
    />,
  );

  for (const card of officialCards) {
    const article = screen.getByRole('article', {
      name: `Carta: ${card.name}`,
    });
    const illustration = ARENA_CARD_ILLUSTRATIONS[card.id];
    expect(article).toHaveAttribute('data-art-status', 'approved');
    expect(within(article).getByRole('img')).toHaveAttribute(
      'src',
      illustration.src,
    );
    expect(within(article).getByRole('img')).toHaveAttribute(
      'alt',
      illustration.alt,
    );
    fireEvent.click(
      within(article).getByRole('button', { name: 'Selecionar carta' }),
    );
    expect(article).toHaveAttribute('data-selected', 'true');
  }
  expect(screen.getByText('Cartas selecionadas: 7/7')).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
});

test('official art is reused in battle while used cards retain their original state', () => {
  const battle = createArenaDeckBattle(
    player,
    opponent,
    42,
    'official-art',
    officialCards.map((card) => card.id),
    officialCards,
  );
  const usedId = officialCards[0].id;
  const usedBattle = {
    ...battle,
    deck: { ...battle.deck!, usedIds: [usedId] },
  };
  render(<BattleCards battle={usedBattle} busy={false} onPlay={vi.fn()} />);

  for (const card of officialCards) {
    const article = screen.getByRole('article', {
      name: `Carta: ${card.name}`,
    });
    expect(within(article).getByRole('img')).toHaveAttribute(
      'src',
      ARENA_CARD_ILLUSTRATIONS[card.id].src,
    );
  }
  const usedArticle = screen.getByRole('article', {
    name: `Carta: ${officialCards[0].name}`,
  });
  expect(usedArticle).toHaveAttribute('data-used', 'true');
  expect(within(usedArticle).getByText('USADA')).toBeVisible();
  expect(
    within(usedArticle).getByRole('button', {
      name: `Usar carta ${officialCards[0].name}`,
    }),
  ).toBeDisabled();
});
