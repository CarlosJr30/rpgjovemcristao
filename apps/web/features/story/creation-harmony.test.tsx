// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { CreationHarmony } from './creation-harmony';

const order = [
  'Luz e trevas',
  'Firmamento',
  'Terra, mares e vegetação',
  'Luminares',
  'Aves e criaturas das águas',
  'Animais terrestres e humanidade',
  'Descanso do sétimo dia',
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('shuffles seven unique symbols, rejects a wrong sequence, and supports undo, reset, and success', () => {
  const writes = vi.spyOn(Storage.prototype, 'setItem');
  render(<CreationHarmony />);
  const bank = within(
    screen.getByRole('list', { name: 'Símbolos embaralhados' }),
  );
  const slots = within(
    screen.getByRole('list', { name: 'Posições da sequência' }),
  ).getAllByRole('listitem');
  const names = bank.getAllByRole('button').map((button) => button.lastElementChild?.textContent);
  expect(new Set(names)).toEqual(new Set(order));
  expect(names).not.toEqual(order);
  expect(slots).toHaveLength(7);
  const choose = (name: string) =>
    fireEvent.click(bank.getByRole('button', { name }));
  const verify = screen.getByRole('button', { name: 'Verificar sequência' });
  const undo = screen.getByRole('button', { name: 'Desfazer' });
  const reset = screen.getByRole('button', { name: 'Reiniciar' });
  expect(verify).toHaveAttribute('aria-disabled', 'true');
  expect(undo).toHaveAttribute('aria-disabled', 'true');

  choose(order[1]);
  fireEvent.click(bank.getByRole('button', { name: /Firmamento/ }));
  expect(slots[0]).toHaveTextContent('Posição 1');
  expect(slots[0]).toHaveTextContent('Firmamento');
  expect(slots[1]).toHaveTextContent('Vazia');
  fireEvent.click(undo);
  expect(slots[0]).toHaveTextContent('Vazia');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Firmamento voltou à lista',
  );

  [...order].reverse().forEach(choose);
  fireEvent.click(verify);
  expect(screen.getByRole('status')).toHaveTextContent(
    /fora de ordem.*Gênesis 1:1–2:3/,
  );
  fireEvent.click(reset);
  expect(slots.every((slot) => slot.textContent?.includes('Vazia'))).toBe(true);
  expect(screen.getByRole('status')).toHaveTextContent('Tabuleiro reiniciado');

  order.forEach(choose);
  fireEvent.click(verify);
  expect(screen.getByRole('status')).toHaveTextContent('Sequência correta!');
  expect(
    screen.getByRole('region', { name: 'Harmonia da Criação' }),
  ).toHaveAttribute('data-result', 'correct');
  expect(verify).toHaveAttribute('aria-disabled', 'true');
  expect(writes).not.toHaveBeenCalled();
  fireEvent.click(reset);
  expect(
    screen.getByRole('region', { name: 'Harmonia da Criação' }),
  ).not.toHaveAttribute('data-result');
});
