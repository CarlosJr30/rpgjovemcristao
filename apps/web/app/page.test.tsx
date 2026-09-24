// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import HomePage from './page';
const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => '/' }));
afterEach(cleanup);
test('apresenta o jogo e permite iniciar a criação sem Viajante', async () => {
  render(<HomePage />);
  expect(
    screen.getByRole('heading', { level: 1, name: 'RPG Jovem Cristão' }),
  ).toBeVisible();
  const start = await screen.findByRole('button', { name: 'Criar Viajante' });
  expect(start).toBeEnabled();
  fireEvent.click(start);
  expect(push).toHaveBeenCalledWith('/journey/create');
});
