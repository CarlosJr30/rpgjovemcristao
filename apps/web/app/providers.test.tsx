// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import type { ReactNode } from 'react';
const state = vi.hoisted(() => ({
  status: 'restricted',
  pathname: '/journey/guild',
  replace: vi.fn(),
}));
vi.mock('../lib/supabase/auth-context', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ status: state.status }),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ replace: state.replace }),
}));
vi.mock('../features/training-qa/provider', () => ({
  TrainingQAProvider: ({ children }: { children: ReactNode }) => (
    <section data-testid="qa-provider">{children}</section>
  ),
}));
vi.mock('../features/auth/auth-screen', () => ({
  AuthScreen: () => <p>Login</p>,
}));
vi.mock('../lib/supabase/auth', () => ({ signOut: vi.fn() }));
import { Providers } from './providers';
afterEach(cleanup);
test('restricted identity never mounts the game', () => {
  state.status = 'restricted';
  state.pathname = '/journey/guild';
  render(
    <Providers>
      <p>Private game data</p>
    </Providers>,
  );
  expect(
    screen.getByRole('heading', { name: /exclusivo para maiores de 18 anos/ }),
  ).toBeVisible();
  expect(screen.queryByText('Private game data')).not.toBeInTheDocument();
});
test('verified adult mounts the existing game and training providers', () => {
  state.status = 'signedIn';
  state.pathname = '/journey/guild';
  render(
    <Providers>
      <p>Private game data</p>
    </Providers>,
  );
  expect(screen.getByText('Private game data')).toBeVisible();
  expect(screen.getByTestId('qa-provider')).toBeVisible();
});
test('restricted user retains access to privacy information', () => {
  state.status = 'restricted';
  state.pathname = '/privacy';
  render(
    <Providers>
      <p>Privacy notice</p>
    </Providers>,
  );
  expect(screen.getByText('Privacy notice')).toBeVisible();
});
