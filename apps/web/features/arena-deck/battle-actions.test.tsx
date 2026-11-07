// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  arenaCardAvailability,
  createArenaDeckBattle,
  resolveArenaRound,
} from '@rpg/game-engine';
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
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
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
  expect(panel).toHaveFocus();
  expect(within(panel).getAllByRole('article')).toHaveLength(7);
  const handDialog = screen.getByRole('dialog', { name: 'Escolha uma carta' });
  expect(handDialog).toContainElement(panel);
  const lastOption = within(handDialog)
    .getAllByRole('button')
    .filter((button) => !button.hasAttribute('disabled'))
    .at(-1)!;
  fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
  expect(lastOption).toHaveFocus();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('button', { name: 'Fechar cartas' }));
  expect(trigger).toHaveFocus();
  expect(
    screen.queryByRole('region', { name: 'Cartas desta batalha' }),
  ).toBeNull();
});

test('card preview keeps the document scroll lock until the hand is closed', () => {
  const action = vi.fn();
  const battle = start();
  const card = battle.deck!.cards.find(
    (entry) => arenaCardAvailability(battle, entry.id).status === 'available',
  )!;
  const initialOverflow = document.body.style.overflow;
  render(<ArenaBattleActions battle={battle} busy={false} onAction={action} />);
  fireEvent.click(screen.getByRole('button', { name: 'CARTAS' }));
  expect(document.body.style.overflow).toBe('hidden');

  const styleChanges: MutationRecord[] = [];
  const observer = new MutationObserver((records) =>
    styleChanges.push(...records),
  );
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style'],
  });

  const option = screen.getByRole('button', {
    name: `Selecionar carta ${card.name}`,
  });
  fireEvent.click(option);
  expect(document.body.style.overflow).toBe('hidden');
  expect(observer.takeRecords()).toHaveLength(0);
  expect(styleChanges).toHaveLength(0);

  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
  expect(document.body.style.overflow).toBe('hidden');
  expect(observer.takeRecords()).toHaveLength(0);
  expect(styleChanges).toHaveLength(0);
  observer.disconnect();

  fireEvent.click(screen.getByRole('button', { name: 'Fechar cartas' }));
  expect(document.body.style.overflow).toBe(initialOverflow);
  expect(screen.getByRole('button', { name: 'CARTAS' })).toHaveFocus();
  expect(action).not.toHaveBeenCalled();
});

test('an empty battle deck explains the block and links to the existing manual deck flow', () => {
  render(
    <BattleCards
      battle={{ ...start(), deck: undefined }}
      busy={false}
      onPlay={vi.fn()}
    />,
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'não possui um baralho válido',
  );
  expect(screen.getByRole('link', { name: 'Meu Baralho' })).toHaveAttribute(
    'href',
    '/journey/arena/deck',
  );
  expect(screen.queryByRole('button', { name: /Usar carta/ })).toBeNull();
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
test('selection previews canon data; confirm sends once, runs 6.5s and returns with the engine-used state', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  const before = start();
  const card = before.deck!.cards.find(
    (entry) => arenaCardAvailability(before, entry.id).status === 'available',
  )!;
  const after = resolveArenaRound(before, `card:${card.id}`);
  const action = vi.fn().mockResolvedValue(true);
  const skip = vi.fn();
  const view = render(
    <ArenaBattleActions
      battle={before}
      busy={false}
      onAction={action}
      onSkipAnimation={skip}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /CARTAS/ }));
  const option = screen.getByRole('button', {
    name: `Selecionar carta ${card.name}`,
  });
  fireEvent.click(option);
  const dialog = screen.getByRole('dialog');
  expect(
    within(dialog).getByRole('heading', { name: card.name }),
  ).toBeVisible();
  expect(within(dialog).getByText(/FOCO/)).toBeVisible();
  const fullExplanation = within(dialog).getByText('Explicação completa');
  expect(fullExplanation).toBeVisible();
  expect(fullExplanation.closest('details')).not.toHaveAttribute('open');
  expect(action).not.toHaveBeenCalled();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Voltar' }));
  expect(
    screen.getByRole('dialog', { name: 'Escolha uma carta' }),
  ).toBeVisible();
  expect(option).toHaveFocus();
  fireEvent.click(option);
  const preview = screen.getByRole('dialog');
  const confirm = within(preview).getByRole('button', { name: 'Usar carta' });
  await act(async () => {
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await Promise.resolve();
  });
  expect(action).toHaveBeenCalledTimes(1);
  expect(action).toHaveBeenCalledWith(`card:${card.id}`);
  expect(screen.getByText('REVELANDO CARTA')).toBeVisible();
  act(() => vi.advanceTimersByTime(1500));
  expect(screen.getByText('CARTA EM DESTAQUE')).toBeVisible();
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.getByText('AÇÃO CONFIRMADA')).toBeVisible();
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.getByText('RETORNO AO BARALHO')).toBeVisible();
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByRole('status')).toHaveTextContent(
    'Conferindo o resultado',
  );

  view.rerender(
    <ArenaBattleActions
      battle={after}
      busy={false}
      onAction={action}
      onSkipAnimation={skip}
    />,
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'CARTAS' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'CARTAS' }));
  const usedCard = screen.getByRole('article', { name: `Carta: ${card.name}` });
  expect(within(usedCard).getByText('USADA')).toBeVisible();
  expect(within(usedCard).getByRole('button')).toBeDisabled();
  expect(action).toHaveBeenCalledOnce();
  expect(skip).not.toHaveBeenCalled();
});

