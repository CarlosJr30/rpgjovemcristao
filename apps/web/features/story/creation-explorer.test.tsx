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
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { CreationExplorerView } from './creation-explorer';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const traveler = createTraveler(
  'Viajante Teste',
  DEFAULT_APPEARANCE,
  'traveler-test',
  '2026-01-01',
);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('shows the sanctuary, enters day one, retries the challenge, and returns without claiming canonical progress', () => {
  const storageWrite = vi.spyOn(Storage.prototype, 'setItem');
  render(<CreationExplorerView traveler={traveler} />);
  expect(screen.getByText('Santu\u00e1rio da Jornada')).toBeInTheDocument();
  expect(
    screen.getByText(/Espa\u00e7o fict\u00edcio do jogo/),
  ).toBeInTheDocument();
  for (const day of [
    'Luz e trevas',
    'Firmamento',
    'Terra e vegeta\u00e7\u00e3o',
    'Luminares',
    'Aves e criaturas das \u00e1guas',
    'Animais terrestres e humanidade',
    'Descanso e reflex\u00e3o',
  ]) {
    expect(screen.getAllByText(new RegExp(day)).length).toBeGreaterThan(0);
  }
  const alternative = screen.getByRole('list', { name: 'Navegação acessível' });
  fireEvent.click(within(alternative).getByRole('button', { name: /Portal/ }));
  expect(
    screen.queryByText('O que Deus criou no primeiro dia?'),
  ).not.toBeInTheDocument();
  fireEvent.click(
    within(alternative).getByRole('button', { name: 'Marco da luz' }),
  );
  expect(screen.getByTestId('traveler-position')).toHaveStyle({ left: '22%' });
  fireEvent.click(screen.getByLabelText('O firmamento.'));
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(screen.getAllByText(/Tente novamente/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByLabelText('A luz.'));
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(screen.getByText(/separou a luz das trevas/)).toBeInTheDocument();
  fireEvent.click(
    within(alternative).getByRole('button', { name: 'Retornar ao Santuário' }),
  );
  expect(screen.getByText(/Santu\u00e1rio fict\u00edcio/)).toBeInTheDocument();
  expect(storageWrite).not.toHaveBeenCalled();
});

test('moves with desktop keyboard controls and exposes the real traveler avatar', () => {
  render(<CreationExplorerView traveler={traveler} />);
  const avatar = screen.getByTestId('traveler-position');
  const map = screen.getByRole('group', { name: 'Mapa de exploração' });
  fireEvent.keyDown(map, { key: 'ArrowRight' });
  expect(avatar).toHaveStyle({ left: '23%' });
  fireEvent.keyDown(map, { key: 'ArrowUp' });
  expect(avatar).toHaveStyle({ top: '45%' });
});
