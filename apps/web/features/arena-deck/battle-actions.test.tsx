// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { createArenaDeckBattle } from '@rpg/game-engine';
import {
  specialCards,
  specialIds,
} from '../../../../tests/fixtures/arena-special-cards';
import { player, opponent } from '../../../../tests/fixtures/arena-deck';
import { ArenaBattleActions } from './battle-actions';
import { BattleCards } from './editor';
import { ArenaUnlockNotice } from '../journey/components/arena-unlock-notice';
const start = () =>
  createArenaDeckBattle(player, opponent, 42, 'ui', specialIds, specialCards);
afterEach(cleanup);
test('exactly three primary actions; only CARTAS opens seven, Escape closes and restores focus', () => {
  const act = vi.fn();
  render(<ArenaBattleActions battle={start()} busy={false} onAction={act} />);
  const group = screen.getByRole('group', { name: 'Ações da batalha' });
  expect(
    within(group)
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label')),
  ).toEqual(['ATACAR', 'DEFENDER', 'CARTAS']);
  expect(
    screen.queryByRole('button', { name: /ESPECIAIS/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: 'Cartas desta batalha' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'ATACAR' }));
  fireEvent.click(screen.getByRole('button', { name: 'DEFENDER' }));
  expect(act.mock.calls).toEqual([['attack'], ['defend']]);
  const trigger = screen.getByRole('button', { name: 'CARTAS' });
  fireEvent.click(trigger);
  const panel = screen.getByRole('region', { name: 'Cartas desta batalha' });
  expect(trigger).toHaveAttribute('aria-controls', panel.id);
  expect(within(panel).getAllByRole('article')).toHaveLength(7);
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
test('actual costs and explicit focus/level/used/closed reasons disable activation', () => {
  const b = start();
  const view = render(<BattleCards battle={b} busy={false} onPlay={vi.fn()} />);
  const strike = () =>
    screen.getByRole('article', { name: 'Carta: Teste: Golpe do Caminho' });
  expect(
    within(strike()).getByText('Custo: 2 Foco · Nível mínimo: 2'),
  ).toBeInTheDocument();
  expect(
    within(strike()).getByText('Você precisa de mais 2 pontos de Foco.'),
  ).toBeInTheDocument();
  expect(within(strike()).getByRole('button')).toBeDisabled();
  const charged = {
    ...b,
    player: {
      ...b.player,
      focusPoints: 1,
      snapshot: {
        ...player,
        specialModifiers: { 'path-strike': { focusDiscount: 1 } },
      },
    },
  };
  view.rerender(<BattleCards battle={charged} busy={false} onPlay={vi.fn()} />);
  expect(
    within(strike()).getByText('Custo: 1 Foco · Nível mínimo: 2'),
  ).toBeInTheDocument();
  expect(within(strike()).getByRole('button')).toBeEnabled();
  view.rerender(
    <BattleCards
      battle={{
        ...charged,
        player: { ...charged.player, snapshot: { ...player, level: 1 } },
      }}
      busy={false}
      onPlay={vi.fn()}
    />,
  );
  expect(
    within(strike()).getByText(/após atingir o nível 2/),
  ).toBeInTheDocument();
  expect(within(strike()).getByRole('button')).toBeDisabled();
  view.rerender(
    <BattleCards
      battle={{ ...b, deck: { ...b.deck!, usedIds: [specialIds[0]] } }}
      busy={false}
      onPlay={vi.fn()}
    />,
  );
  expect(within(strike()).getByText('USADA')).toBeInTheDocument();
  expect(
    within(strike()).getByText('Esta carta já foi utilizada nesta batalha.'),
  ).toBeInTheDocument();
  view.rerender(
    <BattleCards
      battle={{ ...b, status: 'finished' }}
      busy={false}
      onPlay={vi.fn()}
    />,
  );
  expect(screen.getAllByText('Esta batalha foi encerrada.')).toHaveLength(7);
});
test('busy controls cannot send commands and closed combat has no primary actions', () => {
  const act = vi.fn();
  const view = render(
    <ArenaBattleActions battle={start()} busy onAction={act} />,
  );
  for (const b of screen.getAllByRole('button')) {
    expect(b).toBeDisabled();
    fireEvent.click(b);
  }
  expect(act).not.toHaveBeenCalled();
  view.rerender(
    <ArenaBattleActions
      battle={{ ...start(), status: 'finished' }}
      busy={false}
      onAction={act}
    />,
  );
  expect(screen.queryByRole('group')).not.toBeInTheDocument();
});
test('level eligibility notice never describes a granted/owned special card', () => {
  render(<ArenaUnlockNotice before={1} after={2} />);
  expect(screen.getByText('REQUISITO DE NÍVEL ATINGIDO')).toBeInTheDocument();
  expect(screen.getByText(/O nível não concede a carta/)).toBeInTheDocument();
  expect(
    screen.queryByText('NOVA HABILIDADE DESBLOQUEADA'),
  ).not.toBeInTheDocument();
});
