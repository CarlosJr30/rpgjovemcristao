// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { CreationExplorerView } from './creation-explorer';

vi.mock('next/link', () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a> }));

const traveler = createTraveler('Viajante Teste', DEFAULT_APPEARANCE, 'traveler-test', '2026-01-01');

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('shows the sanctuary, enters day one, retries the challenge, and returns without claiming canonical progress', () => {
  const storageWrite = vi.spyOn(Storage.prototype, 'setItem');
  render(<CreationExplorerView traveler={traveler} />);
  expect(screen.getByText('Santu\u00e1rio da Jornada')).toBeInTheDocument();
  expect(screen.getByText(/Espa\u00e7o fict\u00edcio do jogo/)).toBeInTheDocument();
  for (const day of ['Luz e trevas', 'Firmamento', 'Terra e vegeta\u00e7\u00e3o', 'Luminares', 'Aves e criaturas das \u00e1guas', 'Animais terrestres e humanidade', 'Descanso e reflex\u00e3o']) {
    expect(screen.getAllByText(new RegExp(day)).length).toBeGreaterThan(0);
  }
  fireEvent.click(screen.getByRole('button', { name: /Entrar no Dia 1/ }));
  expect(screen.getAllByText(/Dia 1/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByLabelText('Firmamento'));
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(screen.getAllByText(/Tente novamente/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByLabelText('Luz e trevas'));
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(screen.getAllByText(/progresso oficial/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByText('Retornar ao Santu\u00e1rio', { selector: 'button' }));
  expect(screen.getByText(/Santu\u00e1rio fict\u00edcio/)).toBeInTheDocument();
  expect(storageWrite).not.toHaveBeenCalled();
});

test('moves with desktop keyboard controls and exposes the real traveler avatar', () => {
  render(<CreationExplorerView traveler={traveler} />);
  const avatar = screen.getByTestId('traveler-position');
  fireEvent.keyDown(document.body, { key: 'ArrowRight' });
  expect(avatar).toHaveStyle({ left: '23%' });
  fireEvent.keyDown(document.body, { key: 'ArrowUp' });
  expect(avatar).toHaveStyle({ top: '45%' });
});