test('a rejected card confirmation shows no cinematic success and restores the dialog controls', async () => {
  const before = start();
  const card = before.deck!.cards.find(
    (entry) => arenaCardAvailability(before, entry.id).status === 'available',
  )!;
  const action = vi.fn().mockResolvedValue(false);
  render(<ArenaBattleActions battle={before} busy={false} onAction={action} />);
  fireEvent.click(screen.getByRole('button', { name: /CARTAS/ }));
  fireEvent.click(
    screen.getByRole('button', { name: `Selecionar carta ${card.name}` }),
  );
  const dialog = screen.getByRole('dialog');
  await act(async () => {
    fireEvent.click(within(dialog).getByRole('button', { name: 'Usar carta' }));
    await Promise.resolve();
  });
  expect(action).toHaveBeenCalledOnce();
  expect(screen.getByRole('alert')).toHaveTextContent('não foi confirmada');
  expect(screen.queryByText('REVELANDO CARTA')).not.toBeInTheDocument();
  expect(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Voltar',
    }),
  ).toBeEnabled();
});

test('skip ends the visual and engine presentation without sending a second card command', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  const before = start();
  const card = before.deck!.cards.find(
    (entry) => arenaCardAvailability(before, entry.id).status === 'available',
  )!;
  const action = vi.fn().mockResolvedValue(true);
  const skip = vi.fn();
  render(
    <ArenaBattleActions
      battle={before}
      busy={false}
      onAction={action}
      onSkipAnimation={skip}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /CARTAS/ }));
  fireEvent.click(
    screen.getByRole('button', { name: `Selecionar carta ${card.name}` }),
  );
  await act(async () => {
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Usar carta',
      }),
    );
    await Promise.resolve();
  });
  const skipButton = screen.getByRole('button', { name: 'Pular animação' });
  fireEvent.click(skipButton);
  expect(action).toHaveBeenCalledOnce();
  expect(skip).toHaveBeenCalledOnce();
  expect(screen.getByText('Conferindo o resultado da batalha…')).toBeVisible();
});

test('reduced motion skips the cinematic presentation and waits for the real battle state', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const before = start();
  const card = before.deck!.cards.find(
    (entry) => arenaCardAvailability(before, entry.id).status === 'available',
  )!;
  const action = vi.fn().mockResolvedValue(true);
  const skip = vi.fn();
  render(
    <ArenaBattleActions
      battle={before}
      busy={false}
      onAction={action}
      onSkipAnimation={skip}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /CARTAS/ }));
  fireEvent.click(
    screen.getByRole('button', { name: `Selecionar carta ${card.name}` }),
  );
  await act(async () => {
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Usar carta',
      }),
    );
    await Promise.resolve();
  });
  expect(action).toHaveBeenCalledOnce();
  expect(skip).toHaveBeenCalledOnce();
  expect(screen.queryByText('REVELANDO CARTA')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Conferindo o resultado',
  );
});

test('level eligibility notice never describes a granted/owned special card', () => {
  render(<ArenaUnlockNotice before={1} after={2} />);
  expect(screen.getByText('REQUISITO DE NÍVEL ATINGIDO')).toBeInTheDocument();
  expect(screen.getByText(/O nível não concede a carta/)).toBeInTheDocument();
  expect(
    screen.queryByText('NOVA HABILIDADE DESBLOQUEADA'),
  ).not.toBeInTheDocument();
});
