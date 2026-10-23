// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { createArenaBattle } from '@rpg/game-engine';
import { TRAINING_OPPONENTS } from './data/arena';
import {
  ArenaFocusMeter,
  ArenaSpecialPanel,
} from './components/arena-specials';
afterEach(cleanup);

test('nível 1 explica locks e Foco mecânico sem executar especial', () => {
  const fighter = createArenaBattle(
    TRAINING_OPPONENTS[0],
    TRAINING_OPPONENTS[1],
    2,
  ).player;
  const select = vi.fn();
  render(
    <>
      <ArenaFocusMeter fighter={fighter} />
      <ArenaSpecialPanel
        fighter={fighter}
        busy={false}
        onSelect={select}
        onClose={vi.fn()}
      />
    </>,
  );
  expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe('0');
  expect(screen.getByRole('meter').getAttribute('aria-valuemax')).toBe('3');
  const locked = screen.getByRole('button', { name: /Discernimento/ });
  expect(locked.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(locked);
  expect(screen.getByRole('status').textContent).toContain(
    'Desbloqueia no nível 6',
  );
  expect(select).not.toHaveBeenCalled();
  expect(screen.getAllByRole('button')).toHaveLength(5);
  expect(screen.queryByRole('button', { name: /Golpe Medido/ })).toBeNull();
});

test('custo insuficiente comunica feedback; cheio seleciona uma vez e encerra painel', () => {
  const fighter = createArenaBattle(
    { ...TRAINING_OPPONENTS[0], level: 8 },
    TRAINING_OPPONENTS[1],
    2,
  ).player;
  const select = vi.fn(),
    close = vi.fn();
  const view = render(
    <ArenaSpecialPanel
      fighter={fighter}
      busy={false}
      onSelect={select}
      onClose={close}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Golpe do Caminho/ }));
  expect(screen.getByRole('status').textContent).toContain('FOCO INSUFICIENTE');
  expect(select).not.toHaveBeenCalled();
  view.rerender(
    <ArenaSpecialPanel
      fighter={{ ...fighter, focusPoints: 3 }}
      busy={false}
      onSelect={select}
      onClose={close}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Golpe do Caminho/ }));
  expect(select).toHaveBeenCalledExactlyOnceWith('special:path-strike');
  expect(close).toHaveBeenCalledOnce();
});
