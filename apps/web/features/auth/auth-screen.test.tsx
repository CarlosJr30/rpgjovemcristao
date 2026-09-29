// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const {
  router,
  signIn,
  getSession,
  getAuthenticatedUser,
  hasPersistedSupabaseSession,
  continueLocally,
} = vi.hoisted(() => ({
  router: { replace: vi.fn() },
  signIn: vi.fn(),
  getSession: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  hasPersistedSupabaseSession: vi.fn(),
  continueLocally: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('../../lib/supabase/auth', () => ({
  signIn,
  signOut: vi.fn(),
  signUp: vi.fn(),
  getSession,
  getAuthenticatedUser,
}));
vi.mock('../../lib/supabase/client', () => ({ hasPersistedSupabaseSession }));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => ({
    status: 'signedOut',
    session: null,
    user: null,
    isAuthenticated: false,
    continueLocally,
  }),
}));

import { AuthScreen } from './auth-screen';

const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
const session = { user };

const submitSignIn = () => {
  fireEvent.change(screen.getByLabelText('E-mail'), {
    target: { value: 'teste@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Senha'), {
    target: { value: 'senha-segura' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
};

beforeEach(() => {
  vi.clearAllMocks();
  hasPersistedSupabaseSession.mockReturnValue(true);
});

afterEach(cleanup);

describe('Auth sign in contract', () => {
  test('navigates only after signIn, getSession, getUser and storage agree', async () => {
    signIn.mockResolvedValue({ data: { user, session }, error: null });
    getSession.mockResolvedValue(session);
    getAuthenticatedUser.mockResolvedValue(user);
    render(<AuthScreen />);

    submitSignIn();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(getAuthenticatedUser).toHaveBeenCalledTimes(1);
  });

  test('does not navigate when signIn returns no session', async () => {
    signIn.mockResolvedValue({ data: { user, session: null }, error: null });
    render(<AuthScreen />);

    submitSignIn();

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Não foi possível entrar.');
    expect(router.replace).not.toHaveBeenCalled();
    expect(getSession).not.toHaveBeenCalled();
  });

  test('enters local-only mode only from the explicit action', () => {
    render(<AuthScreen />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Continuar somente neste navegador',
      }),
    );

    expect(continueLocally).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
