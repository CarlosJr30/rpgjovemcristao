// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { BattleCards } from './editor';
import { ArenaBattleActions } from './battle-actions';
import { createArenaDeckBattle, resolveArenaCommand } from '@rpg/game-engine';
import {
  MEASURED_CARD_ID,
  measuredHero,
  measuredOpponent,
  syntheticSevenCards,
} from '../../../../tests/fixtures/measured-strike';
afterEach(cleanup);
test('compact hand preserves canonical summary and confirmation still uses the single existing action', async () => {
  const cards = syntheticSevenCards();
  const b = createArenaDeckBattle(
    measuredHero,
    measuredOpponent,
    42,
    '003a-ui-fixture',
    cards.map((card) => card.id),
    cards,
  );
  const onAction = vi.fn().mockResolvedValue(true);
  const view = render(
    <ArenaBattleActions battle={b} busy={false} onAction={onAction} />,
  );
  expect(
    within(
      screen.getByRole('group', { name: 'Ações da batalha' }),
    ).getAllByRole('button'),
  ).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'CARTAS' }));
  const card = () =>
    within(screen.getByRole('article', { name: 'Carta: Golpe Medido' }));
  fireEvent.click(card().getByText('Detalhes'));
  expect(card().getByText('Golpe Medido ×1,15')).toBeVisible();
  expect(card().getByText('Custo: 1 Foco · Nível mínimo: 1')).toBeVisible();
  expect(card().getByText(/comum/)).toBeVisible();
  expect(
    card().getByText('Você precisa de mais 1 ponto de Foco.'),
  ).toBeVisible();
  expect(card().getByRole('button')).toBeDisabled();
  const ready = { ...b, player: { ...b.player, focusPoints: 1 } };
  view.rerender(
    <ArenaBattleActions battle={ready} busy={false} onAction={onAction} />,
  );
  fireEvent.click(card().getByRole('button'));
  expect(
    within(screen.getByRole('dialog')).getByText('Golpe Medido ×1,15'),
  ).toBeVisible();
  expect(onAction).not.toHaveBeenCalled();
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Usar carta',
    }),
  );
  await waitFor(() =>
    expect(onAction).toHaveBeenCalledExactlyOnceWith(
      `card:${MEASURED_CARD_ID}`,
    ),
  );
  const used = resolveArenaCommand(
    ready,
    ready.id,
    ready.round,
    `card:${MEASURED_CARD_ID}`,
  );
  view.rerender(<BattleCards battle={used} busy={false} onPlay={vi.fn()} />);
  expect(card().getByText('USADA')).toBeVisible();
  expect(card().getByText('Usos disponíveis nesta batalha: 0.')).toBeVisible();
  expect(card().getByRole('button')).toBeDisabled();
});
