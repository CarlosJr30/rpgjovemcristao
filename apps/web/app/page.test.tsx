// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import HomePage from './page';
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/',
}));
vi.mock('../lib/supabase/auth-context', () => ({
  useAuth: () => ({ status: 'signedOut' }),
}));
vi.mock('../features/journey/state/use-journey', () => ({
  useJourney: () => ({ status: 'logged-out' }),
}));
afterEach(cleanup);
test('apresenta Guilda e EBD e exige autenticação para começar', async () => {
  render(<HomePage />);
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'Aprenda e caminhe com sua Guilda',
    }),
  ).toBeVisible();
  for (const link of screen.getAllByRole('link', {
    name: 'Entrar ou criar conta',
  }))
    expect(link).toHaveAttribute('href', '/auth');
  expect(
    screen.queryByRole('button', { name: 'Criar Viajante' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Arena|Torre|Loja|Recompensa/),
  ).not.toBeInTheDocument();
});
